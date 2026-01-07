import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const TEST_CODE = '1234'; // Тестовый код для MVP

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  const handleSendCode = () => {
    if (!phone || phone.length < 9) {
      Alert.alert(t('messages.error'), 'Введите корректный номер телефона');
      return;
    }
    setShowCode(true);
    setStep('code');
  };

  const handleVerifyCode = async () => {
    if (code !== TEST_CODE) {
      Alert.alert(t('messages.error'), 'Неверный код. Попробуйте снова.');
      return;
    }

    setLoading(true);
    try {
      await login(phone);
      router.replace('/(tabs)/home');
    } catch (error) {
      Alert.alert(t('messages.error'), 'Ошибка входа. Попробуйте снова.');
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
            <Ionicons name="car-sport" size={80} color="#0066CC" />
            <Text style={styles.appName}>{t('app.name')}</Text>
            <Text style={styles.subtitle}>{t('app.welcome')}</Text>
          </View>

          <View style={styles.formContainer}>
            {step === 'phone' ? (
              <>
                <Text style={styles.label}>{t('auth.phoneNumber')}</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+992 900 123 456"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoFocus
                  maxLength={20}
                />

                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendCode}
                >
                  <Text style={styles.buttonText}>{t('auth.sendCode')}</Text>
                </TouchableOpacity>

                <Text style={styles.infoText}>
                  Войдите с номером телефона для доступа ко всем функциям
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.label}>{t('auth.enterCode')}</Text>
                
                {showCode && (
                  <View style={styles.codeDisplay}>
                    <Ionicons name="mail-open" size={24} color="#0066CC" />
                    <Text style={styles.codeText}>
                      Ваш код: <Text style={styles.codeBold}>{TEST_CODE}</Text>
                    </Text>
                  </View>
                )}

                <TextInput
                  style={styles.input}
                  placeholder="Введите код"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                  maxLength={4}
                  autoFocus
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.buttonText}>{t('auth.verifyCode')}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.backLink}
                  onPress={() => {
                    setStep('phone');
                    setCode('');
                    setShowCode(false);
                  }}
                >
                  <Text style={styles.backLinkText}>← Изменить номер</Text>
                </TouchableOpacity>

                <Text style={styles.infoText}>
                  🧪 Тестовый режим: Код отображается на экране
                </Text>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#8E8E93',
    marginTop: 8,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  button: {
    backgroundColor: '#0066CC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 24,
    lineHeight: 20,
  },
  codeDisplay: {
    backgroundColor: '#E5F0FF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  codeText: {
    fontSize: 16,
    color: '#000000',
  },
  codeBold: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066CC',
    letterSpacing: 4,
  },
  backLink: {
    marginTop: 16,
    padding: 8,
  },
  backLinkText: {
    fontSize: 16,
    color: '#0066CC',
    textAlign: 'center',
  },
});