import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
  PanResponder,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { profileAPI, friendsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { COLORS, SWIPE_THRESHOLD, getProfileImageUrl } from '../utils/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SCREEN_HEIGHT = Dimensions.get('window').height;

const SwipeCard = ({ user, onSwipeLeft, onSwipeRight }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const likeOpacity = useRef(new Animated.Value(0)).current;
  const dislikeOpacity = useRef(new Animated.Value(0)).current;

  const callbacksRef = useRef({ onSwipeLeft, onSwipeRight });
  callbacksRef.current = { onSwipeLeft, onSwipeRight };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        translateX.setValue(gestureState.dx);
        if (gestureState.dx > 0) {
          likeOpacity.setValue(Math.min(gestureState.dx / SWIPE_THRESHOLD, 1));
        } else {
          dislikeOpacity.setValue(Math.min(-gestureState.dx / SWIPE_THRESHOLD, 1));
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const { onSwipeLeft: left, onSwipeRight: right } = callbacksRef.current;
        if (gestureState.dx > SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: SCREEN_WIDTH * 1.5,
            duration: 220,
            useNativeDriver: true
          }).start(() => right());
        } else if (gestureState.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, {
            toValue: -SCREEN_WIDTH * 1.5,
            duration: 220,
            useNativeDriver: true
          }).start(() => left());
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
          Animated.parallel([
            Animated.spring(likeOpacity, { toValue: 0, useNativeDriver: true }),
            Animated.spring(dislikeOpacity, { toValue: 0, useNativeDriver: true })
          ]).start();
        }
      }
    })
  ).current;

  const rotate = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-12deg', '0deg', '12deg'],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View
      style={[styles.card, { transform: [{ translateX }, { rotate }] }]}
      {...panResponder.panHandlers}
    >
      <Image
        source={{ uri: getProfileImageUrl(user.profile_image) }}
        style={styles.cardImage}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.glowOverlay, styles.glowGreen, { opacity: likeOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.glowOverlay, styles.glowRed, { opacity: dislikeOpacity }]}
      />
      <Animated.View style={[styles.likeStamp, { opacity: likeOpacity }]}>
        <Text style={styles.stampText}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.dislikeStamp, { opacity: dislikeOpacity }]}>
        <Text style={[styles.stampText, styles.dislikeText]}>NOPE</Text>
      </Animated.View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{user.name}{user.age ? `, ${user.age}` : ''}</Text>
        <Text style={styles.cardBio} numberOfLines={2}>{user.bio || 'No bio yet'}</Text>
        {user.interests && user.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {user.interests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
};

const HomeScreen = ({ navigation }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { user, profile } = useAuth();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const suggestions = await profileAPI.getSuggestions(user.id);
      setUsers(suggestions);
    } catch (error) {
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSwipeRight = useCallback(async () => {
    if (currentIndex >= users.length) return;
    const targetUser = users[currentIndex];
    try {
      await friendsAPI.sendRequest(user.id, targetUser.id);
      Alert.alert('Friend Request Sent!', `You sent a friend request to ${targetUser.name}`);
    } catch (error) {
      console.error(error);
    }
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex, users, user]);

  const handleSwipeLeft = useCallback(() => {
    setCurrentIndex(prev => prev + 1);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Friends')}>
          <Ionicons name="people" size={28} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
      <View style={styles.cardsContainer}>
        {currentIndex < users.length ? (
          <>
            {users.slice(currentIndex, currentIndex + 2).reverse().map((u, index) => (
              <SwipeCard
                key={u.id}
                user={u}
                onSwipeLeft={handleSwipeLeft}
                onSwipeRight={handleSwipeRight}
              />
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={80} color={COLORS.border} />
            <Text style={styles.emptyText}>No more users to show</Text>
            <TouchableOpacity style={styles.refreshButton} onPress={loadUsers}>
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {currentIndex < users.length && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={[styles.actionButton, styles.nopeButton]} onPress={handleSwipeLeft}>
            <Ionicons name="close" size={40} color={COLORS.error} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.likeButton]} onPress={handleSwipeRight}>
            <Ionicons name="heart" size={40} color={COLORS.success} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  cardsContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  card: {
    position: 'absolute', width: SCREEN_WIDTH - 40, height: SCREEN_HEIGHT * 0.55,
    backgroundColor: COLORS.white, borderRadius: 20, overflow: 'hidden',
    elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 3.84,
  },
  cardImage: { width: '100%', height: '70%', resizeMode: 'cover' },
  cardInfo: { padding: 15 },
  cardName: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  cardBio: { fontSize: 14, color: COLORS.textLight, marginBottom: 10 },
  interestsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestTag: { backgroundColor: COLORS.primary + '20', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  interestText: { color: COLORS.primary, fontSize: 12, fontWeight: '500' },
  likeStamp: {
    position: 'absolute', top: 50, right: 20, borderWidth: 4, borderColor: COLORS.success,
    borderRadius: 10, padding: 12, transform: [{ rotate: '15deg' }],
  },
  dislikeStamp: {
    position: 'absolute', top: 50, left: 20, borderWidth: 4, borderColor: COLORS.error,
    borderRadius: 10, padding: 12, transform: [{ rotate: '-15deg' }],
  },
  stampText: { fontSize: 28, fontWeight: 'bold', color: COLORS.success },
  dislikeText: { color: COLORS.error },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  glowGreen: {
    borderWidth: 6,
    borderColor: COLORS.success,
    backgroundColor: 'rgba(0, 184, 148, 0.12)',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  glowRed: {
    borderWidth: 6,
    borderColor: COLORS.error,
    backgroundColor: 'rgba(255, 107, 107, 0.12)',
    shadowColor: COLORS.error,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 12,
  },
  actionButtons: {
    flexDirection: 'row', justifyContent: 'center', gap: 40,
    paddingVertical: 20, paddingBottom: 100,
  },
  actionButton: {
    width: 70, height: 70, borderRadius: 35, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.white, elevation: 3,
  },
  nopeButton: { borderWidth: 2, borderColor: COLORS.error },
  likeButton: { borderWidth: 2, borderColor: COLORS.success },
  emptyState: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 18, color: COLORS.textLight, marginTop: 20, marginBottom: 20 },
  refreshButton: { backgroundColor: COLORS.primary, paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  refreshText: { color: COLORS.white, fontSize: 16, fontWeight: '600' },
});

export default HomeScreen;
