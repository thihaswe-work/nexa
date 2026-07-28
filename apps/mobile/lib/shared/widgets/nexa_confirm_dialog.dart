import 'package:flutter/material.dart';

class NexaConfirmDialog extends StatelessWidget {
  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;
  final bool isLoading;
  final VoidCallback onConfirm;
  final VoidCallback? onCancel;

  const NexaConfirmDialog({
    super.key,
    required this.title,
    required this.message,
    this.confirmLabel = 'Confirm',
    this.cancelLabel = 'Cancel',
    this.isDestructive = false,
    this.isLoading = false,
    required this.onConfirm,
    this.onCancel,
  });

  static Future<bool?> show(
    BuildContext context, {
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
    bool isDestructive = false,
  }) {
    return showModalBottomSheet<bool>(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: isDestructive
                    ? Theme.of(ctx).colorScheme.errorContainer
                    : Theme.of(ctx).colorScheme.primaryContainer,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isDestructive ? Icons.warning_rounded : Icons.info_rounded,
                color: isDestructive
                    ? Theme.of(ctx).colorScheme.error
                    : Theme.of(ctx).colorScheme.primary,
                size: 24,
              ),
            ),
            const SizedBox(height: 20),
            Text(
              title,
              style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              message,
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(ctx).colorScheme.onSurfaceVariant,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(ctx, false),
                    child: Text(cancelLabel),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: FilledButton(
                    onPressed: () => Navigator.pop(ctx, true),
                    style: isDestructive
                        ? FilledButton.styleFrom(
                            backgroundColor: Theme.of(ctx).colorScheme.error,
                            foregroundColor: Theme.of(ctx).colorScheme.onError,
                          )
                        : null,
                    child: Text(confirmLabel),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(onPressed: onCancel ?? () => Navigator.pop(context), child: Text(cancelLabel)),
        TextButton(
          onPressed: isLoading ? null : onConfirm,
          style: isDestructive ? TextButton.styleFrom(foregroundColor: Theme.of(context).colorScheme.error) : null,
          child: isLoading
              ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
              : Text(confirmLabel),
        ),
      ],
    );
  }
}
