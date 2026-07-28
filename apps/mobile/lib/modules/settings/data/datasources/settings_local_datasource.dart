import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/typedefs.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final settingsLocalDataSourceProvider =
    Provider<SettingsLocalDataSource>((ref) {
  return SettingsLocalDataSource();
});

class SettingsLocalDataSource {
  final _storage = const FlutterSecureStorage();
  static const _settingsKey = 'app_settings';

  Future<JsonMap?> getSettings() async {
    final json = await _storage.read(key: _settingsKey);
    if (json == null) return null;
    return jsonDecode(json) as JsonMap;
  }

  Future<void> saveSettings(JsonMap settings) async {
    await _storage.write(
      key: _settingsKey,
      value: jsonEncode(settings),
    );
  }
}
