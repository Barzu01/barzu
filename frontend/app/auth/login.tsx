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
  ScrollView,
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
  const [useTestMode, setUseTestMode] = useState(USE_TEST_MODE_DEFAULT);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [messageModal, setMessageModal] = useState<{visible: boolean; type: 'success' | 'error'; title: string; message: string}>({
    visible: false,
    type: 'error',
    title: '',
    message: ''
  });
  const { login } = useAuth();
  const router = useRouter();
  const { t } = useTranslation();

  // Текст условий использования
  const termsOfServiceText = `📜 Условия использования приложения "SafedAuto"

Дата вступления в силу: 01.02.2026

Добро пожаловать в приложение SafedAuto! Используя данное приложение, вы подтверждаете согласие с настоящими Условиями использования. Если вы не согласны с условиями — пожалуйста, прекратите использование приложения.

1. Общие положения

1.1. SafedAuto — это мобильное приложение и онлайн-платформа для размещения, просмотра и поиска объявлений о продаже автомобилей, автозапчастей и аксессуаров.

1.2. SafedAuto предоставляет только информационную площадку и не является стороной сделок между пользователями.

2. Регистрация и аккаунт

2.1. Регистрация в SafedAuto осуществляется с использованием номера телефона или Google-аккаунта.

2.2. Пользователь обязуется предоставлять достоверную информацию и использовать только собственные данные.

2.3. Пользователь несёт полную ответственность за сохранность доступа к своему аккаунту SafedAuto.

3. Размещение объявлений

3.1. Пользователь имеет право размещать объявления, не нарушающие законодательство и настоящие Условия.

3.2. Запрещается размещать объявления:
• с незаконным содержанием;
• содержащие ложную, вводящую в заблуждение информацию;
• нарушающие права третьих лиц;
• содержащие оскорбления, угрозы или дискриминацию.

3.3. Администрация SafedAuto вправе удалять объявления без предварительного уведомления при нарушении правил.

4. Контент и данные пользователей

4.1. Пользователь самостоятельно несёт ответственность за размещаемый контент (фото, описание, цена).

4.2. SafedAuto не претендует на право собственности на пользовательский контент.

5. Ответственность сторон

5.1. SafedAuto не участвует в сделках между пользователями и не контролирует их условия.

5.2. SafedAuto не несёт ответственности за:
• качество и состояние автомобилей, запчастей и аксессуаров;
• достоверность информации в объявлениях;
• результаты сделок между пользователями.

6. ⚠️ Предупреждение о мошенничестве

6.1. SafedAuto не несёт ответственности за случаи мошенничества, обмана, недобросовестных действий или предоставления ложной информации со стороны пользователей.

6.2. Все сделки, переговоры и финансовые расчёты осуществляются исключительно между пользователями на их собственный риск.

6.3. ❗ Будьте бдительны!
SafedAuto настоятельно рекомендует:
• не переводить предоплату незнакомым лицам;
• не передавать личные данные третьим лицам;
• встречаться в безопасных общественных местах;
• проверять документы на автомобиль и личность продавца;
• осматривать автомобиль перед покупкой.

7. Уведомления

7.1. SafedAuto может отправлять push-уведомления, связанные с работой приложения, новыми объявлениями и обновлениями.

7.2. Пользователь может отключить уведомления в настройках устройства.

8. Конфиденциальность

8.1. SafedAuto обрабатывает персональные данные пользователей в соответствии с Политикой конфиденциальности.

8.2. Данные используются исключительно для функционирования и улучшения сервиса SafedAuto.

9. Изменение условий

9.1. SafedAuto вправе изменять настоящие Условия использования в любое время.

9.2. Продолжение использования приложения означает согласие пользователя с обновлёнными условиями.

10. Контакты

По всем вопросам:
📧 Email: safedauto.com
📱 Через форму обратной связи в приложении SafedAuto`;

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
    // Проверяем согласие с условиями
    if (!agreedToTerms) {
      setShowTermsError(true);
      return;
    }
    setShowTermsError(false);

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

                {/* Ошибка - не согласились с условиями */}
                {showTermsError && (
                  <View style={styles.termsErrorCard}>
                    <Ionicons name="warning" size={20} color="#DC2626" />
                    <Text style={styles.termsErrorText}>
                      Чтобы продолжить вход, вы должны согласиться с условиями и политикой конфиденциальности
                    </Text>
                  </View>
                )}

                {/* Чекбокс согласия с условиями */}
                <View style={styles.termsContainer}>
                  <TouchableOpacity 
                    style={styles.checkboxTouchable}
                    onPress={() => {
                      setAgreedToTerms(!agreedToTerms);
                      if (!agreedToTerms) setShowTermsError(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, agreedToTerms && styles.checkboxChecked]}>
                      {agreedToTerms && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.termsText}>
                    Продолжая, вы соглашаетесь с нашими{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setShowTermsModal(true)}
                    >
                      Условиями обслуживания
                    </Text>
                    {' '}и{' '}
                    <Text 
                      style={styles.termsLink}
                      onPress={() => setShowPrivacyModal(true)}
                    >
                      Политикой конфиденциальности
                    </Text>
                  </Text>
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

      {/* Terms of Service Modal */}
      <Modal visible={showTermsModal} transparent animationType="slide">
        <View style={styles.termsModalOverlay}>
          <View style={styles.termsModalContent}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>📜 Условия использования</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.termsModalScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.termsModalText}>{termsOfServiceText}</Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.termsModalButton}
              onPress={() => setShowTermsModal(false)}
            >
              <Text style={styles.termsModalButtonText}>Понятно</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacyModal} transparent animationType="slide">
        <View style={styles.termsModalOverlay}>
          <View style={styles.termsModalContent}>
            <View style={styles.termsModalHeader}>
              <Text style={styles.termsModalTitle}>🔒 Политика конфиденциальности</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)}>
                <Ionicons name="close" size={28} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.termsModalScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.termsModalText}>
{`🔐 Политика конфиденциальности мобильного приложения SafedAuto

Дата публикации: 01.02.2026

1. Общие положения

Настоящая Политика конфиденциальности описывает, какие персональные данные собирает и обрабатывает владелец мобильного приложения SafedAuto (далее — «Компания», «мы», «нас»), а также цели, способы защиты таких данных и права Пользователей.

Политика разработана в соответствии с:
• Законом Республики Таджикистан «О персональных данных»;
• Общим регламентом по защите данных (GDPR);
• Калифорнийским законом о защите персональных данных (CCPA);
• требованиями Apple App Store Review Guidelines и Google Play Developer Program Policies.

Устанавливая и используя приложение SafedAuto, Пользователь подтверждает согласие с настоящей Политикой.
Если вы не согласны — пожалуйста, прекратите использование приложения.

2. Термины

• Пользователь — физическое лицо, использующее приложение SafedAuto.
• Персональные данные — информация, позволяющая прямо или косвенно идентифицировать Пользователя.
• Обработка данных — любые действия с персональными данными (сбор, хранение, использование, удаление и др.).
• Cookies / SDK-идентификаторы — технические данные и уникальные идентификаторы, используемые для работы и аналитики приложения.

3. Категории обрабатываемых данных

⚠️ SafedAuto не запрашивает и не хранит данные банковских карт или платёжных средств.

📋 Учётные данные:
• номер телефона, имя (никнейм), e-mail
• способ получения: ввод пользователем

📷 Контент:
• объявления, фото, описания, комментарии
• способ получения: публикуется пользователем

📱 Технические данные:
• модель устройства, ОС, IP-адрес, язык
• способ получения: автоматически

📍 Местоположение (опционально):
• город, регион
• способ получения: при разрешении пользователя

🍪 Cookies / SDK:
• идентификаторы сессий, настройки
• способ получения: автоматически

4. Цели обработки персональных данных

Персональные данные обрабатываются для следующих целей:
• регистрация и авторизация пользователей;
• размещение, просмотр и управление объявлениями;
• связь между пользователями;
• отправка SMS-кодов, push-уведомлений и сервисных сообщений;
• обеспечение безопасности и предотвращение мошенничества;
• аналитика и улучшение работы приложения;
• выполнение требований законодательства.

📧 Маркетинговые рассылки осуществляются только с согласия пользователя.

5. Правовые основания обработки

✅ Согласие — добровольное предоставление данных пользователем
📝 Исполнение договора — предоставление функционала SafedAuto
🔒 Законный интерес — безопасность, улучшение сервиса
⚖️ Юридические обязательства — соблюдение законодательства

6. Передача данных третьим лицам

SafedAuto может использовать сторонние сервисы (например, Firebase) исключительно для работы приложения.

❌ Мы не продаём и не передаём персональные данные третьим лицам в коммерческих целях.

7. Хранение и удаление данных

7.1. Удаление по запросу пользователя
Пользователь может удалить аккаунт через настройки приложения. После подтверждения:
• персональные данные удаляются с активных серверов;
• доступ к аккаунту прекращается;
• сессии аннулируются.

7.2. Резервные копии
Некоторые данные могут временно храниться в резервных копиях и автоматически удаляются в течение 7 дней.

7.3. Требования закона
Минимальные логи безопасности могут храниться кратковременно, если это требуется законом.

8. Права пользователей

Пользователь имеет право:
• 📄 получить копию своих данных;
• ✏️ исправить неточные данные;
• 🗑️ удалить данные («право быть забытым»);
• ⏸️ ограничить обработку;
• ↩️ отозвать согласие в любое время.

Запросы направляются на e-mail: safedauto.com
Срок ответа — до 30 дней.

9. Cookies и аналитика

Используются:
• обязательные (авторизация, безопасность);
• аналитические (Firebase Analytics, App Store / Play Analytics).

Пользователь может отключить аналитику в настройках устройства, что может ограничить некоторые функции.

10. Безопасность данных

SafedAuto применяет:
• 🔐 защищённые соединения (TLS);
• 🔑 ограниченный доступ к данным;
• 🛡️ современные меры защиты серверов;
• ✅ регулярный контроль безопасности.

11. Детская конфиденциальность

⚠️ Приложение SafedAuto не предназначено для лиц младше 13 лет.
Если данные ребёнка были переданы — они будут немедленно удалены по обращению.

12. Международная передача данных

Данные могут обрабатываться на серверах за пределами страны проживания пользователя. Мы применяем меры защиты, соответствующие международным стандартам.

13. Изменения Политики

SafedAuto вправе обновлять настоящую Политику.
Актуальная версия публикуется в приложении.
Продолжение использования означает согласие с изменениями.

14. Контакты

📧 E-mail: safedauto.com
📱 Через форму обратной связи в приложении SafedAuto

Последняя редакция: 01.02.2026`}
              </Text>
            </ScrollView>
            <TouchableOpacity 
              style={styles.termsModalButton}
              onPress={() => setShowPrivacyModal(false)}
            >
              <Text style={styles.termsModalButtonText}>Понятно</Text>
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
  // Terms checkbox styles
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: '#0066FF',
    borderColor: '#0066FF',
  },
  termsText: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
  },
  termsLink: {
    color: '#0066FF',
    fontWeight: '600',
  },
  termsErrorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 10,
  },
  termsErrorText: {
    flex: 1,
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
    lineHeight: 18,
  },
  checkboxTouchable: {
    marginRight: 12,
    marginTop: 2,
  },
  // Terms Modal styles
  termsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  termsModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  termsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  termsModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  termsModalScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  termsModalText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
    marginBottom: 20,
  },
  termsModalButton: {
    backgroundColor: '#0066FF',
    marginHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  termsModalButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
