import { Tabs, router } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2d6a4f',
      tabBarInactiveTintColor: '#999',
      tabBarStyle: { backgroundColor: '#fff' },
      headerStyle: { backgroundColor: '#2d6a4f' },
      headerTintColor: '#fff',
      headerRight: () => (
        <TouchableOpacity onPress={() => router.push('/profile')} style={{ marginRight: 16 }}>
          <Text style={{ color: '#fff', fontSize: 22 }}>👤</Text>
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