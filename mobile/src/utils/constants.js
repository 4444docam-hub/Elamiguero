// Supabase Configuration
export const SUPABASE_URL = 'https://jxbegvrbwyaalgvvhfnr.supabase.co';
export const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4YmVndnJid3lhYWxndnZoZm5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTY2OTYsImV4cCI6MjEwMDY3MjY5Nn0.gQq-RAhIxyk18FvXWsKl2sVX9C_gz2oY5iB-GkZuICY';

// Supabase Storage URLs (auto-generated from buckets)
export const getProfileImageUrl = (path) => {
  if (!path || path === 'default-avatar.png') {
    return 'https://via.placeholder.com/150';
  }
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/profile-images/${path}`;
};

export const getChatImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${SUPABASE_URL}/storage/v1/object/public/chat-images/${path}`;
};

export const COLORS = {
  primary: '#00E5FF',
  secondary: '#FF2E88',
  accent: '#B026FF',
  background: '#0B0F2A',
  surface: '#131A3F',
  surfaceLight: '#1A2149',
  card: '#151B3D',
  text: '#EEF2FF',
  textLight: '#8F9CCE',
  border: '#2B3A6E',
  success: '#39FF14',
  error: '#FF2E88',
  white: '#FFFFFF',
  black: '#000000'
};

export const SWIPE_THRESHOLD = 120;
