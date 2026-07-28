import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../../../shared/widgets/widgets.dart';

class ProfilePage extends ConsumerStatefulWidget {
  final String? userId;

  const ProfilePage({super.key, this.userId});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  bool _isOwnProfile = false;

  @override
  void initState() {
    super.initState();
    _isOwnProfile = widget.userId == null || widget.userId == 'current';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          _buildSliverAppBar(theme),
          SliverToBoxAdapter(
            child: Column(
              children: [
                _buildProfileInfo(theme),
                _buildActionButtons(theme),
                if (_isOwnProfile) _buildEditButton(theme),
                const SizedBox(height: 8),
                _buildSection(theme, 'About', Icons.info_outline_rounded, [
                  _buildInfoRow(theme, Icons.email_outlined, 'email@example.com'),
                  _buildInfoRow(theme, Icons.calendar_today_rounded, 'Joined January 2024'),
                  _buildInfoRow(theme, Icons.location_on_outlined, 'San Francisco, CA'),
                ]),
                const SizedBox(height: 8),
                _buildSection(theme, 'Interests', Icons.favorite_outline_rounded, [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _buildInterestChip(theme, 'Photography'),
                      _buildInterestChip(theme, 'Coffee'),
                      _buildInterestChip(theme, 'Hiking'),
                      _buildInterestChip(theme, 'Music'),
                      _buildInterestChip(theme, 'Travel'),
                    ],
                  ),
                ]),
                const SizedBox(height: 32),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSliverAppBar(ThemeData theme) {
    return SliverAppBar(
      expandedHeight: 220,
      pinned: true,
      stretch: true,
      backgroundColor: theme.colorScheme.primary,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.primary.withValues(alpha: 0.8),
                theme.colorScheme.surface,
              ],
            ),
          ),
          child: Stack(
            fit: StackFit.expand,
            children: [
              Positioned(
                bottom: -40,
                left: 0,
                right: 0,
                child: Container(
                  height: 80,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surface,
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
      actions: [
        if (!_isOwnProfile)
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: Colors.white),
            onSelected: (value) {},
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'block', child: Text('Block User')),
              const PopupMenuItem(value: 'report', child: Text('Report User')),
            ],
          ),
      ],
    );
  }

  Widget _buildProfileInfo(ThemeData theme) {
    return Transform.translate(
      offset: const Offset(0, -40),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24),
        child: Column(
          children: [
            Container(
              width: 104,
              height: 104,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: theme.colorScheme.surface, width: 4),
                boxShadow: [
                  BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 16, offset: const Offset(0, 4)),
                ],
              ),
              child: CircleAvatar(
                radius: 50,
                backgroundColor: theme.colorScheme.primaryContainer,
                backgroundImage: null,
                child: Text(
                  'U',
                  style: TextStyle(fontSize: 40, fontWeight: FontWeight.w600, color: theme.colorScheme.primary),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Display Name',
              style: theme.textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 4),
            Text(
              '@username',
              style: theme.textTheme.bodyLarge?.copyWith(color: theme.colorScheme.onSurfaceVariant),
            ),
            const SizedBox(height: 8),
            Text(
              'Living life one adventure at a time. Coffee addict and sunset chaser.',
              textAlign: TextAlign.center,
              style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant, height: 1.5),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(ThemeData theme) {
    if (_isOwnProfile) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: Row(
        children: [
          Expanded(
            child: FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.chat_outlined, size: 18),
              label: const Text('Message'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: OutlinedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.person_add_outlined, size: 18),
              label: const Text('Add Friend'),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditButton(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
      child: OutlinedButton.icon(
        onPressed: () => context.push('/profile/edit'),
        icon: const Icon(Icons.edit_outlined, size: 18),
        label: const Text('Edit Profile'),
      ),
    );
  }

  Widget _buildSection(ThemeData theme, String title, IconData icon, List<Widget> children) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Card(
        margin: EdgeInsets.zero,
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(icon, size: 20, color: theme.colorScheme.primary),
                  const SizedBox(width: 8),
                  Text(title, style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600)),
                ],
              ),
              const SizedBox(height: 12),
              ...children,
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoRow(ThemeData theme, IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 12),
          Text(text, style: theme.textTheme.bodyMedium),
        ],
      ),
    );
  }

  Widget _buildInterestChip(ThemeData theme, String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: theme.textTheme.labelMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w500)),
    );
  }
}

class ProfileEditPage extends ConsumerStatefulWidget {
  const ProfileEditPage({super.key});

  @override
  ConsumerState<ProfileEditPage> createState() => _ProfileEditPageState();
}

class _ProfileEditPageState extends ConsumerState<ProfileEditPage> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: ListView(
        padding: const EdgeInsets.all(24),
        children: [
          Center(
            child: Stack(
              children: [
                Container(
                  width: 96,
                  height: 96,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.person_rounded, size: 48),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: Container(
                    width: 32,
                    height: 32,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: theme.colorScheme.surface, width: 3),
                    ),
                    child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 16),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),
          TextFormField(
            initialValue: 'Display Name',
            decoration: const InputDecoration(labelText: 'Display Name', prefixIcon: Icon(Icons.person_outlined)),
          ),
          const SizedBox(height: 16),
          TextFormField(
            initialValue: 'Living life one adventure at a time.',
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Bio', prefixIcon: Icon(Icons.edit_outlined)),
          ),
          const SizedBox(height: 16),
          TextFormField(
            initialValue: 'San Francisco, CA',
            decoration: const InputDecoration(labelText: 'Location', prefixIcon: Icon(Icons.location_on_outlined)),
          ),
          const SizedBox(height: 32),
          FilledButton(
            onPressed: () => context.pop(),
            child: const Text('Save Changes'),
          ),
        ],
      ),
    );
  }
}
