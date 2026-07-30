import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../providers/nearby_provider.dart';
import '../providers/nearby_state.dart';
import '../../../../shared/widgets/widgets.dart';

class NearbyUsersPage extends ConsumerWidget {
  const NearbyUsersPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(nearbyProvider);

    if (state.status == NearbyStatus.loading && state.nearbyUsers.isEmpty) {
      return ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        itemCount: 6,
        itemBuilder: (_, __) => const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: NexaSkeletonCard(),
        ),
      );
    }

    if (state.nearbyUsers.isEmpty) {
      return NexaEmptyState(
        icon: Icons.people_outline_rounded,
        title: 'No one nearby',
        subtitle: 'Try increasing your search radius or check back later',
        actionLabel: 'Increase Radius',
        onAction: () => ref.read(nearbyProvider.notifier).setRadius(
              (state.radiusMeters * 2).clamp(500, 50000),
            ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(nearbyProvider.notifier).refreshNearby(),
      child: ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: state.nearbyUsers.length,
        itemBuilder: (context, index) {
          final user = state.nearbyUsers[index];
          final isOnline = user.lastSeen != null && DateTime.now().difference(user.lastSeen!).inMinutes < 5;
          final distance = _formatDistance(user.distance);

          return NexaFadeIn(
            delayMilliseconds: index * 60,
            child: Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: InkWell(
                onTap: () => context.push('/profile/${user.userId}'),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      NexaAvatar(
                        imageUrl: user.profile.avatarUrl,
                        name: user.profile.displayName,
                        size: 56,
                        showOnline: true,
                        isOnline: isOnline,
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user.profile.displayName,
                              style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Icon(Icons.location_on_rounded, size: 14, color: theme.colorScheme.primary),
                                const SizedBox(width: 4),
                                Text(
                                  distance,
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.primary,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                if (user.profile.bio != null) ...[
                                  const SizedBox(width: 8),
                                  Container(width: 3, height: 3, decoration: BoxDecoration(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4), shape: BoxShape.circle)),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      user.profile.bio!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.onSurfaceVariant),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.primaryContainer,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          'Message',
                          style: theme.textTheme.labelMedium?.copyWith(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  String _formatDistance(double meters) {
    if (meters < 1000) return '${meters.round()} m';
    if (meters < 10000) return '${(meters / 1000).toStringAsFixed(1)} km';
    return '${(meters / 1000).toStringAsFixed(0)} km';
  }
}
