import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/app_settings.dart';
import '../repositories/settings_repository.dart';

class UpdateSettings {
  final SettingsRepository _repository;

  UpdateSettings(this._repository);

  Future<Either<Failure, void>> call(AppSettings settings) =>
      _repository.updateSettings(settings);
}
