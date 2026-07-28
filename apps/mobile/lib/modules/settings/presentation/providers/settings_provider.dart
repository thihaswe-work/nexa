import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/datasources/settings_local_datasource.dart';
import '../../data/repositories/settings_repository_impl.dart';
import '../../domain/entities/app_settings.dart';
import '../../domain/repositories/settings_repository.dart';
import 'settings_state.dart';

final settingsRepositoryProvider = Provider<SettingsRepository>((ref) {
  final local = ref.read(settingsLocalDataSourceProvider);
  return SettingsRepositoryImpl(local);
});

final settingsProvider =
    StateNotifierProvider<SettingsNotifier, SettingsState>((ref) {
  final repository = ref.read(settingsRepositoryProvider);
  return SettingsNotifier(repository);
});

class SettingsNotifier extends StateNotifier<SettingsState> {
  final SettingsRepository _repository;

  SettingsNotifier(this._repository) : super(const SettingsState());

  Future<void> loadSettings() async {
    state =
        state.copyWith(status: SettingsStatus.loading, errorMessage: null);
    final result = await _repository.getSettings();
    result.fold(
      (failure) => state = state.copyWith(
        status: SettingsStatus.error,
        errorMessage: failure.message,
      ),
      (settings) => state = state.copyWith(
        status: SettingsStatus.loaded,
        settings: settings,
      ),
    );
  }

  Future<void> updateSetting(String key, dynamic value) async {
    final updated = _buildUpdatedSettings(key, value);
    state = state.copyWith(settings: updated);
    await _repository.updateSettings(updated);
  }

  AppSettings _buildUpdatedSettings(String key, dynamic value) {
    switch (key) {
      case 'showNearby':
        return state.settings.copyWith(showNearby: value as bool);
      case 'showOnlineStatus':
        return state.settings.copyWith(showOnlineStatus: value as bool);
      case 'showReadReceipts':
        return state.settings.copyWith(showReadReceipts: value as bool);
      case 'allowFriendRequests':
        return state.settings.copyWith(
            allowFriendRequests: value as bool);
      case 'pushNotifications':
        return state.settings.copyWith(
            pushNotifications: value as bool);
      case 'soundEnabled':
        return state.settings.copyWith(soundEnabled: value as bool);
      case 'vibrationEnabled':
        return state.settings.copyWith(
            vibrationEnabled: value as bool);
      case 'nearbyRadius':
        return state.settings.copyWith(nearbyRadius: (value as num).toDouble());
      default:
        return state.settings;
    }
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}
