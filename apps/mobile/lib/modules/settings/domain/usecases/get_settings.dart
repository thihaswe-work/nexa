import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/app_settings.dart';
import '../repositories/settings_repository.dart';

class GetSettings {
  final SettingsRepository _repository;

  GetSettings(this._repository);

  Future<Either<Failure, AppSettings>> call() =>
      _repository.getSettings();
}
