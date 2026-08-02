import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { friendsAPI, conversationsAPI } from '../services/api';
import { COLORS, getProfileImageUrl } from '../utils/constants';
import { useAuth } from '../context/AuthContext';

const FriendsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
      Alert.alert('Success', 'Friend request accepted!');
    } catch (error) {
      Alert.alert('Error', 'Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      await friendsAPI.rejectRequest(requestId);
      loadData();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabContainer: {
    flexDirection: 'row', backgroundColor: COLORS.white,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  tab: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  activeTab: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, color: COLORS.textLight, fontWeight: '500' },
  activeTabText: { color: COLORS.primary },
  requestItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  avatar: { width: 55, height: 55, borderRadius: 27.5, marginRight: 15 },
  requestInfo: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: COLORS.text, marginBottom: 3 },
  bio: { fontSize: 13, color: COLORS.textLight },
  requestActions: { flexDirection: 'row', gap: 10 },
  actionBtn: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center' },
  acceptBtn: { backgroundColor: COLORS.success },
  rejectBtn: { backgroundColor: COLORS.error },
  friendItem: {
    flexDirection: 'row', alignItems: 'center', padding: 15,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  friendInfo: { flex: 1 },
  friendActions: { flexDirection: 'row', gap: 15 },
  chatBtn: { padding: 8 },
  removeBtn: { padding: 8 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
  emptyText: { fontSize: 18, color: COLORS.text, marginTop: 20 },
  emptySubtext: { fontSize: 14, color: COLORS.textLight, marginTop: 10, textAlign: 'center' },
});

export default FriendsScreen;
