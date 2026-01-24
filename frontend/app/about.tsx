import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>О приложении</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Ionicons name="car-sport" size={50} color="#FFFFFF" />
          </View>
          <Text style={styles.appName}>SafedAuto</Text>
          <Text style={styles.version}>Версия 1.0.0</Text>
        </View>

        {/* Description */}
        <View style={styles.descriptionCard}>
          <Text style={styles.descriptionText}>
            SafedAuto — это удобное мобильное приложение для покупки и продажи автомобилей, автозапчастей и аксессуаров.
          </Text>
          
          <Text style={styles.descriptionText}>
            Приложение помогает пользователям быстро размещать объявления, находить подходящие предложения, смотреть видео-обзоры автомобилей и связываться напрямую с продавцами.
          </Text>
          
          <Text style={styles.descriptionText}>
            SafedAuto создано для простоты, удобства и экономии времени — всё, что нужно для автосделок, в одном приложении.
          </Text>
        </View>

        {/* Features */}
        <View style={styles.featuresCard}>
          <Text style={styles.sectionTitle}>Возможности</Text>
          
          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="car" size={20} color="#0066FF" />
            </View>
            <Text style={styles.featureText}>Покупка и продажа автомобилей</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="construct" size={20} color="#F59E0B" />
            </View>
            <Text style={styles.featureText}>Запчасти и аксессуары</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#FCE7F3' }]}>
              <Ionicons name="videocam" size={20} color="#EC4899" />
            </View>
            <Text style={styles.featureText}>Видео-обзоры автомобилей</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#D1FAE5' }]}>
              <Ionicons name="chatbubbles" size={20} color="#10B981" />
            </View>
            <Text style={styles.featureText}>Чат с продавцами</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#EDE9FE' }]}>
              <Ionicons name="notifications" size={20} color="#8B5CF6" />
            </View>
            <Text style={styles.featureText}>Уведомления о новых предложениях</Text>
          </View>
        </View>

        {/* Contact */}
        <View style={styles.contactCard}>
          <Text style={styles.sectionTitle}>Связаться с нами</Text>
          
          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('tel:+992919895434')}
          >
            <Ionicons name="call-outline" size={22} color="#666" />
            <Text style={styles.contactText}>+992 919 89 54 34</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('mailto:support@safedauto.tj')}
          >
            <Ionicons name="mail-outline" size={22} color="#666" />
            <Text style={styles.contactText}>support@safedauto.tj</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.contactItem}
            onPress={() => Linking.openURL('https://safedauto.tj')}
          >
            <Ionicons name="globe-outline" size={22} color="#666" />
            <Text style={styles.contactText}>safedauto.tj</Text>
          </TouchableOpacity>
        </View>

        {/* Copyright */}
        <Text style={styles.copyright}>
          © 2026 SafedAuto. Все права защищены.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1A1A2E',
    marginBottom: 4,
  },
  version: {
    fontSize: 14,
    color: '#8E8E93',
  },
  descriptionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  featuresCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contactText: {
    fontSize: 15,
    color: '#0066FF',
    marginLeft: 12,
  },
  copyright: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 8,
  },
});
