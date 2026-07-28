import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../../domain/entities/app_settings.dart';
import '../../domain/repositories/settings_repository.dart';
import '../datasources/settings_local_datasource.dart';
import '../models/app_settings_model.dart';

class SettingsRepositoryImpl implements SettingsRepository {
  final SettingsLocalDataSource _local;

  SettingsRepositoryImpl(this._local);

  @override
  Future<Either<Failure, AppSettings>> getSettings() async {
    try {
      final json = await _local.getSettings();
      if (json == null) return const Right(AppSettings());
      return Right(AppSettingsModel.fromJson(json));
    } catch (e) {
      return const Right(AppSettings());
    }
  }

  @override
  Future<Either<Failure, void>> updateSettings(
      AppSettings settings) async {
    try {
      final model = AppSettingsModel(
        showNearby: settings.showNearby,
        showOnlineStatus: settings.showOnlineStatus,
        showReadReceipts: settings.showReadReceipts,
        allowFriendRequests: settings.allowFriendRequests,
        pushNotifications: settings.pushNotifications,
        soundEnabled: settings.soundEnabled,
        vibrationEnabled: settings.vibrationEnabled,
        nearbyRadius: settings.nearbyRadius,
      );
      await _local.saveSettings(model.toJson());
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> updatePrivacySetting(
      String key, dynamic value) async {
    try {
      final json = await _local.getSettings();
      final settings = (json ?? <String, dynamic>{})..[key] = value;
      await _local.saveSettings(settings);
      return const Right(null);
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
