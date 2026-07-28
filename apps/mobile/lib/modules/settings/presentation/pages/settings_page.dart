import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

class SettingsPage extends ConsumerStatefulWidget {
  const SettingsPage({super.key});

  @override
  ConsumerState<SettingsPage> createState() => _SettingsPageState();
}

class _SettingsPageState extends ConsumerState<SettingsPage> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          _SectionHeader(title: 'Account'),
          _SettingsTile(
            icon: Icons.person_outline_rounded,
            title: 'Edit Profile',
            subtitle: 'Name, photo, bio',
            onTap: () => context.push('/profile/edit'),
          ),
          _SettingsTile(
            icon: Icons.lock_outline_rounded,
            title: 'Privacy',
            subtitle: 'Control who can see you',
            onTap: () => context.push('/settings/privacy'),
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Preferences'),
          _SettingsTile(
            icon: Icons.notifications_outlined,
            title: 'Notifications',
            subtitle: 'Push, sounds, vibration',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.palette_outlined,
            title: 'Appearance',
            subtitle: 'Theme, colors',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.map_outlined,
            title: 'Location',
            subtitle: 'Nearby settings, radius',
            onTap: () {},
          ),
          const SizedBox(height: 16),
          _SectionHeader(title: 'Support'),
          _SettingsTile(
            icon: Icons.help_outline_rounded,
            title: 'Help Center',
            subtitle: 'FAQs and support',
            onTap: () {},
          ),
          _SettingsTile(
            icon: Icons.info_outline_rounded,
            title: 'About',
            subtitle: 'Version 1.0.0',
            onTap: () {},
          ),
          const SizedBox(height: 24),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: OutlinedButton(
              onPressed: () {},
              style: OutlinedButton.styleFrom(foregroundColor: theme.colorScheme.error),
              child: const Text('Sign Out'),
            ),
          ),
          const SizedBox(height: 32),
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

class _SettingsTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Widget? trailing;

  const _SettingsTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
      leading: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: theme.colorScheme.primaryContainer,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Icon(icon, color: theme.colorScheme.primary, size: 22),
      ),
      title: Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w500)),
      subtitle: subtitle != null ? Text(subtitle!, style: theme.textTheme.bodySmall) : null,
      trailing: trailing ?? Icon(Icons.chevron_right_rounded, color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.4)),
      onTap: onTap,
    );
  }
}
