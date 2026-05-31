import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class AppTheme {
  static const primaryColor = Colors.white;
  static const backgroundColor = Color(0xFF0A0A0A);
  static const surfaceColor = Color(0xFF171717);
  static const textColor = Colors.white;
  static const secondaryTextColor = Color(0xFFA3A3A3);
  static const accentColor = Color(0xFF3B82F6); // Web Primary Blue
  static const shimmerBase = Color(0xFF1A1A1A);
  static const shimmerHighlight = Color(0xFF262626);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: primaryColor,
        secondary: accentColor,
        surface: surfaceColor,
        background: backgroundColor,
        onBackground: textColor,
        onSurface: textColor,
      ),
      scaffoldBackgroundColor: backgroundColor,
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStateProperty.all(Colors.white.withOpacity(0.15)),
        trackColor: WidgetStateProperty.all(Colors.transparent),
        radius: const Radius.circular(10),
        thickness: WidgetStateProperty.all(6),
        thumbVisibility: WidgetStateProperty.all(true),
        interactive: true,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
        ),
        titleTextStyle: TextStyle(
          color: textColor,
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Color(0xFF111111),
        selectedItemColor: primaryColor,
        unselectedItemColor: secondaryTextColor,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: surfaceColor,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1F1F1F),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentColor, width: 1),
        ),
        labelStyle: const TextStyle(color: secondaryTextColor),
        prefixIconColor: secondaryTextColor,
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: Color(0xFF0F172A),
        secondary: accentColor,
        surface: Colors.white,
        background: Color(0xFFD7E4F5),
        onBackground: Color(0xFF0F172A),
        onSurface: Color(0xFF0F172A),
      ),
      scaffoldBackgroundColor: const Color(0xFFD7E4F5),
      scrollbarTheme: ScrollbarThemeData(
        thumbColor: WidgetStateProperty.all(Colors.black.withOpacity(0.12)),
        trackColor: WidgetStateProperty.all(Colors.transparent),
        radius: const Radius.circular(10),
        thickness: WidgetStateProperty.all(6),
        thumbVisibility: WidgetStateProperty.all(true),
        interactive: true,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        systemOverlayStyle: SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
          statusBarBrightness: Brightness.light,
        ),
        titleTextStyle: TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 20,
          fontWeight: FontWeight.bold,
        ),
      ),
      bottomNavigationBarTheme: const BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: Color(0xFF0F172A),
        unselectedItemColor: Color(0xFF475569),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 0,
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF1F5F9),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: accentColor, width: 1),
        ),
        labelStyle: const TextStyle(color: Color(0xFF475569)),
        prefixIconColor: Color(0xFF475569),
      ),
    );
  }
}

extension ThemeContext on BuildContext {
  ThemeData get theme => Theme.of(this);
  ColorScheme get colorScheme => theme.colorScheme;
  bool get isDarkMode => theme.brightness == Brightness.dark;

  // Adaptive background and surface colors
  Color get customBackground => isDarkMode ? const Color(0xFF0A0A0A) : const Color(0xFFD7E4F5);
  Color get customSurface => isDarkMode ? const Color(0xFF171717) : Colors.white.withOpacity(0.65);
  Color get customText => isDarkMode ? Colors.white : const Color(0xFF0F172A);
  Color get customSecondaryText => isDarkMode ? const Color(0xFFA3A3A3) : const Color(0xFF475569);
  Color get customBorder => isDarkMode ? Colors.white.withOpacity(0.08) : Colors.black.withOpacity(0.1);
  Color get customShimmerBase => isDarkMode ? const Color(0xFF1A1A1A) : const Color(0xFFE2E8F0);
  Color get customShimmerHighlight => isDarkMode ? const Color(0xFF262626) : const Color(0xFFF1F5F9);
}
