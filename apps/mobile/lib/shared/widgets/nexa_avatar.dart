import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class NexaAvatar extends StatelessWidget {
  final String? imageUrl;
  final String? name;
  final double size;
  final bool showOnline;
  final bool isOnline;
  final VoidCallback? onTap;

  const NexaAvatar({
    super.key,
    this.imageUrl,
    this.name,
    this.size = 48,
    this.showOnline = false,
    this.isOnline = false,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final avatarSize = size;
    final dotSize = size * 0.28;
    final dotBorder = dotSize * 0.18;

    Widget avatar = CircleAvatar(
      radius: avatarSize / 2,
      backgroundColor: theme.colorScheme.primaryContainer,
      backgroundImage: imageUrl != null ? CachedNetworkImageProvider(imageUrl!) : null,
      child: imageUrl == null
          ? Text(
              _initials,
              style: TextStyle(
                fontSize: size * 0.38,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.primary,
              ),
            )
          : null,
    );

    if (onTap != null) {
      avatar = InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(avatarSize / 2),
        child: avatar,
      );
    }

    if (!showOnline) return avatar;

    return Stack(
      clipBehavior: Clip.none,
      children: [
        avatar,
        Positioned(
          bottom: 0,
          right: 0,
          child: Container(
            width: dotSize,
            height: dotSize,
            decoration: BoxDecoration(
              color: isOnline ? const Color(0xFF34D399) : theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
              shape: BoxShape.circle,
              border: Border.all(color: theme.colorScheme.surface, width: dotBorder),
            ),
          ),
        ),
      ],
    );
  }

  String get _initials {
    if (name == null || name!.isEmpty) return '?';
    final parts = name!.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
    }
    return name![0].toUpperCase();
  }
}
