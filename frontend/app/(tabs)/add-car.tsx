import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function AddCarScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/add-car/detail');
  }, []);

  return null;
}