-- ============================================
-- FriendApp Database Schema for Supabase
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  bio TEXT DEFAULT '',
  age INTEGER CHECK (age >= 18 AND age <= 100),
  profile_image TEXT DEFAULT 'default-avatar.png',
  interests TEXT[] DEFAULT '{}',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  is_active BOOLEAN DEFAULT true,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. FRIEND_REQUESTS TABLE
-- ============================================
CREATE TABLE friend_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

-- ============================================
-- 3. FRIENDSHIPS TABLE (accepted friendships)
-- ============================================
CREATE TABLE friendships (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id_1 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_id_2 UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id_1, user_id_2),
  CHECK (user_id_1 < user_id_2)
);

-- ============================================
-- 4. CONVERSATIONS TABLE
-- ============================================
CREATE TABLE conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 5. CONVERSATION_PARTICIPANTS TABLE
-- ============================================
CREATE TABLE conversation_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

-- ============================================
-- 6. MESSAGES TABLE
-- ============================================
CREATE TABLE messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  content TEXT DEFAULT '',
  image_url TEXT,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES for performance
-- ============================================
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_friend_requests_from ON friend_requests(from_user_id);
CREATE INDEX idx_friend_requests_to ON friend_requests(to_user_id);
CREATE INDEX idx_friend_requests_status ON friend_requests(status);
CREATE INDEX idx_friendships_user1 ON friendships(user_id_1);
CREATE INDEX idx_friendships_user2 ON friendships(user_id_2);
CREATE INDEX idx_conversation_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Friend requests policies
CREATE POLICY "Users can view own friend requests" ON friend_requests
  FOR SELECT USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "Users can create friend requests" ON friend_requests
  FOR INSERT WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "Users can update received requests" ON friend_requests
  FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Users can delete own requests" ON friend_requests
  FOR DELETE USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Friendships policies
CREATE POLICY "Users can view own friendships" ON friendships
  FOR SELECT USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

CREATE POLICY "System can create friendships" ON friendships
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can delete own friendships" ON friendships
  FOR DELETE USING (auth.uid() = user_id_1 OR auth.uid() = user_id_2);

-- Conversations policies
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (true);

-- Conversation participants policies
CREATE POLICY "Users can view own conversation participants" ON conversation_participants
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can add conversation participants" ON conversation_participants
  FOR INSERT WITH CHECK (true);

-- Messages policies
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to own conversations" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark messages read in own conversations" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND user_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Returns all participants of a conversation, but only if the caller
-- belongs to that conversation. SECURITY DEFINER bypasses RLS, so it
-- avoids the infinite recursion of the self-referencing SELECT policy.
CREATE OR REPLACE FUNCTION public.get_conversation_participants(conv_id uuid)
RETURNS SETOF conversation_participants
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT cp.*
  FROM conversation_participants cp
  WHERE cp.conversation_id = conv_id
    AND EXISTS (
      SELECT 1
      FROM conversation_participants me
      WHERE me.conversation_id = conv_id
        AND me.user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.get_conversation_participants(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversation_participants(uuid) TO authenticated;

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, bio, age)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'User'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'bio', ''),
    NULLIF(NEW.raw_user_meta_data->>'age', '')::int
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Create storage bucket for profile images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-images',
  'profile-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create storage bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Storage policies
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Anyone can upload profile images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'profile-images');

CREATE POLICY "Chat images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'chat-images');

CREATE POLICY "Authenticated users can upload chat images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chat-images' AND
    auth.role() = 'authenticated'
  );

-- ============================================
-- REALTIME SUBSCRIPTIONS
-- ============================================

-- Enable realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Enable realtime for friend_requests table
ALTER PUBLICATION supabase_realtime ADD TABLE friend_requests;
