import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect } from 'react';

export default function Index() {
  useEffect(() => {
    AsyncStorage.getItem('userId').then((userId) => {
      if (userId) {
        router.replace('/(tabs)/habits');
      } else {
        router.replace('/login');
      }
    });
  }, []);

  return null;
}