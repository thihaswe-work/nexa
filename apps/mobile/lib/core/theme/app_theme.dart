import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  static const Color primary = Color(0xFF7C5CFC);
  static const Color primaryLight = Color(0xFF9B7FFD);
  static const Color primaryDark = Color(0xFF5B3EE0);
  static const Color secondary = Color(0xFF00C9A7);
  static const Color secondaryLight = Color(0xFF33D4B9);
  static const Color error = Color(0xFFEF4444);
  static const Color warning = Color(0xFFF59E0B);
  static const Color success = Color(0xFF10B981);

  // Light theme
  static const Color surfaceLight = Color(0xFFF8F9FE);
  static const Color backgroundLight = Color(0xFFF0F1F6);
  static const Color cardLight = Color(0xFFFFFFFF);
  static const Color textPrimaryLight = Color(0xFF1A1D29);
  static const Color textSecondaryLight = Color(0xFF6B7280);
  static const Color textTertiaryLight = Color(0xFF9CA3AF);
  static const Color borderLight = Color(0xFFE5E7EB);
  static const Color dividerLight = Color(0xFFF0F0F5);

  // Dark theme
  static const Color surfaceDark = Color(0xFF16182A);
  static const Color backgroundDark = Color(0xFF0F1121);
  static const Color cardDark = Color(0xFF1E2038);
  static const Color textPrimaryDark = Color(0xFFF1F1F6);
  static const Color textSecondaryDark = Color(0xFF9CA3B8);
  static const Color textTertiaryDark = Color(0xFF6B7280);
  static const Color borderDark = Color(0xFF2A2D45);
  static const Color dividerDark = Color(0xFF252840);

  // Semantic
  static const Color onlineGreen = Color(0xFF34D399);
  static const Color awayYellow = Color(0xFFFBBF24);
  static const Color busyRed = Color(0xFFF87171);
}

class AppTheme {
  AppTheme._();

  static const _radiusXs = 4.0;
  static const _radiusSm = 8.0;
  static const _radiusMd = 12.0;
  static const _radiusLg = 16.0;
  static const _radiusXl = 20.0;
  static const _radiusFull = 999.0;

  static const _paddingXs = 4.0;
  static const _paddingSm = 8.0;
  static const _paddingMd = 16.0;
  static const _paddingLg = 20.0;
  static const _paddingXl = 24.0;
  static const _paddingXxl = 32.0;

  static ThemeData get light => _buildTheme(Brightness.light);
  static ThemeData get dark => _buildTheme(Brightness.dark);

