import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../../../../core/utils/typedefs.dart';
import '../../../domain/entities/message.dart';

final chatLocalDataSourceProvider = Provider<ChatLocalDataSource>((ref) {
  return ChatLocalDataSource();
});

class ChatLocalDataSource {
  static const _boxName = 'chat_cache';
  static const _messagesKey = 'messages_';
  static const _conversationsKey = 'conversations';
  static const _pendingKey = 'pending_messages';
  Box<String>? _box;

  Future<void> init() async {
    _box = await Hive.openBox<String>(_boxName);
  }

  Future<void> cacheConversations(JsonList conversations) async {
    await _box?.put(_conversationsKey, jsonEncode(conversations));
  }

  JsonList? getCachedConversations() {
    final raw = _box?.get(_conversationsKey);
    if (raw == null) return null;
    return (jsonDecode(raw) as JsonList);
  }

  Future<void> cacheMessages(String conversationId, JsonList messages) async {
    await _box?.put('$_messagesKey$conversationId', jsonEncode(messages));
  }

  JsonList? getCachedMessages(String conversationId) {
    final raw = _box?.get('$_messagesKey$conversationId');
    if (raw == null) return null;
    return (jsonDecode(raw) as JsonList);
  }

  Future<void> appendMessage(String conversationId, JsonMap message) async {
    final existing = getCachedMessages(conversationId) ?? [];
    existing.add(message);
    await cacheMessages(conversationId, existing);
  }

  Future<void> updateMessage(String conversationId, String messageId, JsonMap updates) async {
    final existing = getCachedMessages(conversationId);
    if (existing == null) return;
    final idx = existing.indexWhere((m) => m['id'] == messageId);
    if (idx == -1) return;
    existing[idx] = {...existing[idx], ...updates};
    await cacheMessages(conversationId, existing);
  }

  Future<void> queuePendingMessage(JsonMap message) async {
    final pending = getPendingMessages();
    pending.add(message);
    await _box?.put(_pendingKey, jsonEncode(pending));
  }

  JsonList getPendingMessages() {
    final raw = _box?.get(_pendingKey);
    if (raw == null) return [];
    return (jsonDecode(raw) as JsonList);
  }

  Future<void> removePendingMessage(String tempId) async {
    final pending = getPendingMessages();
    pending.removeWhere((m) => m['tempId'] == tempId);
    await _box?.put(_pendingKey, jsonEncode(pending));
  }

  Future<void> clearConversation(String conversationId) async {
    await _box?.delete('$_messagesKey$conversationId');
  }

  Future<void> clearAll() async {
    await _box?.clear();
  }
}
