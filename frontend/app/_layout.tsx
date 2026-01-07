import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { Provider as PaperProvider } from 'react-native-paper';
import '../i18n';

export default function RootLayout() {
  return (
    <AuthProvider>
      <PaperProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="car/[id]" />
        </Stack>
      </PaperProvider>
    </AuthProvider>
  );
}