import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/profile.dart';
import '../repositories/user_repository.dart';

class UpdateProfile {
  final UserRepository _repository;

  UpdateProfile(this._repository);

  Future<Either<Failure, Profile>> call(
          Map<String, dynamic> updates) =>
      _repository.updateProfile(updates);
}
