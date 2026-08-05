import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';
import { sharedStyles } from '../utils/theme';
import NeonBackground from '../components/NeonBackground';

const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    bio: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRegister = async () => {
    const { name, email, password, confirmPassword, bio, age } = formData;

    if (!name || !email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await signUp({
      name,
      email,
      password,
      bio,
      age: age ? parseInt(age) : undefined
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Error', result.error);
    }
  };

  return (
    <NeonBackground>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButton}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join us and find new friends</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={sharedStyles.input}
              placeholder="Full Name *"
              value={formData.name}
              onChangeText={(v) => handleChange('name', v)}
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={sharedStyles.input}
              placeholder="Email *"
              value={formData.email}
              onChangeText={(v) => handleChange('email', v)}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={sharedStyles.input}
              placeholder="Password *"
              value={formData.password}
              onChangeText={(v) => handleChange('password', v)}
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={sharedStyles.input}
              placeholder="Confirm Password *"
              value={formData.confirmPassword}
              onChangeText={(v) => handleChange('confirmPassword', v)}
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={sharedStyles.input}
              placeholder="Age"
              value={formData.age}
              onChangeText={(v) => handleChange('age', v)}
              keyboardType="numeric"
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={[sharedStyles.input, styles.textArea]}
              placeholder="Tell us about yourself..."
              value={formData.bio}
              onChangeText={(v) => handleChange('bio', v)}
              multiline
              numberOfLines={4}
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.black} />
              ) : (
                <Text style={styles.buttonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.linkText}>
                Already have an account? <Text style={styles.linkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </NeonBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  backButton: {
    color: COLORS.primary,
    fontSize: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
    color: COLORS.text,
    marginBottom: 10,
    textTransform: 'uppercase',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: COLORS.black,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 0,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  form: {
    gap: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 0,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 3,
    borderColor: COLORS.black,
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.black,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  linkBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});

export default RegisterScreen;
