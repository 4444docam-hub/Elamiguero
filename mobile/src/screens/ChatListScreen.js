import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { conversationsAPI, messagesAPI } from '../services/api';
import { COLORS, getProfileImageUrl } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ChatListScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { refreshCounts } = useNotifications();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const feedRef = useRef(null);

  const loadConversations = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const convs = await conversationsAPI.getConversations(user.id);
      setConversations(convs);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [user.id]);

  useFocusEffect(
    useCallback(() => {
      loadConversations();
      refreshCounts();
    }, [loadConversations, refreshCounts])
  );

  useEffect(() => {
    const sub = messagesAPI.subscribeToMessagesFeed(user.id, (msg) => {
      if (msg.sender_id !== user.id) {
        loadConversations(false);
        refreshCounts();
      }
    });
    feedRef.current = sub;

    return () => {
      if (feedRef.current) {
        messagesAPI.unsubscribeFromMessages(feedRef.current);
        feedRef.current = null;
      }
    };
  }, [user.id, loadConversations, refreshCounts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConversations();
    setRefreshing(false);
  };

  const getOtherUser = (conversation) => {
    return conversation.participants?.find(p => p.id !== user.id) || conversation.participants?.[0];
  };

  const formatTime = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (days === 1) return 'Yesterday';
    if (days < 7) return d.toLocaleDateString([], { weekday: 'long' });
    return d.toLocaleDateString();
  };

  const renderConversation = ({ item }) => {
    const otherUser = getOtherUser(item);
    const lastMessage = item.lastMessage;

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          userId: otherUser?.id,
          userName: otherUser?.name,
          userImage: otherUser?.profile_image
        })}
      >
        <Image
          source={{ uri: getProfileImageUrl(otherUser?.profile_image) }}
          style={styles.avatar}
        />
        <View style={styles.conversationInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{otherUser?.name}</Text>
            <View style={styles.rightSide}>
              {lastMessage?.created_at && (
                <Text style={styles.time}>{formatTime(lastMessage.created_at)}</Text>
              )}
              {item.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {item.unreadCount > 99 ? '99+' : item.unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
          {lastMessage && (
            <Text style={[styles.lastMessage, item.unreadCount > 0 && styles.lastMessageUnread]} numberOfLines={1}>
              {lastMessage.image_url ? '📷 Image' : lastMessage.content}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={80} color={COLORS.border} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>Start chatting with your friends!</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  conversationItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15 },
  conversationInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text, flex: 1 },
  rightSide: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontSize: 12, color: COLORS.textLight },
  lastMessage: { fontSize: 14, color: COLORS.textLight },
  lastMessageUnread: { color: COLORS.text, fontWeight: '500' },
  badge: {
    minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 20, fontWeight: '600', color: COLORS.text, marginTop: 20 },
  emptySubtext: { fontSize: 14, color: COLORS.textLight, marginTop: 10, textAlign: 'center' },
});

export default ChatListScreen;
