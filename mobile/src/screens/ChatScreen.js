import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  Image, KeyboardAvoidingView, Platform, ActivityIndicator, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { messagesAPI, conversationsAPI } from '../services/api';
import { COLORS, getProfileImageUrl, getChatImageUrl, SUPABASE_URL } from '../utils/constants';
import { FONTS, pixelShadow } from '../utils/theme';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NeonBackground from '../components/NeonBackground';
import ImageViewer from '../components/ImageViewer';

const ChatScreen = ({ route }) => {
  const { conversationId, userId, userName, userImage } = route.params;
  const { user, profile } = useAuth();
  const { refreshCounts } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [viewerImage, setViewerImage] = useState(null);
  const subscriptionRef = useRef(null);
  const flatListRef = useRef();

  useEffect(() => {
    loadMessages();

    const sub = messagesAPI.subscribeToMessages(conversationId, handleRealtimeMessage);
    subscriptionRef.current = sub;

    return () => {
      if (subscriptionRef.current) {
        messagesAPI.unsubscribeFromMessages(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [conversationId]);

  const handleRealtimeMessage = (newMessage) => {
    setMessages(prev =>
      prev.some(m => m.id === newMessage.id) ? prev : [...prev, newMessage]
    );
    if (newMessage.sender_id !== user.id) {
      messagesAPI.markConversationRead(conversationId, user.id)
        .then(() => refreshCounts())
        .catch(() => {});
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const msgs = await messagesAPI.getMessages(conversationId);
      setMessages(msgs);
      messagesAPI.markConversationRead(conversationId, user.id)
        .then(() => refreshCounts())
        .catch(() => {});
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendText = async () => {
    if (!newMessage.trim()) return;

    const content = newMessage;
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content,
      sender_id: user.id,
      profiles: { id: user.id, name: profile?.name, profile_image: profile?.profile_image },
      created_at: new Date().toISOString(),
      conversation_id: conversationId
    };

    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      const sent = await messagesAPI.sendMessage(conversationId, user.id, content);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempId && m.id !== sent.id);
        return [...withoutTemp, sent];
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitas permitir acceso a la galería para enviar imágenes.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        const imageUrl = await messagesAPI.uploadChatImage(conversationId, {
          uri: result.assets[0].uri,
          type: 'image/jpeg'
        });

        const tempId = `temp-${Date.now()}`;
        const tempMessage = {
          id: tempId,
          image_url: imageUrl,
          sender_id: user.id,
          profiles: { id: user.id, name: profile?.name, profile_image: profile?.profile_image },
          created_at: new Date().toISOString(),
          conversation_id: conversationId
        };

        setMessages(prev => [...prev, tempMessage]);
        const sent = await messagesAPI.sendMessage(conversationId, user.id, '', imageUrl);
        setMessages(prev => {
          const withoutTemp = prev.filter(m => m.id !== tempId && m.id !== sent.id);
          return [...withoutTemp, sent];
        });
      }
    } catch (error) {
      console.error('Error sending image:', error);
    }
  };

  const formatTime = (date) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }) => {
    const isOwn = item.sender_id === user.id;

    return (
      <View style={[styles.messageContainer, isOwn ? styles.ownMessage : styles.otherMessage]}>
        {!isOwn && (
          <Image
            source={{ uri: getProfileImageUrl(item.profiles?.profile_image) }}
            style={styles.messageAvatar}
          />
        )}
        {isOwn ? (
          <View style={[styles.messageBubble, styles.ownBubble]}>
            {item.image_url && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerImage(item.image_url)}>
                <Image source={{ uri: item.image_url }} style={styles.messageImage} />
              </TouchableOpacity>
            )}
            {item.content ? (
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {item.content}
              </Text>
            ) : null}
            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        ) : (
          <View style={[styles.messageBubble, styles.otherBubble]}>
            {item.image_url && (
              <TouchableOpacity activeOpacity={0.8} onPress={() => setViewerImage(item.image_url)}>
                <Image source={{ uri: item.image_url }} style={styles.messageImage} />
              </TouchableOpacity>
            )}
            {item.content ? (
              <Text style={[styles.messageText, isOwn && styles.ownMessageText]}>
                {item.content}
              </Text>
            ) : null}
            <Text style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        )}
      </View>
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
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.imageButton} onPress={handleSendImage}>
            <Ionicons name="image" size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textLight}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, !newMessage.trim() && styles.sendButtonDisabled]}
            onPress={handleSendText}
            disabled={!newMessage.trim()}
          >
            <Ionicons name="send" size={20} color={COLORS.black} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <ImageViewer
        visible={!!viewerImage}
        imageUrl={viewerImage}
        onClose={() => setViewerImage(null)}
      />
    </NeonBackground>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: 15, paddingBottom: 10 },
  messageContainer: { flexDirection: 'row', marginBottom: 12, maxWidth: '80%' },
  ownMessage: { alignSelf: 'flex-end' },
  otherMessage: { alignSelf: 'flex-start' },
  messageAvatar: { width: 32, height: 32, borderRadius: 0, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  messageBubble: { borderRadius: 0, paddingHorizontal: 14, paddingVertical: 10, maxWidth: '100%' },
  ownBubble: {
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...pixelShadow(3),
  },
  otherBubble: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.black,
    ...pixelShadow(3),
  },
  messageImage: { width: 200, height: 150, borderRadius: 0, marginBottom: 8, borderWidth: 1, borderColor: COLORS.black },
  messageText: { fontSize: 15, color: COLORS.text },
  ownMessageText: { color: COLORS.black, fontWeight: '700' },
  messageTime: { fontSize: 10, color: COLORS.textLight, marginTop: 4, alignSelf: 'flex-end', fontFamily: FONTS.arcade },
  ownMessageTime: { color: 'rgba(0,0,0,0.7)' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end', padding: 10,
    backgroundColor: COLORS.surface, borderTopWidth: 2, borderTopColor: COLORS.black,
  },
  imageButton: { padding: 8, marginRight: 5 },
  input: {
    flex: 1, backgroundColor: COLORS.background, borderRadius: 0,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100,
    borderWidth: 2, borderColor: COLORS.border, color: COLORS.text,
  },
  sendButton: {
    backgroundColor: COLORS.primary, width: 40, height: 40,
    borderRadius: 0, justifyContent: 'center', alignItems: 'center', marginLeft: 10,
    borderWidth: 2, borderColor: COLORS.black, ...pixelShadow(3),
  },
  sendButtonDisabled: { opacity: 0.5 },
});

export default ChatScreen;
