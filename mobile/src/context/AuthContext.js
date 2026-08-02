import React, { createContext, useState, useEffect, useContext } from 'react';
import { authAPI, profileAPI } from '../services/api';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();

    const { data: { subscription } } = authAPI.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  const checkSession = async () => {
    try {
      const session = await authAPI.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
    } catch (error) {
      console.error('Session check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProfile = async (userId) => {
    try {
      const userProfile = await profileAPI.getProfile(userId);
      setProfile(userProfile);
    } catch (error) {
      console.error('Profile load error:', error);
    }
  };

  const signUp = async ({ name, email, password }) => {
    try {
      const data = await authAPI.signUp({ email, password, name });
      if (data.user) {
        setUser(data.user);
        await loadProfile(data.user.id);
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  };

  const signIn = async (email, password) => {
    try {
      const data = await authAPI.signIn({ email, password });
      setUser(data.user);
      await loadProfile(data.user.id);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Login failed'
      };
    }
  };

  const signOut = async () => {
    try {
      await authAPI.signOut();
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const updated = await profileAPI.updateProfile(user.id, updates);
      setProfile(updated);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  const uploadProfileImage = async (file) => {
    try {
      const result = await profileAPI.uploadProfileImage(user.id, file);
      setProfile(result.user);
      return { success: true, imageUrl: result.imageUrl };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      isAuthenticated: !!user,
      signUp,
      signIn,
      signOut,
      updateProfile,
      uploadProfileImage,
      refreshProfile: () => loadProfile(user?.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
