import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { conversationsAPI, messagesAPI } from '../services/api';
import { COLORS, getProfileImageUrl } from '../utils/constants';
import { FONTS, pixelShadow } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NeonBackground from '../components/NeonBackground';

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
      <NeonBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </NeonBackground>
    );
  }

  return (
    <NeonBackground>
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
    </NeonBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  conversationItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginTop: 12,
    backgroundColor: COLORS.surface, borderRadius: 0, borderWidth: 3, borderColor: COLORS.black,
    ...pixelShadow(4),
  },
  avatar: { width: 55, height: 55, borderRadius: 0, marginRight: 15, borderWidth: 2, borderColor: COLORS.border },
  conversationInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  name: {
    fontSize: 16, fontWeight: '900', color: COLORS.text, flex: 1,
    fontFamily: FONTS.arcade, letterSpacing: 1, textTransform: 'uppercase',
  },
  rightSide: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  time: { fontSize: 12, color: COLORS.textLight, fontFamily: FONTS.arcade },
  lastMessage: { fontSize: 14, color: COLORS.textLight },
  lastMessageUnread: { color: COLORS.text, fontWeight: '500' },
  badge: {
    minWidth: 22, height: 22, borderRadius: 0, paddingHorizontal: 6,
    backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.black,
  },
  badgeText: { color: COLORS.black, fontSize: 12, fontWeight: '900' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: {
    fontSize: 20, fontWeight: '900', color: COLORS.text, marginTop: 20,
    fontFamily: FONTS.arcade, textTransform: 'uppercase', letterSpacing: 1,
  },
  emptySubtext: { fontSize: 14, color: COLORS.textLight, marginTop: 10, textAlign: 'center' },
});

export default ChatListScreen;
