import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://carmarket-38.preview.emergentagent.com';
const TELEGRAM_BOT = 'safedauto_auth_bot';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  // Условия использования
  const termsOfServiceText = `📜 Условия использования приложения "SafedAuto"

Дата вступления в силу: 01.02.2026

Добро пожаловать в приложение SafedAuto! Используя данное приложение, вы подтверждаете согласие с настоящими Условиями использования.

1. Общие положения
SafedAuto — это мобильное приложение для размещения и поиска объявлений о продаже автомобилей.

2. Регистрация и использование
- Для использования требуется регистрация по номеру телефона
- Пользователь несёт ответственность за достоверность данных

3. Контактная информация
Email: info@safedauto.tj
Телефон: +992 900 123 456`;

  const privacyPolicyText = `🔒 Политика конфиденциальности "SafedAuto"

Мы уважаем вашу конфиденциальность и защищаем ваши персональные данные.

1. Какие данные мы собираем:
- Номер телефона
- Информация об объявлениях

2. Как мы используем данные:
- Для авторизации в приложении
- Для связи покупателей с продавцами

3. Защита данных:
- Данные хранятся на защищённых серверах
- Мы не передаём данные третьим лицам

Контакт: info@safedauto.tj`;

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned.startsWith('992') && cleaned.length > 0) {
      return '+992' + cleaned.slice(0, 9);
    }
    return '+' + cleaned.slice(0, 12);
  };

  const handlePhoneChange = (value: string) => {
    setPhone(formatPhone(value));
  };

  const requestCode = async () => {
    if (phone.length < 12) {
      Alert.alert('Ошибка', 'Введите корректный номер телефона');
      return;
    }
    
    if (!agreedToTerms) {
      Alert.alert('Ошибка', 'Примите условия использования');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/auth/telegram/request-code?phone=${encodeURIComponent(phone)}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        setGeneratedCode(data.code_for_test || '');
        setStep('code');
        
        if (data.code_sent_to_telegram) {
          // Код отправлен автоматически в Telegram
          Alert.alert(
            '✅ Код отправлен',
            'Проверьте Telegram - код уже там!',
            [{ text: 'OK' }]
          );
        } else {
          // Нужно открыть бота и отправить номер
          Alert.alert(
            '📱 Привяжите Telegram',
            `Чтобы получать коды автоматически:\n\n1. Откройте бот @${TELEGRAM_BOT}\n2. Нажмите /start\n3. Отправьте свой номер телефона\n\nКод для теста: ${data.code_for_test}`,
            [
              { text: 'Открыть бот', onPress: openTelegramBot },
              { text: 'OK' }
            ]
          );
        }
      } else {
        Alert.alert('Ошибка', 'Не удалось отправить код');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Ошибка', 'Проверьте подключение к интернету');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 4) {
      Alert.alert('Ошибка', 'Введите 4-значный код');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/auth/telegram/verify-code?phone=${encodeURIComponent(phone)}&code=${code}`,
        { method: 'POST' }
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          await login(data.user);
          router.replace('/(tabs)/home');
        }
      } else {
        const errorData = await response.json();
        Alert.alert('Ошибка', errorData.detail || 'Неверный код');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Ошибка', 'Проверьте подключение к интернету');
    } finally {
      setLoading(false);
    }
  };

  const openTelegramBot = () => {
    Linking.openURL(`https://t.me/${TELEGRAM_BOT}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="car-sport" size={50} color="#0066FF" />
            </View>
            <Text style={styles.logoText}>SafedAuto</Text>
            <Text style={styles.tagline}>Автомобильная площадка Таджикистана</Text>
          </View>

          {step === 'phone' ? (
            <View style={styles.formContainer}>
              <Text style={styles.title}>Вход в аккаунт</Text>
              <Text style={styles.subtitle}>
                Введите номер телефона для входа
              </Text>

              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <View style={styles.flagContainer}>
                  <Text style={styles.flag}>🇹🇯</Text>
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={handlePhoneChange}
                  placeholder="+992 XXX XX XX XX"
                  keyboardType="phone-pad"
                  maxLength={13}
                />
              </View>

              {/* Terms Checkbox */}
              <TouchableOpacity 
                style={styles.termsContainer}
                onPress={() => setAgreedToTerms(!agreedToTerms)}
              >
                <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                  {agreedToTerms && <Ionicons name="checkmark" size={16} color="#FFF" />}
                </View>
                <Text style={styles.termsText}>
                  Я принимаю{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => setShowTermsModal(true)}
                  >
                    условия использования
                  </Text>
                  {' '}и{' '}
                  <Text 
                    style={styles.termsLink}
                    onPress={() => setShowPrivacyModal(true)}
                  >
                    политику конфиденциальности
                  </Text>
                </Text>
              </TouchableOpacity>

              {/* Send Code Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={requestCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="paper-plane" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Получить код</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Telegram Bot Link */}
              <TouchableOpacity style={styles.telegramLink} onPress={openTelegramBot}>
                <Ionicons name="logo-telegram" size={20} color="#0088cc" />
                <Text style={styles.telegramLinkText}>Открыть бот @{TELEGRAM_BOT}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formContainer}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setStep('phone')}
              >
                <Ionicons name="arrow-back" size={24} color="#0066FF" />
              </TouchableOpacity>

              <Text style={styles.title}>Введите код</Text>
              <Text style={styles.subtitle}>
                Код отправлен на {phone}
              </Text>

              {/* Show code hint for testing */}
              {generatedCode && (
                <View style={styles.codeHint}>
                  <Ionicons name="information-circle" size={20} color="#0066FF" />
                  <Text style={styles.codeHintText}>Код для входа: {generatedCode}</Text>
                </View>
              )}

              {/* Code Input - нормальное поле ввода */}
              <TextInput
                style={styles.codeInput}
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 4))}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="0000"
                placeholderTextColor="#CBD5E1"
                autoFocus
                textAlign="center"
              />

              {/* Verify Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={verifyCode}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.buttonText}>Подтвердить</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend Code */}
              <TouchableOpacity style={styles.resendButton} onPress={requestCode}>
                <Text style={styles.resendText}>Отправить код повторно</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <Modal visible={showTermsModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Условия использования</Text>
            <TouchableOpacity onPress={() => setShowTermsModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>{termsOfServiceText}</Text>
          </ScrollView>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => setShowTermsModal(false)}
          >
            <Text style={styles.modalButtonText}>Понятно</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>

      {/* Privacy Modal */}
      <Modal visible={showPrivacyModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Политика конфиденциальности</Text>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalText}>{privacyPolicyText}</Text>
          </ScrollView>
          <TouchableOpacity 
            style={styles.modalButton}
            onPress={() => setShowPrivacyModal(false)}
          >
            <Text style={styles.modalButtonText}>Понятно</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0066FF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 8,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  flagContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8FAFC',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  flag: {
    fontSize: 24,
  },
  phoneInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 18,
    color: '#0F172A',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  termsText: {
    flex: 1,
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  termsLink: {
    color: '#0066FF',
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066FF',
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#94A3B8',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  telegramLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  telegramLinkText: {
    fontSize: 14,
    color: '#0088cc',
    fontWeight: '500',
  },
  backButton: {
    marginBottom: 16,
  },
  codeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF5FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  codeHintText: {
    fontSize: 15,
    color: '#0066FF',
    fontWeight: '600',
  },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingVertical: 20,
    paddingHorizontal: 24,
    fontSize: 32,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 16,
    marginBottom: 24,
  },
  resendButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 15,
    color: '#0066FF',
    fontWeight: '500',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalText: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  modalButton: {
    margin: 20,
    backgroundColor: '#0066FF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
