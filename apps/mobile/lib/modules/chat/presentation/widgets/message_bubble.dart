import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:intl/intl.dart';
import '../../domain/entities/message.dart';
import '../../../../shared/widgets/widgets.dart';

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;
  final bool showAvatar;
  final String? avatarUrl;
  final void Function()? onImageTap;

  const MessageBubble({
    super.key,
    required this.message,
    required this.isMe,
    this.showAvatar = true,
    this.avatarUrl,
    this.onImageTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final timeStr = _formatTime(message.createdAt);
    final isImage = message.type == 'IMAGE';
    final isVoice = message.type == 'VOICE';
    final hasText = message.content != null && message.content!.isNotEmpty;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              if (!isMe && showAvatar)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: NexaAvatar(imageUrl: avatarUrl, size: 28),
                )
              else if (!isMe)
                const SizedBox(width: 36),
              Flexible(
                child: Container(
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.72),
                  decoration: BoxDecoration(
                    color: isMe ? theme.colorScheme.primary : theme.colorScheme.surfaceContainerHigh,
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(isMe ? 20 : 4),
                      bottomRight: Radius.circular(isMe ? 4 : 20),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: isMe ? 0.08 : 0.04),
                        blurRadius: 4,
                        offset: const Offset(0, 1),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (isImage && message.attachments.isNotEmpty)
                        _buildImageContent(message.attachments.first),
                      if (isVoice) _buildVoiceContent(theme),
                      if (hasText)
                        Padding(
                          padding: EdgeInsets.fromLTRB(14, isImage || isVoice ? 4 : 10, 8, 6),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Flexible(
                                child: Text(
                                  message.content!,
                                  style: TextStyle(
                                    fontSize: 15,
                                    color: isMe ? theme.colorScheme.onPrimary : theme.colorScheme.onSurface,
                                    height: 1.4,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    timeStr,
                                    style: TextStyle(
                                      fontSize: 11,
                                      color: isMe
                                          ? theme.colorScheme.onPrimary.withValues(alpha: 0.65)
                                          : theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                  if (isMe) ...[
                                    const SizedBox(width: 3),
                                    Icon(
                                      message.readAt != null ? Icons.done_all_rounded : Icons.done_rounded,
                                      size: 14,
                                      color: message.readAt != null
                                          ? const Color(0xFF60A5FA)
                                          : theme.colorScheme.onPrimary.withValues(alpha: 0.65),
                                    ),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                ),
              ),
              if (isMe && showAvatar)
                const SizedBox(width: 36),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildImageContent(MessageAttachment attachment) {
    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      child: GestureDetector(
        onTap: onImageTap,
        child: CachedNetworkImage(
          imageUrl: attachment.url,
          width: double.infinity,
          fit: BoxFit.cover,
          placeholder: (_, __) => Container(
            height: 200,
            color: Colors.grey[200],
            child: const Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))),
          ),
          errorWidget: (_, __, ___) => Container(
            height: 200,
            color: Colors.grey[200],
            child: const Icon(Icons.broken_image_outlined, size: 40),
          ),
        ),
      ),
    );
  }

  Widget _buildVoiceContent(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: isMe ? theme.colorScheme.onPrimary.withValues(alpha: 0.2) : theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.play_arrow_rounded, color: isMe ? theme.colorScheme.onPrimary : theme.colorScheme.primary, size: 20),
          ),
          const SizedBox(width: 8),
          Container(
            width: 100,
            height: 4,
            decoration: BoxDecoration(
              color: isMe ? theme.colorScheme.onPrimary.withValues(alpha: 0.25) : theme.colorScheme.surfaceContainerHighest,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 8),
          Text(
            '0:12',
            style: TextStyle(fontSize: 12, color: isMe ? theme.colorScheme.onPrimary.withValues(alpha: 0.7) : theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  String _formatTime(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    return DateFormat('HH:mm').format(dt);
  }
}
