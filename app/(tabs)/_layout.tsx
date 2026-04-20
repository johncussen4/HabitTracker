import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs, router } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

const handleLogout = async () => {
  await AsyncStorage.removeItem('userId');
  router.replace('/login');
};

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2d6a4f',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { backgroundColor: '#fff' },
      headerStyle: { backgroundColor: '#2d6a4f' },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity onPress={handleLogout} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Logout</Text>
        </TouchableOpacity>
      ),
    }}>
      <Tabs.Screen name="habits" options={{ title: 'Habits', tabBarLabel: 'Habits' }} />
      <Tabs.Screen name="categories" options={{ title: 'Categories', tabBarLabel: 'Categories' }} />
      <Tabs.Screen name="targets" options={{ title: 'Targets', tabBarLabel: 'Targets' }} />
      <Tabs.Screen name="insights" options={{ title: 'Insights', tabBarLabel: 'Insights' }} />
    </Tabs>
  );
}