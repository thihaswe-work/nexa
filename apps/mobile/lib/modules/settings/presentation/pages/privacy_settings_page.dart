import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PrivacySettingsPage extends ConsumerStatefulWidget {
  const PrivacySettingsPage({super.key});

  @override
  ConsumerState<PrivacySettingsPage> createState() => _PrivacySettingsPageState();
}

class _PrivacySettingsPageState extends ConsumerState<PrivacySettingsPage> {
  bool _showLastSeen = true;
  bool _showOnline = true;
  bool _showLocation = true;
  bool _allowFriendRequests = true;
  String _allowMessagesFrom = 'everyone';

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Privacy')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          _SectionHeader(title: 'Visibility'),
          _SwitchTile(
            icon: Icons.access_time_rounded,
            title: 'Show Last Seen',
            subtitle: 'Let others see when you were last active',
            value: _showLastSeen,
            onChanged: (v) => setState(() => _showLastSeen = v),
          ),
          _SwitchTile(
            icon: Icons.wifi_rounded,
            title: 'Show Online Status',
            subtitle: 'Let others see when you\'re online',
            value: _showOnline,
            onChanged: (v) => setState(() => _showOnline = v),
          ),
          _SwitchTile(
            icon: Icons.location_on_outlined,
            title: 'Show Location',
            subtitle: 'Let others see your approximate location',
            value: _showLocation,
            onChanged: (v) => setState(() => _showLocation = v),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Connections'),
          _SwitchTile(
            icon: Icons.person_add_outlined,
            title: 'Allow Friend Requests',
            subtitle: 'Let others send you friend requests',
            value: _allowFriendRequests,
            onChanged: (v) => setState(() => _allowFriendRequests = v),
          ),
          ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
            leading: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(12)),
              child: Icon(Icons.message_outlined, color: theme.colorScheme.primary, size: 22),
            ),
            title: const Text('Allow Messages From'),
            trailing: DropdownButton<String>(
              value: _allowMessagesFrom,
              underline: const SizedBox(),
              items: const [
                DropdownMenuItem(value: 'everyone', child: Text('Everyone')),
                DropdownMenuItem(value: 'friends', child: Text('Friends')),
                DropdownMenuItem(value: 'none', child: Text('No one')),
              ],
              onChanged: (v) => setState(() => _allowMessagesFrom = v ?? 'everyone'),
            ),
            onTap: () {},
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 8, 16, 4),
      child: Text(
        title,
        style: theme.textTheme.labelLarge?.copyWith(
          color: theme.colorScheme.primary,
          fontWeight: FontWeight.w700,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool value;
  final ValueChanged<bool> onChanged;

  const _SwitchTile({required this.icon, required this.title, required this.subtitle, required this.value, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Container(
        width: 40, height: 40,
        decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, color: theme.colorScheme.primary, size: 22),
      ),
      title: Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
      subtitle: Text(subtitle, style: theme.textTheme.bodySmall),
      trailing: Switch(value: value, onChanged: onChanged),
    );
  }
}
