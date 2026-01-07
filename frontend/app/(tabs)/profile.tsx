import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout'),
      'Вы уверены, что хотите выйти?',
      [
        { text: t('actions.cancel'), style: 'cancel' },
        { text: t('auth.logout'), style: 'destructive', onPress: logout },
      ]
    );
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const MenuItem = ({
    icon,
    title,
    value,
    onPress,
    color = '#000000',
  }: {
    icon: string;
    title: string;
    value?: string;
    onPress?: () => void;
    color?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon as any} size={24} color={color} />
        <Text style={[styles.menuTitle, { color }]}>{title}</Text>
      </View>
      {value && <Text style={styles.menuValue}>{value}</Text>}
      <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('profile.myProfile')}</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person" size={60} color="#0066CC" />
          </View>
          <Text style={styles.userName}>{user?.name || 'Пользователь'}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
        </View>

        <View style={styles.section}>
          <MenuItem
            icon="list"
            title={t('profile.myListings')}
            onPress={() => router.push('/profile/my-listings')}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <MenuItem
            icon="language"
            title={t('profile.language')}
            value={i18n.language === 'ru' ? 'Русский' : 'Тоҷикӣ'}
            onPress={() => {
              Alert.alert(
                t('profile.language'),
                'Выберите язык',
                [
                  { text: 'Русский', onPress: () => changeLanguage('ru') },
                  { text: 'Тоҷикӣ', onPress: () => changeLanguage('tg') },
                  { text: t('actions.cancel'), style: 'cancel' },
                ]
              );
            }}
          />
        </View>

        {user?.isAdmin && (
          <View style={styles.section}>
            <MenuItem
              icon="shield-checkmark"
              title={t('admin.adminPanel')}
              onPress={() => router.push('/admin/moderation')}
              color="#FF9500"
            />
          </View>
        )}

        <View style={styles.section}>
          <MenuItem
            icon="log-out"
            title={t('auth.logout')}
            onPress={handleLogout}
            color="#FF3B30"
          />
        </View>
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
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  content: {
    padding: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5F0FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuValue: {
    fontSize: 14,
    color: '#8E8E93',
    marginRight: 8,
  },
});