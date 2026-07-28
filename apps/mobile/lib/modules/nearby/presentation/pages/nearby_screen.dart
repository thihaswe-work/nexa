import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/nearby_provider.dart';
import '../providers/nearby_state.dart';
import 'nearby_map_page.dart';
import 'nearby_users_page.dart';
import '../../../../shared/widgets/widgets.dart';

class NearbyScreen extends ConsumerStatefulWidget {
  const NearbyScreen({super.key});

  @override
  ConsumerState<NearbyScreen> createState() => _NearbyScreenState();
}

class _NearbyScreenState extends ConsumerState<NearbyScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(nearbyProvider.notifier).init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(nearbyProvider);
    final notifier = ref.read(nearbyProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby'),
        actions: [
          IconButton(
            icon: state.isRefreshing
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: theme.colorScheme.onSurface,
                    ),
                  )
                : const Icon(Icons.refresh_rounded),
            onPressed: state.isRefreshing ? null : () => notifier.refreshNearby(),
          ),
          IconButton(
            icon: const Icon(Icons.tune_rounded),
            tooltip: 'Filters',
            onPressed: () => _showFilterSheet(context, notifier, state),
          ),
        ],
      ),
      body: state.currentLocation == null && state.status == NearbyStatus.initial
          ? const NexaErrorState(
              title: 'Finding your location',
              message: 'Please enable location services to see people nearby',
              icon: Icons.location_searching_rounded,
            )
          : Column(
              children: [
                if (state.errorMessage != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.error_outline_rounded, color: theme.colorScheme.error, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            state.errorMessage!,
                            style: TextStyle(color: theme.colorScheme.onErrorContainer, fontSize: 13),
                          ),
                        ),
                        GestureDetector(
                          onTap: () => notifier.clearError(),
                          child: Icon(Icons.close_rounded, color: theme.colorScheme.onErrorContainer, size: 18),
                        ),
                      ],
                    ),
                  ),
                if (!state.showNearby)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    margin: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                    decoration: BoxDecoration(
                      color: theme.colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.visibility_off_rounded, color: theme.colorScheme.onSecondaryContainer, size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'You are hidden from nearby users',
                            style: TextStyle(color: theme.colorScheme.onSecondaryContainer, fontSize: 13),
                          ),
                        ),
                      ],
                    ),
                  ),
                const SizedBox(height: 8),
                Expanded(
                  child: state.viewMode == ViewMode.map
                      ? const NearbyMapPage()
                      : const NearbyUsersPage(),
                ),
              ],
            ),
      bottomNavigationBar: _buildViewToggle(theme, state, notifier),
    );
  }

  Widget _buildViewToggle(ThemeData theme, NearbyState state, NearbyNotifier notifier) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant, width: 0.5)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _ViewToggleButton(
              icon: Icons.map_rounded,
              label: 'Map',
              selected: state.viewMode == ViewMode.map,
              onTap: () => notifier.setViewMode(ViewMode.map),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: _ViewToggleButton(
              icon: Icons.format_list_bulleted_rounded,
              label: 'List',
              selected: state.viewMode == ViewMode.list,
              onTap: () => notifier.setViewMode(ViewMode.list),
            ),
          ),
        ],
      ),
    );
  }

  void _showFilterSheet(BuildContext context, NearbyNotifier notifier, NearbyState state) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Search Settings', style: Theme.of(ctx).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: 24),
            _buildRadiusSelector(ctx, notifier, state.radiusMeters),
            const SizedBox(height: 24),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              title: const Text('Show me on the map'),
              subtitle: const Text('Others can see your approximate location'),
              value: state.showNearby,
              onChanged: (v) => notifier.toggleShowNearby(v),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRadiusSelector(BuildContext context, NearbyNotifier notifier, int currentRadius) {
    final theme = Theme.of(context);
    const steps = [500, 1000, 2000, 5000, 10000, 25000, 50000];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Search Radius', style: theme.textTheme.titleSmall),
        const SizedBox(height: 8),
        Text(
          currentRadius >= 1000 ? '${(currentRadius / 1000).toStringAsFixed(0)} km' : '$currentRadius m',
          style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700, color: theme.colorScheme.primary),
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          children: steps.map((step) {
            final selected = step == currentRadius;
            return ChoiceChip(
              label: Text(step >= 1000 ? '${(step / 1000).toStringAsFixed(0)}km' : '${step}m'),
              selected: selected,
              onSelected: (_) {
                notifier.setRadius(step);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ],
    );
  }
}

class _ViewToggleButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _ViewToggleButton({required this.icon, required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primaryContainer : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? theme.colorScheme.primary.withValues(alpha: 0.3) : theme.colorScheme.outline.withValues(alpha: 0.3),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 20, color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: selected ? theme.colorScheme.primary : theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
