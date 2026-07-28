import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:go_router/go_router.dart';
import '../providers/nearby_provider.dart';
import '../providers/nearby_state.dart';
import '../../../../shared/widgets/widgets.dart';

class NearbyMapPage extends ConsumerWidget {
  const NearbyMapPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final state = ref.watch(nearbyProvider);

    if (state.currentLocation == null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.location_off_rounded, size: 64, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 16),
            Text('Location not available', style: theme.textTheme.titleMedium),
          ],
        ),
      );
    }

    final center = LatLng(state.currentLocation!.lat, state.currentLocation!.lng);

    return FlutterMap(
      options: MapOptions(
        initialCenter: center,
        initialZoom: 15,
        minZoom: 10,
        maxZoom: 18,
      ),
      children: [
        TileLayer(
          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          userAgentPackageName: 'com.nexa.mobile',
        ),
        CircleLayer(
          circles: [
            CircleMarker(
              point: center,
              radius: state.radiusMeters.toDouble(),
              color: theme.colorScheme.primary.withValues(alpha: 0.08),
              borderColor: theme.colorScheme.primary.withValues(alpha: 0.25),
              borderStrokeWidth: 2,
            ),
          ],
        ),
        MarkerLayer(
          markers: [
            Marker(
              point: center,
              width: 40,
              height: 40,
              child: Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 3),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 8, offset: const Offset(0, 2)),
                  ],
                ),
                child: const Icon(Icons.my_location, color: Colors.white, size: 20),
              ),
            ),
            ...state.nearbyUsers.map((user) {
              return Marker(
                point: LatLng(user.profile.lat!, user.profile.lng!),
                width: 40,
                height: 40,
                child: GestureDetector(
                  onTap: () => _showUserTooltip(context, user),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: theme.colorScheme.primary, width: 2.5),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withValues(alpha: 0.2), blurRadius: 6, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: user.profile.avatarUrl != null
                        ? ClipOval(
                            child: Image.network(user.profile.avatarUrl!, fit: BoxFit.cover, errorBuilder: (_, __, ___) => const Icon(Icons.person_rounded, color: Colors.grey, size: 20)),
                          )
                        : Icon(Icons.person_rounded, color: theme.colorScheme.primary, size: 20),
                  ),
                ),
              );
            }),
          ],
        ),
      ],
    );
  }

  void _showUserTooltip(BuildContext context, dynamic user) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            NexaAvatar(
              imageUrl: user.profile.avatarUrl,
              name: user.profile.displayName,
              size: 64,
              showOnline: true,
              isOnline: user.isOnline ?? false,
            ),
            const SizedBox(height: 16),
            Text(user.profile.displayName, style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text(
              _formatDistance(user.distance),
              style: Theme.of(ctx).textTheme.bodyMedium?.copyWith(color: Theme.of(ctx).colorScheme.primary, fontWeight: FontWeight.w500),
            ),
            if (user.profile.bio != null) ...[
              const SizedBox(height: 8),
              Text(user.profile.bio!, textAlign: TextAlign.center, style: Theme.of(ctx).textTheme.bodyMedium),
            ],
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () { Navigator.pop(ctx); context.push('/chat/new?userId=${user.id}'); },
                    child: const Text('Send Message'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatDistance(double meters) {
    if (meters < 1000) return '${meters.round()} m';
    return '${(meters / 1000).toStringAsFixed(1)} km';
  }
}
