import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/chat_provider.dart';
import '../providers/chat_state.dart';
import '../../../../shared/widgets/widgets.dart';

class ChatListPage extends ConsumerStatefulWidget {
  const ChatListPage({super.key});

  @override
  ConsumerState<ChatListPage> createState() => _ChatListPageState();
}

class _ChatListPageState extends ConsumerState<ChatListPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatProvider.notifier).loadConversations();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(chatProvider);
    final notifier = ref.read(chatProvider.notifier);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Messages'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_outlined),
            tooltip: 'New message',
            onPressed: () => context.push('/nearby'),
          ),
        ],
      ),
      body: state.status == ChatStatus.loading && state.conversations.isEmpty
          ? const NexaSkeletonList()
          : state.conversations.isEmpty
              ? NexaEmptyState(
                  icon: Icons.chat_bubble_outline_rounded,
                  title: 'No conversations yet',
                  subtitle: 'Start chatting with people nearby',
                  actionLabel: 'Find People',
                  onAction: () => context.push('/nearby'),
                )
              : RefreshIndicator(
                  onRefresh: () => notifier.loadConversations(),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(vertical: 4),
                    itemCount: state.conversations.length,
                    separatorBuilder: (_, __) => const Divider(indent: 80, endIndent: 16),
                    itemBuilder: (context, index) {
                      final conv = state.conversations[index];
                      final other = conv.participants.firstOrNull;
                      final isOnline = state.isUserOnline(other?.userId ?? '');
                      final isTyping = state.isUserTyping(other?.userId ?? '');
                      final timeStr = conv.lastMessageAt != null ? _formatTime(conv.lastMessageAt!) : null;

                      return NexaFadeIn(
                        delayMilliseconds: index * 40,
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                          leading: NexaAvatar(
                            imageUrl: other?.avatarUrl,
                            name: other?.displayName,
                            size: 52,
                            showOnline: true,
                            isOnline: isOnline,
                          ),
                          title: Text(
                            conv.name ?? other?.displayName ?? 'Unknown',
                            style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          subtitle: isTyping
                              ? Text(
                                  'Typing...',
                                  style: theme.textTheme.bodySmall?.copyWith(
                                    color: theme.colorScheme.primary,
                                    fontStyle: FontStyle.italic,
                                  ),
                                )
                              : conv.lastMessagePreview != null
                                  ? Text(
                                      conv.lastMessagePreview!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: theme.textTheme.bodySmall?.copyWith(
                                        color: conv.unreadCount > 0
                                            ? theme.colorScheme.onSurface
                                            : theme.colorScheme.onSurfaceVariant,
                                      ),
                                    )
                                  : null,
                          trailing: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              if (timeStr != null)
                                Text(
                                  timeStr,
                                  style: theme.textTheme.labelSmall?.copyWith(
                                    color: conv.unreadCount > 0
                                        ? theme.colorScheme.primary
                                        : theme.colorScheme.onSurfaceVariant,
                                    fontWeight: conv.unreadCount > 0 ? FontWeight.w600 : FontWeight.normal,
                                  ),
                                ),
                              if (conv.unreadCount > 0) ...[
                                const SizedBox(height: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: theme.colorScheme.primary,
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    conv.unreadCount > 99 ? '99+' : '${conv.unreadCount}',
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: theme.colorScheme.onPrimary,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          onTap: () => context.push('/chat/${conv.id}'),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatTime(String iso) {
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'Now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays == 0) return DateFormat('HH:mm').format(dt);
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return DateFormat('EEE').format(dt);
    return DateFormat('dd/MM').format(dt);
  }
}