  static ThemeData _buildTheme(Brightness brightness) {
    final isLight = brightness == Brightness.light;
    final colorScheme = isLight
        ? ColorScheme.light(
            primary: AppColors.primary,
            primaryContainer: AppColors.primary.withValues(alpha: 0.12),
            onPrimary: Colors.white,
            secondary: AppColors.secondary,
            secondaryContainer: AppColors.secondary.withValues(alpha: 0.12),
            onSecondary: Colors.white,
            surface: AppColors.cardLight,
            surfaceContainerHighest: AppColors.backgroundLight,
            error: AppColors.error,
            errorContainer: AppColors.error.withValues(alpha: 0.1),
            onError: Colors.white,
            onSurface: AppColors.textPrimaryLight,
            onSurfaceVariant: AppColors.textSecondaryLight,
            outline: AppColors.borderLight,
            outlineVariant: AppColors.dividerLight,
          )
        : ColorScheme.dark(
            primary: AppColors.primaryLight,
            primaryContainer: AppColors.primary.withValues(alpha: 0.2),
            onPrimary: Colors.white,
            secondary: AppColors.secondaryLight,
            secondaryContainer: AppColors.secondary.withValues(alpha: 0.2),
            onSecondary: Colors.white,
            surface: AppColors.cardDark,
            surfaceContainerHighest: AppColors.backgroundDark,
            error: AppColors.error,
            errorContainer: AppColors.error.withValues(alpha: 0.15),
            onError: Colors.white,
            onSurface: AppColors.textPrimaryDark,
            onSurfaceVariant: AppColors.textSecondaryDark,
            outline: AppColors.borderDark,
            outlineVariant: AppColors.dividerDark,
          );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: isLight ? AppColors.backgroundLight : AppColors.backgroundDark,
      textTheme: _buildTextTheme(isLight),
      appBarTheme: _buildAppBarTheme(colorScheme, isLight),
      inputDecorationTheme: _buildInputTheme(colorScheme),
      elevatedButtonTheme: _buildElevatedButtonTheme(colorScheme),
      filledButtonTheme: _buildFilledButtonTheme(colorScheme),
      outlinedButtonTheme: _buildOutlinedButtonTheme(colorScheme),
      textButtonTheme: _buildTextButtonTheme(colorScheme),
      cardTheme: _buildCardTheme(colorScheme, isLight),
      chipTheme: _buildChipTheme(colorScheme, isLight),
      snackBarTheme: _buildSnackBarTheme(colorScheme, isLight),
      dialogTheme: _buildDialogTheme(colorScheme, isLight),
      bottomSheetTheme: _buildBottomSheetTheme(colorScheme, isLight),
      dividerTheme: _buildDividerTheme(isLight),
      floatingActionButtonTheme: _buildFabTheme(colorScheme),
      navigationBarTheme: _buildNavBarTheme(colorScheme, isLight),
      badgeTheme: _buildBadgeTheme(colorScheme),
      listTileTheme: _buildListTileTheme(colorScheme),
      popupMenuTheme: _buildPopupMenuTheme(colorScheme, isLight),
      bottomAppBarTheme: BottomAppBarTheme(
        color: isLight ? Colors.white : AppColors.cardDark,
        elevation: 0,
      ),
    );
  }

  static TextTheme _buildTextTheme(bool isLight) {
    final base = isLight
        ? Typography.material2021().black
        : Typography.material2021().white;
    return base.copyWith(
      displayLarge: base.displayLarge?.copyWith(fontSize: 32, fontWeight: FontWeight.w700, letterSpacing: -1),
      displayMedium: base.displayMedium?.copyWith(fontSize: 28, fontWeight: FontWeight.w700, letterSpacing: -0.5),
      displaySmall: base.displaySmall?.copyWith(fontSize: 24, fontWeight: FontWeight.w700),
      headlineLarge: base.headlineLarge?.copyWith(fontSize: 22, fontWeight: FontWeight.w600),
      headlineMedium: base.headlineMedium?.copyWith(fontSize: 20, fontWeight: FontWeight.w600),
      headlineSmall: base.headlineSmall?.copyWith(fontSize: 18, fontWeight: FontWeight.w600),
      titleLarge: base.titleLarge?.copyWith(fontSize: 17, fontWeight: FontWeight.w600),
      titleMedium: base.titleMedium?.copyWith(fontSize: 15, fontWeight: FontWeight.w600),
      titleSmall: base.titleSmall?.copyWith(fontSize: 13, fontWeight: FontWeight.w600),
      bodyLarge: base.bodyLarge?.copyWith(fontSize: 16, fontWeight: FontWeight.w400, height: 1.5),
      bodyMedium: base.bodyMedium?.copyWith(fontSize: 14, fontWeight: FontWeight.w400, height: 1.5),
      bodySmall: base.bodySmall?.copyWith(fontSize: 12, fontWeight: FontWeight.w400, height: 1.4),
      labelLarge: base.labelLarge?.copyWith(fontSize: 14, fontWeight: FontWeight.w500, letterSpacing: 0.5),
      labelMedium: base.labelMedium?.copyWith(fontSize: 12, fontWeight: FontWeight.w500, letterSpacing: 0.3),
      labelSmall: base.labelSmall?.copyWith(fontSize: 10, fontWeight: FontWeight.w500, letterSpacing: 0.2),
    );
  }

  static AppBarTheme _buildAppBarTheme(ColorScheme colors, bool isLight) {
    return AppBarTheme(
      centerTitle: true,
      elevation: 0,
      scrolledUnderElevation: 0.5,
      backgroundColor: isLight ? AppColors.backgroundLight : AppColors.backgroundDark,
      foregroundColor: colors.onSurface,
      surfaceTintColor: Colors.transparent,
      titleTextStyle: TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: colors.onSurface,
        letterSpacing: -0.3,
      ),
    );
  }

  static InputDecorationTheme _buildInputTheme(ColorScheme colors) {
    return InputDecorationTheme(
      filled: true,
      fillColor: colors.surfaceContainerHighest.withValues(alpha: 0.5),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radiusMd),
        borderSide: BorderSide(color: colors.outline.withValues(alpha: 0.5)),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radiusMd),
        borderSide: BorderSide(color: colors.outline.withValues(alpha: 0.3)),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radiusMd),
        borderSide: BorderSide(color: colors.primary, width: 1.5),
      ),
      errorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radiusMd),
        borderSide: BorderSide(color: colors.error),
      ),
      focusedErrorBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(_radiusMd),
        borderSide: BorderSide(color: colors.error, width: 1.5),
      ),
      labelStyle: TextStyle(color: colors.onSurfaceVariant, fontSize: 14),
      hintStyle: TextStyle(color: colors.onSurfaceVariant.withValues(alpha: 0.5), fontSize: 14),
      prefixIconColor: colors.onSurfaceVariant,
      suffixIconColor: colors.onSurfaceVariant,
    );
  }

  static ElevatedButtonThemeData _buildElevatedButtonTheme(ColorScheme colors) {
    return ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: colors.primary,
        foregroundColor: colors.onPrimary,
        minimumSize: const Size(double.infinity, 52),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusMd)),
        elevation: 0,
        shadowColor: colors.primary.withValues(alpha: 0.3),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 0.3),
        disabledBackgroundColor: colors.onSurface.withValues(alpha: 0.12),
        disabledForegroundColor: colors.onSurface.withValues(alpha: 0.38),
      ),
    );
  }

  static FilledButtonThemeData _buildFilledButtonTheme(ColorScheme colors) {
    return FilledButtonThemeData(
      style: FilledButton.styleFrom(
        backgroundColor: colors.primary,
        foregroundColor: colors.onPrimary,
        minimumSize: const Size(double.infinity, 52),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusMd)),
        elevation: 0,
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600, letterSpacing: 0.3),
      ),
    );
  }

  static OutlinedButtonThemeData _buildOutlinedButtonTheme(ColorScheme colors) {
    return OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        foregroundColor: colors.primary,
        minimumSize: const Size(double.infinity, 52),
        padding: const EdgeInsets.symmetric(horizontal: 24),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusMd)),
        side: BorderSide(color: colors.primary.withValues(alpha: 0.4)),
        textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
      ),
    );
  }

  static TextButtonThemeData _buildTextButtonTheme(ColorScheme colors) {
    return TextButtonThemeData(
      style: TextButton.styleFrom(
        foregroundColor: colors.primary,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusSm)),
        textStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
      ),
    );
  }

  static CardTheme _buildCardTheme(ColorScheme colors, bool isLight) {
    return CardTheme(
      color: isLight ? Colors.white : AppColors.cardDark,
      elevation: 0,
      shadowColor: Colors.black.withValues(alpha: isLight ? 0.04 : 0.2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(_radiusLg),
        side: BorderSide(color: colors.outline.withValues(alpha: isLight ? 0.3 : 0.2)),
      ),
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      clipBehavior: Clip.antiAlias,
    );
  }

  static ChipThemeData _buildChipTheme(ColorScheme colors, bool isLight) {
    return ChipThemeData(
      backgroundColor: isLight ? AppColors.backgroundLight : AppColors.surfaceDark,
      selectedColor: colors.primaryContainer,
      labelStyle: TextStyle(fontSize: 13, color: colors.onSurface),
      secondaryLabelStyle: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusFull)),
      side: BorderSide.none,
    );
  }

  static SnackBarThemeData _buildSnackBarTheme(ColorScheme colors, bool isLight) {
    return SnackBarThemeData(
      backgroundColor: isLight ? AppColors.textPrimaryLight : AppColors.textPrimaryDark,
      contentTextStyle: TextStyle(color: isLight ? Colors.white : Colors.black, fontSize: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusMd)),
      behavior: SnackBarBehavior.floating,
      elevation: 4,
    );
  }

  static DialogTheme _buildDialogTheme(ColorScheme colors, bool isLight) {
    return DialogTheme(
      backgroundColor: isLight ? Colors.white : AppColors.cardDark,
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusXl)),
    );
  }

  static BottomSheetThemeData _buildBottomSheetTheme(ColorScheme colors, bool isLight) {
    return BottomSheetThemeData(
      backgroundColor: isLight ? Colors.white : AppColors.cardDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(_radiusXl)),
      ),
      elevation: 0,
      modalElevation: 0,
      dragHandleColor: colors.onSurfaceVariant.withValues(alpha: 0.3),
      dragHandleSize: const Size(36, 4),
      showDragHandle: true,
    );
  }

  static DividerThemeData _buildDividerTheme(bool isLight) {
    return DividerThemeData(
      color: isLight ? AppColors.dividerLight : AppColors.dividerDark,
      thickness: 1,
      space: 1,
    );
  }

  static FloatingActionButtonThemeData _buildFabTheme(ColorScheme colors) {
    return FloatingActionButtonThemeData(
      backgroundColor: colors.primary,
      foregroundColor: colors.onPrimary,
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusLg)),
    );
  }

  static NavigationBarThemeData _buildNavBarTheme(ColorScheme colors, bool isLight) {
    return NavigationBarThemeData(
      backgroundColor: isLight ? Colors.white : AppColors.cardDark,
      indicatorColor: colors.primaryContainer,
      labelTextStyle: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: colors.primary);
        }
        return TextStyle(fontSize: 12, fontWeight: FontWeight.w500, color: colors.onSurfaceVariant);
      }),
      iconTheme: WidgetStateProperty.resolveWith((states) {
        if (states.contains(WidgetState.selected)) {
          return IconThemeData(size: 22, color: colors.primary);
        }
        return IconThemeData(size: 22, color: colors.onSurfaceVariant);
      }),
      elevation: 0,
      height: 65,
    );
  }

  static BadgeThemeData _buildBadgeTheme(ColorScheme colors) {
    return BadgeThemeData(
      backgroundColor: colors.error,
      textColor: Colors.white,
      smallSize: 8,
      largeSize: 20,
    );
  }

  static ListTileThemeData _buildListTileTheme(ColorScheme colors) {
    return ListTileThemeData(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusMd)),
      titleTextStyle: TextStyle(fontSize: 16, fontWeight: FontWeight.w500, color: colors.onSurface),
      subtitleTextStyle: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
      leadingAndTrailingTextStyle: TextStyle(fontSize: 13, color: colors.onSurfaceVariant),
      iconColor: colors.onSurfaceVariant,
    );
  }

  static PopupMenuThemeData _buildPopupMenuTheme(ColorScheme colors, bool isLight) {
    return PopupMenuThemeData(
      color: isLight ? Colors.white : AppColors.cardDark,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(_radiusMd)),
      elevation: 4,
    );
  }
}
