import 'dart:async';
import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';

final socketClientProvider = Provider<SocketClient>((ref) {
  final secureStorage = ref.read(secureStorageProvider);
  return SocketClient(secureStorage);
});

class SocketClient {
  final SecureStorage _storage;
  WebSocketChannel? _channel;
  StreamSubscription<dynamic>? _subscription;
  Timer? _reconnectTimer;
  Timer? _pingTimer;
  String? _currentToken;
  bool _disposed = false;
  bool _intentionalDisconnect = false;

  final StreamController<Map<String, dynamic>> _messageController =
      StreamController<Map<String, dynamic>>.broadcast();
  StreamController<dynamic>? _errorController;

  SocketClient(this._storage);

  bool get isConnected => _channel != null;
  Stream<Map<String, dynamic>> get stream => _messageController.stream;

  Future<void> connect() async {
    if (_disposed) return;
    final token = await _storage.getAccessToken();
    if (token == null) return;

    _currentToken = token;
    _intentionalDisconnect = false;

    try {
      final uri = Uri.parse(AppConfig.wsUrl).replace(
        queryParameters: {'token': token},
      );
      _channel = WebSocketChannel.connect(uri);

      _subscription = _channel?.stream.listen(
        (data) {
          try {
            final decoded = jsonDecode(data as String) as Map<String, dynamic>;
            _messageController.add(decoded);
          } catch (_) {}
        },
        onError: (error) {
          _errorController?.add(error);
          _channel = null;
          _scheduleReconnect();
        },
        onDone: () {
          _channel = null;
          if (!_intentionalDisconnect && !_disposed) {
            _scheduleReconnect();
          }
        },
      );

      _startPing();
    } catch (_) {
      _scheduleReconnect();
    }
  }

  void _startPing() {
    _pingTimer?.cancel();
    _pingTimer = Timer.periodic(const Duration(seconds: 25), (_) {
      try {
        _channel?.sink.add(jsonEncode({'event': 'ping'}));
      } catch (_) {}
    });
  }

  void _scheduleReconnect() {
    if (_disposed || _intentionalDisconnect) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 3), () {
      if (!_disposed) connect();
    });
  }

  void disconnect() {
    _intentionalDisconnect = true;
    _reconnectTimer?.cancel();
    _pingTimer?.cancel();
    _subscription?.cancel();
    _channel?.sink.close();
    _channel = null;
  }

  void emit(String event, Map<String, dynamic> data) {
    if (_channel == null) return;
    try {
      _channel!.sink.add(jsonEncode({
        'event': event,
        'data': data,
      }));
    } catch (_) {}
  }

  void dispose() {
    _disposed = true;
    disconnect();
    _messageController.close();
    _errorController?.close();
  }
}
