import { Stack } from 'expo-router';
import { ThemeProvider } from '../context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile" options={{ headerShown: true, title: 'Profile', headerStyle: { backgroundColor: '#2d6a4f' }, headerTintColor: '#fff', presentation: 'modal' }} />
        <Stack.Screen name="add-habit" options={{ headerShown: true, title: 'Add Habit', headerStyle: { backgroundColor: '#2d6a4f' }, headerTintColor: '#fff' }} />
        <Stack.Screen name="edit-habit" options={{ headerShown: true, title: 'Edit Habit', headerStyle: { backgroundColor: '#2d6a4f' }, headerTintColor: '#fff' }} />
      </Stack>
    </ThemeProvider>
  );
}
