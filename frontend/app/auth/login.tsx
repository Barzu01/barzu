import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { 
  sendVerificationCode, 
  verifyCode, 
  initRecaptcha 
} from '../../services/firebaseAuth';

// На мобильных устройствах (Expo Go) Firebase Phone Auth требует нативную сборку
// Поэтому на мобильных используем тестовый режим, а на веб - реальный Firebase SMS
const USE_TEST_MODE_DEFAULT = Platform.OS !== 'web';
const TEST_CODE = '1234';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [useTestMode, setUseTestMode] = useState(USE_TEST_MODE);
  const [messageModal, setMessageModal] = useState<{visible: boolean; type: 'success' | 'error'; title: string; message: string}>({
    visible: false,
    type: 'error',
    title: '',
    message: ''
  });
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Initialize reCAPTCHA for web (only if not in test mode)
  useEffect(() => {
    if (!useTestMode && Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => {
        initRecaptcha('recaptcha-container');
      }, 1000);
    }
  }, [useTestMode]);

  const showMessage = (type: 'success' | 'error', title: string, message: string) => {
    setMessageModal({ visible: true, type, title, message });
  };

  const handleSendCode = async () => {
    if (!phone || phone.length < 9) {
      showMessage('error', t('messages.error'), t('auth.enterValidPhone'));
      return;
    }

    setLoading(true);
    
    try {
      if (useTestMode) {
        // Тестовый режим - сразу показываем ввод кода
        setStep('code');
        showMessage('success', 'Тестовый режим', `Используйте код: ${TEST_CODE}`);
      } else {
        // Firebase режим
        let formattedPhone = phone.trim();
        if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        
        await sendVerificationCode(formattedPhone);
        setStep('code');
        showMessage('success', 'SMS отправлено', `Код подтверждения отправлен на ${formattedPhone}`);
      }
    } catch (err: any) {
      console.error('Send code error:', err);
      let errorMessage = 'Не удалось отправить код';
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Неверный формат номера телефона';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Слишком много попыток. Попробуйте позже';
      } else if (err.code === 'auth/captcha-check-failed') {
        errorMessage = 'Ошибка reCAPTCHA. Попробуйте тестовый режим';
        // Автоматически переключаемся на тестовый режим
        setUseTestMode(true);
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showMessage('error', t('messages.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length < 4) {
      showMessage('error', t('messages.error'), 'Введите код из SMS');
      return;
    }

    setLoading(true);
    
    try {
      if (useTestMode) {
        // Тестовый режим - проверяем тестовый код
        if (code === TEST_CODE) {
          let formattedPhone = phone.trim();
          if (!formattedPhone.startsWith('+')) {
            formattedPhone = '+' + formattedPhone;
          }
          await login(formattedPhone);
          router.replace('/(tabs)/home');
        } else {
          showMessage('error', t('messages.error'), `Неверный код. Используйте: ${TEST_CODE}`);
        }
      } else {
        // Firebase режим
        const firebaseUser = await verifyCode(code);
        
        if (firebaseUser && firebaseUser.phoneNumber) {
          await login(firebaseUser.phoneNumber);
          router.replace('/(tabs)/home');
        }
      }
    } catch (err: any) {
      console.error('Verify code error:', err);
      let errorMessage = 'Неверный код';
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Неверный код подтверждения';
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'Код истёк. Запросите новый';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      showMessage('error', t('messages.error'), errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Ionicons name="car-sport" size={60} color="#FFFFFF" />
            </View>
            <Text style={styles.appName}>SafedAuto</Text>
            <Text style={styles.subtitle}>{t('app.welcome')}</Text>
          </View>

          <View style={styles.formContainer}>
            {step === 'phone' ? (
              <>
                <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={22} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="+992 900 123 456"
                    placeholderTextColor="#94A3B8"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    autoFocus
                    maxLength={20}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>{t('auth.sendCode')}</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <View style={[styles.infoCard, useTestMode ? styles.testModeCard : null]}>
                  <Ionicons 
                    name={useTestMode ? "flask" : "shield-checkmark"} 
                    size={24} 
                    color={useTestMode ? "#F59E0B" : "#10B981"} 
                  />
                  <Text style={[styles.infoText, useTestMode ? styles.testModeText : null]}>
                    {useTestMode ? (
                      `🧪 Тестовый режим\n📱 Код для входа: ${TEST_CODE}`
                    ) : (
                      `🔐 Защищённый вход через Firebase\n📱 SMS код будет отправлен на ваш номер`
                    )}
                  </Text>
                </View>
                
                {/* Toggle test mode */}
                <TouchableOpacity 
                  style={styles.toggleMode}
                  onPress={() => setUseTestMode(!useTestMode)}
                >
                  <Text style={styles.toggleModeText}>
                    {useTestMode ? 'Включить Firebase SMS' : 'Включить тестовый режим'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.phoneDisplay}>
                  <Ionicons name="phone-portrait-outline" size={20} color="#0066FF" />
                  <Text style={styles.phoneDisplayText}>{phone}</Text>
                  <TouchableOpacity onPress={() => { setStep('phone'); setCode(''); }}>
                    <Ionicons name="pencil" size={18} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.label}>{t('auth.enterCode')}</Text>
                
                {useTestMode && (
                  <View style={styles.testCodeHint}>
                    <Ionicons name="information-circle" size={20} color="#0066FF" />
                    <Text style={styles.testCodeHintText}>Код: <Text style={styles.testCodeBold}>{TEST_CODE}</Text></Text>
                  </View>
                )}
                
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={22} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="• • • •"
                    placeholderTextColor="#94A3B8"
                    value={code}
                    onChangeText={setCode}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.buttonText}>{t('auth.verifyCode')}</Text>
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  <Ionicons name="refresh" size={18} color="#0066FF" />
                  <Text style={styles.resendText}>Отправить код повторно</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* reCAPTCHA container for web */}
          {!useTestMode && Platform.OS === 'web' && (
            <View nativeID="recaptcha-container" style={styles.recaptchaContainer} />
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Message Modal */}
      <Modal visible={messageModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[styles.modalIconContainer, { backgroundColor: messageModal.type === 'success' ? '#D1FAE5' : '#FEE2E2' }]}>
              <Ionicons 
                name={messageModal.type === 'success' ? 'checkmark-circle' : 'alert-circle'} 
                size={48} 
                color={messageModal.type === 'success' ? '#10B981' : '#EF4444'} 
              />
            </View>
            <Text style={styles.modalTitle}>{messageModal.title}</Text>
            <Text style={styles.modalMessage}>{messageModal.message}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: messageModal.type === 'success' ? '#10B981' : '#0066FF' }]}
              onPress={() => setMessageModal({ ...messageModal, visible: false })}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: '#0066FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 20,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 17,
    color: '#0F172A',
  },
  codeInput: {
    letterSpacing: 8,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#0066FF',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#0066FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  infoCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  testModeCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#166534',
    lineHeight: 20,
  },
  testModeText: {
    color: '#92400E',
  },
  toggleMode: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  toggleModeText: {
    fontSize: 14,
    color: '#64748B',
    textDecorationLine: 'underline',
  },
  phoneDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  phoneDisplayText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#0066FF',
  },
  testCodeHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  testCodeHintText: {
    fontSize: 15,
    color: '#0066FF',
  },
  testCodeBold: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: 2,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    padding: 12,
  },
  resendText: {
    fontSize: 15,
    color: '#0066FF',
    fontWeight: '600',
  },
  recaptchaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
