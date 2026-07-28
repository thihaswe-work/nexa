import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/chat_provider.dart';
import '../providers/chat_state.dart';
import '../widgets/message_bubble.dart';
import '../widgets/chat_input_bar.dart';
import '../../../../shared/widgets/widgets.dart';

class ChatConversationPage extends ConsumerStatefulWidget {
  final String conversationId;

  const ChatConversationPage({super.key, required this.conversationId});

  @override
  ConsumerState<ChatConversationPage> createState() => _ChatConversationPageState();
}

class _ChatConversationPageState extends ConsumerState<ChatConversationPage> {
  final _scrollController = ScrollController();
  bool _isAtBottom = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatProvider.notifier).loadMessages(widget.conversationId);
    });
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    final maxScroll = _scrollController.position.maxScrollExtent;
    final currentScroll = _scrollController.position.pixels;
    final atBottom = (maxScroll - currentScroll) < 100;
    if (atBottom != _isAtBottom) setState(() => _isAtBottom = atBottom);
    if (_scrollController.position.pixels <= 200) {
      ref.read(chatProvider.notifier).loadMoreMessages(widget.conversationId);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.minScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final state = ref.watch(chatProvider);
    final notifier = ref.read(chatProvider.notifier);
    final conversation = state.currentConversation;
    final otherUserId = conversation?.participants.firstOrNull?.userId ?? '';
    final otherName = conversation?.participants.firstOrNull?.displayName ?? 'Chat';
    final otherAvatar = conversation?.participants.firstOrNull?.avatarUrl;
    final isOnline = state.isUserOnline(otherUserId);
    final isTyping = state.isUserTyping(otherUserId);

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        titleSpacing: 0,
        title: Row(
          children: [
            NexaAvatar(
              imageUrl: otherAvatar,
              name: otherName,
              size: 36,
              showOnline: true,
              isOnline: isOnline,
            ),
            const SizedBox(width: 12),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  otherName,
                  style: theme.textTheme.titleSmall?.copyWith(fontWeight: FontWeight.w600),
                ),
                if (isTyping)
                  Text(
                    'Typing...',
                    style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary, fontStyle: FontStyle.italic),
                  )
                else if (isOnline)
                  Text('Online', style: theme.textTheme.labelSmall?.copyWith(color: const Color(0xFF34D399)))
                else
                  Text('Offline', style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onSurfaceVariant)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(icon: const Icon(Icons.more_vert_rounded), onPressed: () => _showChatOptions(context, conversation?.name ?? otherName)),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: state.status == ChatStatus.loading && state.messages.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : state.messages.isEmpty
                    ? _buildEmptyState(theme, otherName)
                    : GestureDetector(
                        onTap: () => FocusScope.of(context).unfocus(),
                        child: ListView.builder(
                          controller: _scrollController,
                          reverse: true,
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          itemCount: state.messages.length + 1,
                          itemBuilder: (context, index) {
                            if (index == state.messages.length) {
                              return state.isLoadingMore
                                  ? const Padding(
                                      padding: EdgeInsets.all(16),
                                      child: Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
                                    )
                                  : const SizedBox.shrink();
                            }
                            final msg = state.messages[state.messages.length - 1 - index];
                            final isMe = msg.senderId == 'current_user';
                            final showAvatar = index == 0 || state.messages[state.messages.length - 1 - index].senderId != state.messages[state.messages.length - index].senderId;
                            return MessageBubble(message: msg, isMe: isMe, showAvatar: showAvatar, avatarUrl: isMe ? null : otherAvatar, onImageTap: () {});
                          },
                        ),
                      ),
          ),
          if (isTyping) _buildTypingIndicator(theme),
          ChatInputBar(
            conversationId: widget.conversationId,
            onSendText: (text) {
              notifier.sendMessage(widget.conversationId, text);
              _scrollToBottom();
            },
            onSendVoice: (path, duration) {},
            onPickImages: () => [],
            onStartTyping: () => notifier.startTyping(widget.conversationId),
            onStopTyping: () => notifier.stopTyping(widget.conversationId),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme, String name) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.chat_outlined, size: 36, color: theme.colorScheme.primary),
          ),
          const SizedBox(height: 20),
          Text('Start a conversation', style: theme.textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Text(
            'Say hello to $name',
            style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.onSurfaceVariant),
          ),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 4),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceContainerHigh,
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _typingDot(theme, 0),
                const SizedBox(width: 4),
                _typingDot(theme, 200),
                const SizedBox(width: 4),
                _typingDot(theme, 400),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _typingDot(ThemeData theme, int delay) {
    return _AnimatedDot(delay: delay, color: theme.colorScheme.onSurfaceVariant);
  }

  void _showChatOptions(BuildContext context, String name) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 8),
                child: Text(name, style: Theme.of(ctx).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
              ),
              ListTile(
                leading: const Icon(Icons.person_outline_rounded),
                title: const Text('View Profile'),
                onTap: () { Navigator.pop(ctx); context.push('/profile/$otherUserId'); },
              ),
              ListTile(
                leading: const Icon(Icons.block_rounded),
                title: const Text('Block User'),
                onTap: () { Navigator.pop(ctx); },
              ),
              ListTile(
                leading: Icon(Icons.flag_outlined, color: theme.colorScheme.error),
                title: Text('Report', style: TextStyle(color: theme.colorScheme.error)),
                onTap: () { Navigator.pop(ctx); },
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AnimatedDot extends StatefulWidget {
  final int delay;
  final Color color;
  const _AnimatedDot({required this.delay, required this.color});

  @override
  State<_AnimatedDot> createState() => _AnimatedDotState();
}

class _AnimatedDotState extends State<_AnimatedDot> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200));
    _animation = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
    Future.delayed(Duration(milliseconds: widget.delay), () => _controller.repeat(reverse: true));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (_, __) => Opacity(
        opacity: _animation.value,
        child: Container(width: 7, height: 7, decoration: BoxDecoration(color: widget.color, shape: BoxShape.circle)),
      ),
    );
  }
}
