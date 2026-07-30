import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'voice_recorder.dart';

class ChatInputBar extends StatefulWidget {
  final String conversationId;
  final void Function(String text) onSendText;
  final void Function(String path, int duration) onSendVoice;
  final List<String> Function() onPickImages;
  final void Function() onStartTyping;
  final void Function() onStopTyping;

  const ChatInputBar({
    super.key,
    required this.conversationId,
    required this.onSendText,
    required this.onSendVoice,
    required this.onPickImages,
    required this.onStartTyping,
    required this.onStopTyping,
  });

  @override
  State<ChatInputBar> createState() => _ChatInputBarState();
}

class _ChatInputBarState extends State<ChatInputBar> {
  final _textController = TextEditingController();
  final _focusNode = FocusNode();
  bool _isComposing = false;
  bool _showVoice = false;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _textController.addListener(_onTextChanged);
  }

  void _onTextChanged() {
    final composing = _textController.text.trim().isNotEmpty;
    if (composing != _isComposing) {
      setState(() => _isComposing = composing);
      if (composing) {
        widget.onStartTyping();
      } else {
        widget.onStopTyping();
      }
    }
  }

  void _sendText() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    widget.onSendText(text);
    _textController.clear();
    widget.onStopTyping();
  }

  Future<void> _pickImages() async {
    final images = await _picker.pickMultiImage();
    if (images.isEmpty) return;
    widget.onPickImages();
  }

  @override
  void dispose() {
    _textController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_showVoice) {
      return VoiceRecorder(
        onComplete: (path, duration) {
          widget.onSendVoice(path, duration);
          setState(() => _showVoice = false);
        },
        onCancel: () => setState(() => _showVoice = false),
      );
    }

    return Container(
      padding: EdgeInsets.only(left: 8, right: 8, top: 8, bottom: MediaQuery.of(context).padding.bottom + 8),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: theme.colorScheme.outlineVariant, width: 0.5)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, shape: BoxShape.circle),
            child: IconButton(
              icon: Icon(Icons.add_rounded, color: theme.colorScheme.primary),
              onPressed: () => _showAttachmentSheet(context),
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              constraints: const BoxConstraints(maxHeight: 120),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      focusNode: _focusNode,
                      maxLines: null,
                      textInputAction: TextInputAction.newline,
                      decoration: const InputDecoration(
                        hintText: 'Message...',
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                    ),
                  ),
                  if (_isComposing)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 4, right: 4),
                      child: Material(
                        color: theme.colorScheme.primary,
                        shape: const CircleBorder(),
                        child: InkWell(
                          customBorder: const CircleBorder(),
                          onTap: _sendText,
                          child: Container(
                            width: 36,
                            height: 36,
                            alignment: Alignment.center,
                            child: Icon(Icons.send_rounded, color: theme.colorScheme.onPrimary, size: 18),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          if (!_isComposing) ...[
            const SizedBox(width: 4),
            Container(
              decoration: BoxDecoration(color: theme.colorScheme.primaryContainer, shape: BoxShape.circle),
              child: IconButton(
                icon: Icon(Icons.mic_rounded, color: theme.colorScheme.primary),
                onPressed: () {
                  widget.onStopTyping();
                  setState(() => _showVoice = true);
                },
              ),
            ),
          ],
        ],
      ),
    );
  }

  void _showAttachmentSheet(BuildContext context) {
    final theme = Theme.of(context);
    showModalBottomSheet(
      context: context,
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3), borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  _AttachmentButton(icon: Icons.image_rounded, label: 'Gallery', color: const Color(0xFF8B5CF6), onTap: () { Navigator.pop(ctx); _pickImages(); }),
                  _AttachmentButton(icon: Icons.camera_alt_rounded, label: 'Camera', color: const Color(0xFF3B82F6), onTap: () { Navigator.pop(ctx); _picker.pickImage(source: ImageSource.camera); }),
                  _AttachmentButton(icon: Icons.mic_rounded, label: 'Audio', color: const Color(0xFFEF4444), onTap: () { Navigator.pop(ctx); setState(() => _showVoice = true); }),
                  _AttachmentButton(icon: Icons.description_rounded, label: 'Document', color: const Color(0xFFF59E0B), onTap: () => Navigator.pop(ctx)),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _AttachmentButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _AttachmentButton({required this.icon, required this.label, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(18)),
            child: Icon(icon, color: color, size: 28),
          ),
          const SizedBox(height: 8),
          Text(label, style: Theme.of(context).textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}
