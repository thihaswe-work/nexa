import 'package:flutter/material.dart';

enum NexaToastType { success, error, info, warning }

class NexaToast {
  static void show(
    BuildContext context, {
    required String message,
    NexaToastType type = NexaToastType.info,
    Duration duration = const Duration(seconds: 3),
  }) {
    final theme = Theme.of(context);
    final colors = _getColors(type, theme);

    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            Icon(_getIcon(type), color: colors.iconColor, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: TextStyle(color: colors.textColor, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        backgroundColor: colors.bgColor,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.fromLTRB(16, 0, 16, 20),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: duration,
      ),
    );
  }

  static _ToastColors _getColors(NexaToastType type, ThemeData theme) {
    switch (type) {
      case NexaToastType.success:
        return _ToastColors(
          bgColor: const Color(0xFF065F46),
          iconColor: const Color(0xFF34D399),
          textColor: Colors.white,
        );
      case NexaToastType.error:
        return _ToastColors(
          bgColor: const Color(0xFF7F1D1D),
          iconColor: const Color(0xFFFCA5A5),
          textColor: Colors.white,
        );
      case NexaToastType.warning:
        return _ToastColors(
          bgColor: const Color(0xFF78350F),
          iconColor: const Color(0xFFFCD34D),
          textColor: Colors.white,
        );
      case NexaToastType.info:
        return _ToastColors(
          bgColor: theme.colorScheme.surfaceContainerHighest,
          iconColor: theme.colorScheme.primary,
          textColor: theme.colorScheme.onSurface,
        );
    }
  }

  static IconData _getIcon(NexaToastType type) {
    switch (type) {
      case NexaToastType.success:
        return Icons.check_circle_rounded;
      case NexaToastType.error:
        return Icons.error_rounded;
      case NexaToastType.warning:
        return Icons.warning_rounded;
      case NexaToastType.info:
        return Icons.info_rounded;
    }
  }
}

class _ToastColors {
  final Color bgColor;
  final Color iconColor;
  final Color textColor;
  const _ToastColors({required this.bgColor, required this.iconColor, required this.textColor});
}
