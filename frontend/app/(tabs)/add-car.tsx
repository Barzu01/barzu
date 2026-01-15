import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function AddScreen() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Что хотите добавить?</Text>
        <Text style={styles.headerSubtitle}>Выберите тип публикации</Text>
      </View>

      {/* Options */}
      <View style={styles.optionsContainer}>
        {/* Add Car */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/add-car/detail')}
          activeOpacity={0.8}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: '#E8F1FF' }]}>
            <Ionicons name="car-sport" size={48} color="#0066FF" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>🚗 Объявление</Text>
            <Text style={styles.optionDescription}>
              Продайте автомобиль, мотоцикл, запчасти или аксессуары
            </Text>
          </View>
          <View style={styles.optionArrow}>
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
          </View>
        </TouchableOpacity>

        {/* Add Video Review */}
        <TouchableOpacity 
          style={styles.optionCard}
          onPress={() => router.push('/add-video')}
          activeOpacity={0.8}
        >
          <View style={[styles.optionIconContainer, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="videocam" size={48} color="#EF4444" />
          </View>
          <View style={styles.optionContent}>
            <Text style={styles.optionTitle}>🎬 Видео-обзор</Text>
            <Text style={styles.optionDescription}>
              Снимите обзор авто и поделитесь с сообществом SafedAuto
            </Text>
          </View>
          <View style={styles.optionArrow}>
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#0066FF" />
        <Text style={styles.infoText}>
          Видео-обзоры помогают продать автомобиль быстрее! Покажите авто со всех сторон.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
  },
  optionsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  optionIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionContent: {
    flex: 1,
    marginLeft: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  optionDescription: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  optionArrow: {
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#E8F1FF',
    marginHorizontal: 20,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0066FF',
    lineHeight: 20,
  },
});
