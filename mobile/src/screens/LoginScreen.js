import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/constants';
import { sharedStyles } from '../utils/theme';
import NeonBackground from '../components/NeonBackground';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const result = await signIn(email, password);
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
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.logo}>FriendApp</Text>
            <Text style={styles.subtitle}>Find your new friends</Text>
          </View>

          <View style={styles.form}>
            <TextInput
              style={sharedStyles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor={COLORS.textLight}
            />
            <TextInput
              style={sharedStyles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor={COLORS.textLight}
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.black} />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('Register')}
            >
              <Text style={styles.linkText}>
                Don't have an account? <Text style={styles.linkBold}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </NeonBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logo: {
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 3,
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    textShadowColor: COLORS.secondary,
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  form: {
    gap: 15,
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

export default LoginScreen;
