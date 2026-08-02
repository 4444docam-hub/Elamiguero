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
  primary: '#6C63FF',
  secondary: '#FF6B6B',
  background: '#F8F9FA',
  card: '#FFFFFF',
  text: '#2D3436',
  textLight: '#636E72',
  border: '#DFE6E9',
  success: '#00B894',
  error: '#FF6B6B',
  white: '#FFFFFF',
  black: '#000000'
};

export const SWIPE_THRESHOLD = 120;
