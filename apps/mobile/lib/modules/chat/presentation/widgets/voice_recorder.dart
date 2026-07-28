import 'dart:async';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:permission_handler/permission_handler.dart';

class VoiceRecorder extends StatefulWidget {
  final void Function(String path, int duration) onComplete;
  final VoidCallback onCancel;

  const VoiceRecorder({
    super.key,
    required this.onComplete,
    required this.onCancel,
  });

  @override
  State<VoiceRecorder> createState() => _VoiceRecorderState();
}

class _VoiceRecorderState extends State<VoiceRecorder>
    with SingleTickerProviderStateMixin {
  final _recorder = AudioRecorder();
  bool _isRecording = false;
  int _recordDuration = 0;
  Timer? _timer;
  late AnimationController _animController;
  late Animation<double> _pulseAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);
    _pulseAnim = Tween<double>(begin: 0.8, end: 1.0).animate(_animController);
    _startRecording();
  }

  Future<void> _startRecording() async {
    final hasPerm = await Permission.microphone.request();
    if (!hasPerm) {
      widget.onCancel();
      return;
    }
    final path = await _recorder.start(
      const RecordConfig(
        encoder: AudioEncoder.aacLc,
        bitRate: 128000,
      ),
    );
    if (path != null) {
      setState(() => _isRecording = true);
      _timer = Timer.periodic(const Duration(seconds: 1), (_) {
        setState(() => _recordDuration++);
      });
    }
  }

  Future<void> _stopRecording() async {
    _timer?.cancel();
    _animController.stop();
    final path = await _recorder.stop();
    if (path != null && _recordDuration > 0) {
      widget.onComplete(path, _recordDuration);
    } else {
      widget.onCancel();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _recorder.dispose();
    _animController.dispose();
    super.dispose();
  }

  String _formatDuration(int secs) {
    final m = (secs ~/ 60).toString().padLeft(2, '0');
    final s = (secs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      height: 80,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.close, color: Colors.red),
            onPressed: widget.onCancel,
          ),
          const SizedBox(width: 8),
          AnimatedBuilder(
            animation: _pulseAnim,
            builder: (_, child) => Transform.scale(
              scale: _pulseAnim.value,
              child: child,
            ),
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.mic, color: Colors.white, size: 20),
            ),
          ),
          const SizedBox(width: 12),
          Text(
            _formatDuration(_recordDuration),
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const Spacer(),
          Container(
            height: 40,
            width: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.primary,
              borderRadius: BorderRadius.circular(20),
            ),
            child: IconButton(
              icon: const Icon(Icons.send, color: Colors.white, size: 20),
              onPressed: _stopRecording,
            ),
          ),
        ],
      ),
    );
  }
}
