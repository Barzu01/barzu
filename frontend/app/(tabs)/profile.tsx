import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import i18n from '../../i18n';

export default function ProfileScreen() {
  const { user, logout, updateUserProfile } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();
  const [editModalVisible, setEditModalVisible] = React.useState(false);
  const [languageModalVisible, setLanguageModalVisible] = React.useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = React.useState(false);
  const [newName, setNewName] = React.useState('');

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  const confirmLogout = async () => {
    setLogoutModalVisible(false);
    await logout();
    router.replace('/auth/login');
  };

  const handleEditProfile = () => {
    setNewName(user?.name || '');
    setEditModalVisible(true);
  };

  const handleSaveName = async () => {
    if (!newName.trim()) {
      return;
    }

    try {
      await updateUserProfile(newName.trim());
      setEditModalVisible(false);
    } catch (error) {
      console.error('Error updating name:', error);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setLanguageModalVisible(false);
  };

  const MenuItem = ({
    icon,
    title,
    subtitle,
    onPress,
    iconBg = '#F1F5F9',
    iconColor = '#0066FF',
    showArrow = true,
    badge,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    iconBg?: string;
    iconColor?: string;
    showArrow?: boolean;
    badge?: string;
  }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={22} color={iconColor} />
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      {showArrow && <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
              </Text>
            </View>
            <TouchableOpacity style={styles.editAvatarBtn} onPress={handleEditProfile}>
              <Ionicons name="pencil" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user?.name || t('profile.user')}</Text>
          <Text style={styles.userPhone}>{user?.phone}</Text>
          
          <TouchableOpacity 
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Ionicons name="create-outline" size={18} color="#0066FF" />
            <Text style={styles.editProfileText}>{t('profile.editProfile')}</Text>
          </TouchableOpacity>
        </View>

        {/* Edit Name Modal */}
        <Modal
          visible={editModalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setEditModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{t('profile.editName')}</Text>
                <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#0F172A" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>{t('profile.yourName')}</Text>
                <TextInput
                  style={styles.input}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder={t('profile.enterYourName')}
                  placeholderTextColor="#94A3B8"
                  autoFocus
                />
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setEditModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>{t('actions.cancel')}</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.saveButton}
                    onPress={handleSaveName}
                  >
                    <Text style={styles.saveButtonText}>{t('actions.save')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>{t('profile.myListingsSection')}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="car"
              title={t('profile.myListings')}
              subtitle={t('profile.manageListings')}
              onPress={() => router.push('/profile/my-listings')}
              iconBg="#E8F1FF"
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="time"
              title={t('profile.recentlyViewed')}
              subtitle={t('profile.viewHistory')}
              onPress={() => router.push('/profile/recently-viewed')}
              iconBg="#F0FDF4"
              iconColor="#10B981"
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="git-compare"
              title={t('profile.compareCars')}
              subtitle={t('profile.compareSpecs')}
              onPress={() => router.push('/compare')}
              iconBg="#FEF3C7"
              iconColor="#F59E0B"
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>{t('profile.searchSection')}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="options"
              title={t('profile.advancedSearch')}
              subtitle={t('profile.filterByAllParams')}
              onPress={() => router.push('/search/advanced')}
              iconBg="#EDE9FE"
              iconColor="#8B5CF6"
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionLabel}>{t('profile.settingsSection')}</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="language"
              title={t('profile.language')}
              subtitle={i18n.language === 'ru' ? 'Русский' : 'Тоҷикӣ'}
              onPress={() => setLanguageModalVisible(true)}
              iconBg="#F0FDF4"
              iconColor="#10B981"
            />
            <View style={styles.menuDivider} />
            <MenuItem
              icon="notifications"
              title={t('profile.notifications')}
              subtitle={t('profile.notificationSettings')}
              onPress={() => router.push('/notifications')}
              iconBg="#FEF3C7"
              iconColor="#F59E0B"
            />
          </View>
        </View>

        {user?.isAdmin && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionLabel}>{t('profile.adminSection')}</Text>
            <View style={styles.menuCard}>
              <MenuItem
                icon="shield-checkmark"
                title={t('admin.moderation')}
                subtitle={t('profile.manageListings')}
                onPress={() => router.push('/admin/moderation')}
                iconBg="#FEE2E2"
                iconColor="#EF4444"
              />
            </View>
          </View>
        )}

        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="information-circle"
              title={t('profile.about')}
              subtitle="SafedAuto v1.0.0"
              iconBg="#F1F5F9"
              iconColor="#64748B"
              showArrow={false}
            />
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>{t('profile.logoutButton')}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  userPhone: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 16,
  },
  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#E8F1FF',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0066FF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalBody: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    color: '#0F172A',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  saveButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#0066FF',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  menuSection: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
  },
  menuSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  menuBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  menuBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 74,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 32,
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 14,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
});
