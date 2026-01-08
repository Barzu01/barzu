// Modern Design System for SafedAuto
export const COLORS = {
  // Primary
  primary: '#0066FF',
  primaryLight: '#E8F1FF',
  primaryDark: '#0052CC',
  
  // Background
  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  
  // Text
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  
  // Accent
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  
  // Border
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  
  // Overlay
  overlay: 'rgba(15, 23, 42, 0.5)',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const TYPOGRAPHY = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyBold: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  small: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
  },
};

export const SHADOWS = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
};

// Body Types для выбора в форме
export const BODY_TYPES = [
  { value: 'sedan', label: 'Седан' },
  { value: 'suv', label: 'Внедорожник (SUV)' },
  { value: 'hatchback', label: 'Хэтчбек' },
  { value: 'wagon', label: 'Универсал' },
  { value: 'coupe', label: 'Купе' },
  { value: 'convertible', label: 'Кабриолет' },
  { value: 'minivan', label: 'Минивэн' },
  { value: 'pickup', label: 'Пикап' },
  { value: 'crossover', label: 'Кроссовер' },
  { value: 'liftback', label: 'Лифтбэк' },
];

// Опции/Особенности автомобиля
export const CAR_FEATURES = [
  { value: 'abs', label: 'ABS' },
  { value: 'esp', label: 'ESP' },
  { value: 'airbags', label: 'Подушки безопасности' },
  { value: 'climate', label: 'Климат-контроль' },
  { value: 'conditioner', label: 'Кондиционер' },
  { value: 'leather', label: 'Кожаный салон' },
  { value: 'sunroof', label: 'Люк' },
  { value: 'panorama', label: 'Панорамная крыша' },
  { value: 'heated_seats', label: 'Подогрев сидений' },
  { value: 'cooled_seats', label: 'Вентиляция сидений' },
  { value: 'parking_sensors', label: 'Парктроники' },
  { value: 'camera', label: 'Камера заднего вида' },
  { value: 'camera_360', label: 'Камера 360°' },
  { value: 'cruise', label: 'Круиз-контроль' },
  { value: 'adaptive_cruise', label: 'Адаптивный круиз-контроль' },
  { value: 'navigation', label: 'Навигация' },
  { value: 'bluetooth', label: 'Bluetooth' },
  { value: 'apple_carplay', label: 'Apple CarPlay' },
  { value: 'android_auto', label: 'Android Auto' },
  { value: 'keyless', label: 'Бесключевой доступ' },
  { value: 'start_button', label: 'Кнопка старт/стоп' },
  { value: 'led_lights', label: 'LED фары' },
  { value: 'xenon', label: 'Ксенон' },
  { value: 'tinted_glass', label: 'Тонировка' },
  { value: 'alloy_wheels', label: 'Литые диски' },
];

// Engine Volumes
export const ENGINE_VOLUMES = [
  { value: 0.8, label: '0.8 л' },
  { value: 1.0, label: '1.0 л' },
  { value: 1.2, label: '1.2 л' },
  { value: 1.4, label: '1.4 л' },
  { value: 1.5, label: '1.5 л' },
  { value: 1.6, label: '1.6 л' },
  { value: 1.8, label: '1.8 л' },
  { value: 2.0, label: '2.0 л' },
  { value: 2.2, label: '2.2 л' },
  { value: 2.4, label: '2.4 л' },
  { value: 2.5, label: '2.5 л' },
  { value: 2.7, label: '2.7 л' },
  { value: 3.0, label: '3.0 л' },
  { value: 3.2, label: '3.2 л' },
  { value: 3.5, label: '3.5 л' },
  { value: 4.0, label: '4.0 л' },
  { value: 4.4, label: '4.4 л' },
  { value: 4.6, label: '4.6 л' },
  { value: 5.0, label: '5.0 л' },
  { value: 5.7, label: '5.7 л' },
  { value: 6.0, label: '6.0+ л' },
];
