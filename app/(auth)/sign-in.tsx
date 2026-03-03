import { Link, router } from 'expo-router';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../src/context/AuthContext';

export default function SignInScreen() {
  const { signIn } = useAuth();

  const handleSignIn = (): void => {
    signIn();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign In</Text>
        <TouchableOpacity style={styles.button} onPress={handleSignIn}>
          <Text style={styles.buttonText}>Continue (Demo)</Text>
        </TouchableOpacity>
        <Link href="/(auth)/sign-up" style={styles.link}>
          Create account
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16, gap: 16 },
  title: { fontSize: 28, fontWeight: '700' },
  button: {
    backgroundColor: '#111827',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  buttonText: { color: '#FFFFFF', fontWeight: '600' },
  link: { color: '#1D4ED8', fontWeight: '600' },
});
