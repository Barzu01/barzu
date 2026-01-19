// Font family constants for consistent typography
export const fonts = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
};

// Typography styles based on Inter font
export const typography = {
  // Headings
  h1: {
    fontFamily: fonts.extraBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  },
  h2: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.3,
  },
  h3: {
    fontFamily: fonts.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
  },
  h4: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    lineHeight: 24,
  },
  
  // Body text
  bodyLarge: {
    fontFamily: fonts.regular,
    fontSize: 17,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySmall: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
  },
  
  // Labels and buttons
  label: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  buttonSmall: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 20,
  },
  
  // Captions
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    lineHeight: 16,
  },
};
