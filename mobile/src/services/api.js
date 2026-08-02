import { supabase } from './supabase';

// ============================================
// AUTH SERVICES
// ============================================
export const authAPI = {
  signUp: async ({ email, password, name }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });
    if (error) throw error;
    return data;
  },

  signIn: async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  onAuthStateChange: (callback) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// ============================================
// PROFILE SERVICES
// ============================================
export const profileAPI = {
  getProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) throw error;
    return data;
  },

  updateProfile: async (userId, updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  uploadProfileImage: async (userId, file) => {
    const fileExt = file.uri.split('.').pop() || 'jpg';
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('profile-images')
      .upload(filePath, blob, {
        contentType: file.type || 'image/jpeg',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('profile-images')
      .getPublicUrl(filePath);

    const { data, error } = await supabase
      .from('profiles')
      .update({ profile_image: filePath })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { user: data, imageUrl: publicUrl };
  },

  getSuggestions: async (userId) => {
    const { data: friendships } = await supabase
      .from('friendships')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    const { data: sentRequests } = await supabase
      .from('friend_requests')
      .select('to_user_id')
      .eq('from_user_id', userId)
      .eq('status', 'pending');

    const { data: receivedRequests } = await supabase
      .from('friend_requests')
      .select('from_user_id')
      .eq('to_user_id', userId)
      .eq('status', 'pending');

    const excludeIds = new Set([userId]);
    friendships?.forEach(f => {
      excludeIds.add(f.user_id_1);
      excludeIds.add(f.user_id_2);
    });
    sentRequests?.forEach(r => excludeIds.add(r.to_user_id));
    receivedRequests?.forEach(r => excludeIds.add(r.from_user_id));

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
      .eq('is_active', true)
      .limit(20);

    if (error) throw error;
    return data || [];
  },

  searchUsers: async (query) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .limit(20);
    if (error) throw error;
    return data;
  }
};

// ============================================
// FRIEND REQUEST SERVICES
// ============================================
export const friendsAPI = {
  sendRequest: async (fromUserId, toUserId) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
        status: 'pending'
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  acceptRequest: async (requestId) => {
    const { data: request, error: fetchError } = await supabase
      .from('friend_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchError) throw fetchError;

    const user_id_1 = request.from_user_id < request.to_user_id
      ? request.from_user_id
      : request.to_user_id;
    const user_id_2 = request.from_user_id < request.to_user_id
      ? request.to_user_id
      : request.from_user_id;

    const { error: friendError } = await supabase
      .from('friendships')
      .insert({ user_id_1, user_id_2 });

    if (friendError) throw friendError;

    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (updateError) throw updateError;

    return { success: true };
  },

  rejectRequest: async (requestId) => {
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId);
    if (error) throw error;
    return { success: true };
  },

  getPendingRequests: async (userId) => {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(`
        id,
        created_at,
        from_user_id,
        profiles!friend_requests_from_user_id_fkey (
          id,
          name,
          profile_image,
          bio,
          age
        )
      `)
      .eq('to_user_id', userId)
      .eq('status', 'pending');
    if (error) throw error;
    return data;
  },

  getFriendsList: async (userId) => {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('user_id_1, user_id_2')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`);

    if (error) throw error;

    const friendIds = friendships.map(f =>
      f.user_id_1 === userId ? f.user_id_2 : f.user_id_1
    );

    if (friendIds.length === 0) return [];

    const { data: friends, error: friendsError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds);

    if (friendsError) throw friendsError;
    return friends || [];
  },

  removeFriend: async (userId1, userId2) => {
    const user_id_1 = userId1 < userId2 ? userId1 : userId2;
    const user_id_2 = userId1 < userId2 ? userId2 : userId1;

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id_1', user_id_1)
      .eq('user_id_2', user_id_2);

    if (error) throw error;
    return { success: true };
  }
};

// ============================================
// CONVERSATION SERVICES
// ============================================
export const conversationsAPI = {
  getOrCreateConversation: async (userId1, userId2) => {
    const { data: existing } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId1);

    if (existing && existing.length > 0) {
      for (const ep of existing) {
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', ep.conversation_id)
          .neq('user_id', userId1)
          .single();

        if (otherParticipant && otherParticipant.user_id === userId2) {
          const { data: conversation } = await supabase
            .from('conversations')
            .select('*')
            .eq('id', ep.conversation_id)
            .single();
          return conversation;
        }
      }
    }

    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError) throw convError;

    await supabase.from('conversation_participants').insert([
      { conversation_id: newConversation.id, user_id: userId1 },
      { conversation_id: newConversation.id, user_id: userId2 }
    ]);

    return newConversation;
  },

  getConversations: async (userId) => {
    const { data: participations, error } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', userId);

    if (error) throw error;
    if (!participations || participations.length === 0) return [];

    const convIds = participations.map(p => p.conversation_id);

    const { data: conversations, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .in('id', convIds)
      .order('updated_at', { ascending: false });

    if (convError) throw convError;

    const result = [];
    for (const conv of conversations) {
      const { data: participants } = await supabase
        .from('conversation_participants')
        .select('user_id')
        .eq('conversation_id', conv.id);

      const participantIds = participants.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, profile_image')
        .in('id', participantIds);

      const { data: lastMsg } = await supabase
        .from('messages')
        .select('*, profiles!messages_sender_id_fkey(name, profile_image)')
        .eq('conversation_id', conv.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      result.push({
        ...conv,
        participants: profiles,
        lastMessage: lastMsg || null
      });
    }

    return result;
  }
};

// ============================================
// MESSAGE SERVICES
// ============================================
export const messagesAPI = {
  getMessages: async (conversationId) => {
    const { data, error } = await supabase
      .from('messages')
      .select('*, profiles!messages_sender_id_fkey(id, name, profile_image)')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) throw error;
    return data || [];
  },

  sendMessage: async (conversationId, senderId, content, imageUrl = null) => {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content: content || '',
        image_url: imageUrl
      })
      .select('*, profiles!messages_sender_id_fkey(id, name, profile_image)')
      .single();

    if (error) throw error;

    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    return data;
  },

  uploadChatImage: async (conversationId, file) => {
    const fileExt = file.uri.split('.').pop() || 'jpg';
    const fileName = `${conversationId}-${Date.now()}.${fileExt}`;
    const filePath = `chat/${fileName}`;

    const response = await fetch(file.uri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(filePath, blob, {
        contentType: file.type || 'image/jpeg'
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('chat-images')
      .getPublicUrl(filePath);

    return publicUrl;
  },

  subscribeToMessages: (conversationId, callback) => {
    const subscription = supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, name, profile_image')
            .eq('id', payload.new.sender_id)
            .single();

          callback({
            ...payload.new,
            profiles: sender
          });
        }
      )
      .subscribe();

    return subscription;
  },

  unsubscribeFromMessages: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
};

// ============================================
// FRIEND REQUEST REALTIME
// ============================================
export const realtimeAPI = {
  subscribeToFriendRequests: (userId, callback) => {
    const subscription = supabase
      .channel(`friend_requests:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'friend_requests',
          filter: `to_user_id=eq.${userId}`
        },
        async (payload) => {
          const { data: sender } = await supabase
            .from('profiles')
            .select('id, name, profile_image')
            .eq('id', payload.new.from_user_id)
            .single();

          callback({
            ...payload.new,
            from_profile: sender
          });
        }
      )
      .subscribe();

    return subscription;
  },

  unsubscribeFromFriendRequests: (subscription) => {
    if (subscription) {
      supabase.removeChannel(subscription);
    }
  }
};
