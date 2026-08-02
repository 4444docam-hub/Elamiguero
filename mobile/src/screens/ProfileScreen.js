import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Image,
  Alert, ScrollView, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { COLORS, getProfileImageUrl } from '../utils/constants';

const ProfileScreen = () => {
  const { user, profile, signOut, updateProfile, uploadProfileImage } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    bio: profile?.bio || '',
    age: profile?.age?.toString() || ''
  });

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitas permitir acceso a la galería para cambiar tu foto de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setLoading(true);
        const uploadResult = await uploadProfileImage({
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'profile-image.jpg'
        });
        setLoading(false);

        if (uploadResult.success) {
          Alert.alert('Success', 'Profile image updated');
        } else {
          Alert.alert('Error', uploadResult.error);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    const result = await updateProfile({
      name: formData.name,
      bio: formData.bio,
      age: formData.age ? parseInt(formData.age) : undefined
    });
    setLoading(false);

    if (result.success) {
      setEditing(false);
      Alert.alert('Success', 'Profile updated');
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: signOut, style: 'destructive' }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <TouchableOpacity onPress={handlePickImage} style={styles.imageContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} />
          ) : (
            <Image
              source={{ uri: getProfileImageUrl(profile?.profile_image) }}
              style={styles.profileImage}
            />
          )}
          <View style={styles.editBadge}>
            <Ionicons name="camera" size={20} color={COLORS.white} />
          </View>
        </TouchableOpacity>

        {editing ? (
          <View style={styles.editForm}>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(v) => setFormData(prev => ({ ...prev, name: v }))}
              placeholder="Name"
            />
            <TextInput
              style={styles.input}
              value={formData.bio}
              onChangeText={(v) => setFormData(prev => ({ ...prev, bio: v }))}
              placeholder="Bio"
              multiline
            />
            <TextInput
              style={styles.input}
              value={formData.age}
              onChangeText={(v) => setFormData(prev => ({ ...prev, age: v }))}
              placeholder="Age"
              keyboardType="numeric"
            />
            <View style={styles.editButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEditing(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.infoSection}>
            <Text style={styles.name}>{profile?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
            {profile?.age && <Text style={styles.age}>{profile.age} years old</Text>}
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Ionicons name="pencil" size={20} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.menuSection}>
        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
          <Text style={[styles.menuText, { color: COLORS.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20, backgroundColor: COLORS.white,
  },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: COLORS.text },
  profileSection: {
    alignItems: 'center', paddingVertical: 30, backgroundColor: COLORS.white, marginBottom: 10,
  },
  imageContainer: { position: 'relative', marginBottom: 20 },
  profileImage: { width: 120, height: 120, borderRadius: 60 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary,
    width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
    borderWidth: 3, borderColor: COLORS.white,
  },
  infoSection: { alignItems: 'center' },
  name: { fontSize: 24, fontWeight: 'bold', color: COLORS.text, marginBottom: 5 },
  email: { fontSize: 16, color: COLORS.textLight, marginBottom: 10 },
  bio: {
    fontSize: 14, color: COLORS.textLight, textAlign: 'center',
    marginBottom: 10, paddingHorizontal: 40,
  },
  age: { fontSize: 14, color: COLORS.textLight, marginBottom: 15 },
  editButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8,
    paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: COLORS.primary,
  },
  editButtonText: { color: COLORS.primary, fontSize: 14, fontWeight: '500' },
  editForm: { width: '80%', gap: 15 },
  input: {
    backgroundColor: COLORS.background, borderRadius: 12, padding: 14,
    fontSize: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  editButtons: { flexDirection: 'row', justifyContent: 'center', gap: 15, marginTop: 10 },
  cancelButton: {
    paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelText: { color: COLORS.textLight },
  saveButton: {
    paddingVertical: 10, paddingHorizontal: 25, borderRadius: 20, backgroundColor: COLORS.primary,
  },
  saveText: { color: COLORS.white, fontWeight: '600' },
  menuSection: { backgroundColor: COLORS.white, paddingTop: 10 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 15, paddingVertical: 18,
    paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  menuText: { fontSize: 16 },
});

export default ProfileScreen;
