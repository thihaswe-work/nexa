import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/app_settings.dart';

abstract class SettingsRepository {
  Future<Either<Failure, AppSettings>> getSettings();
  Future<Either<Failure, void>> updateSettings(AppSettings settings);
  Future<Either<Failure, void>> updatePrivacySetting(
      String key, dynamic value);
}
