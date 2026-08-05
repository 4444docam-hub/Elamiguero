import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { friendsAPI, conversationsAPI } from '../services/api';
import { COLORS, getProfileImageUrl } from '../utils/constants';
import { FONTS, pixelShadow } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NeonBackground from '../components/NeonBackground';
import Confetti from '../components/Confetti';

const FriendsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const { refreshCounts } = useNotifications();
  const [activeTab, setActiveTab] = useState('requests');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confetti, setConfetti] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadData();
      friendsAPI.markRequestsViewed(user.id)
        .then(() => refreshCounts())
        .catch(() => {});
    }, [user.id])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [requests, friendsList] = await Promise.all([
        friendsAPI.getPendingRequests(user.id),
        friendsAPI.getFriendsList(user.id)
      ]);
      setPendingRequests(requests);
      setFriends(friendsList);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      await friendsAPI.acceptRequest(requestId);
      loadData();
      refreshCounts();
      setConfetti(true);
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await friendsAPI.rejectRequest(requestId);
      loadData();
      refreshCounts();
    } catch (error) {
      Alert.alert('Error', 'Failed to reject request');
    }
  };

  const handleRemoveFriend = async (friendId) => {
    Alert.alert('Remove Friend', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          try {
            await friendsAPI.removeFriend(user.id, friendId);
            loadData();
          } catch (error) {
            Alert.alert('Error', 'Failed to remove friend');
          }
        }
      }
    ]);
  };

  const startChat = async (friendId, friendName, friendImage) => {
    try {
      const conversation = await conversationsAPI.getOrCreateConversation(user.id, friendId);
      navigation.navigate('ChatsTab', {
        screen: 'Chat',
        params: {
          conversationId: conversation.id,
          userId: friendId,
          userName: friendName,
          userImage: friendImage
        }
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const renderRequest = ({ item }) => (
    <View style={styles.requestItem}>
      <Image source={{ uri: getProfileImageUrl(item.profiles?.profile_image) }} style={styles.avatar} />
      <View style={styles.requestInfo}>
        <Text style={styles.name}>{item.profiles?.name}</Text>
        {item.profiles?.bio && <Text style={styles.bio} numberOfLines={1}>{item.profiles.bio}</Text>}
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={() => handleAccept(item.id)}>
          <Ionicons name="checkmark" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={() => handleReject(item.id)}>
          <Ionicons name="close" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: getProfileImageUrl(item.profile_image) }} style={styles.avatar} />
      <View style={styles.friendInfo}>
        <Text style={styles.name}>{item.name}</Text>
        {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
      </View>
      <View style={styles.friendActions}>
        <TouchableOpacity style={styles.chatBtn} onPress={() => startChat(item.id, item.name, item.profile_image)}>
          <Ionicons name="chatbubble" size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveFriend(item.id)}>
          <Ionicons name="person-remove" size={20} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <NeonBackground style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </NeonBackground>
    );
  }

  return (
    <NeonBackground>
      <Confetti active={confetti} onDone={() => setConfetti(false)} />
      <View style={styles.tabContainer}>
        <TouchableOpacity style={[styles.tab, activeTab === 'requests' && styles.activeTab]} onPress={() => setActiveTab('requests')}>
          <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>Requests ({pendingRequests.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab === 'friends' && styles.activeTab]} onPress={() => setActiveTab('friends')}>
          <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>Friends ({friends.length})</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'requests' ? (
        pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No pending requests</Text>
          </View>
        ) : (
          <FlatList data={pendingRequests} renderItem={renderRequest} keyExtractor={item => item.id} />
        )
      ) : (
        friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={60} color={COLORS.border} />
            <Text style={styles.emptyText}>No friends yet</Text>
            <Text style={styles.emptySubtext}>Start swiping to find friends!</Text>
          </View>
        ) : (
          <FlatList data={friends} renderItem={renderFriend} keyExtractor={item => item.id} />
        )
      )}
    </NeonBackground>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2, borderBottomColor: COLORS.black,
  },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 4, borderBottomColor: COLORS.primary },
  tabText: {
    fontSize: 14, color: COLORS.textLight, fontWeight: '900',
    textTransform: 'uppercase', letterSpacing: 1, fontFamily: FONTS.arcade,
  },
  activeTabText: { color: COLORS.primary },
  requestItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginTop: 12,
    backgroundColor: COLORS.surface, borderRadius: 0, borderWidth: 3, borderColor: COLORS.black,
    ...pixelShadow(4),
  },
  avatar: { width: 55, height: 55, borderRadius: 0, marginRight: 15, borderWidth: 2, borderColor: COLORS.border },
  requestInfo: { flex: 1 },
  name: {
    fontSize: 16, fontWeight: '900', color: COLORS.text, marginBottom: 3,
    fontFamily: FONTS.arcade, letterSpacing: 1, textTransform: 'uppercase',
  },
  bio: { fontSize: 13, color: COLORS.textLight },
  requestActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 45, height: 45, borderRadius: 0, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.black },
  acceptBtn: { backgroundColor: COLORS.success, ...pixelShadow(3) },
  rejectBtn: { backgroundColor: COLORS.error, ...pixelShadow(3) },
  friendItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15, marginHorizontal: 15, marginTop: 12,
    backgroundColor: COLORS.surface, borderRadius: 0, borderWidth: 3, borderColor: COLORS.black,
    ...pixelShadow(4),
  },
  friendInfo: { flex: 1 },
  friendActions: { flexDirection: 'row', gap: 15 },
  chatBtn: { padding: 8 },
  removeBtn: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: {
    fontSize: 18, color: COLORS.text, marginTop: 20,
    fontFamily: FONTS.arcade, textTransform: 'uppercase', letterSpacing: 1,
  },
  emptySubtext: { fontSize: 14, color: COLORS.textLight, marginTop: 10, textAlign: 'center' },
});

export default FriendsScreen;
