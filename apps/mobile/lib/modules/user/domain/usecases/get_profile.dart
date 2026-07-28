import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/profile.dart';
import '../repositories/user_repository.dart';

class GetProfile {
  final UserRepository _repository;

  GetProfile(this._repository);

  Future<Either<Failure, Profile>> call() => _repository.getProfile();
}
