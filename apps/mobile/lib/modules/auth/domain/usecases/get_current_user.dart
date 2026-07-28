import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/user.dart';
import '../repositories/auth_repository.dart';

class GetCurrentUser {
  final AuthRepository _repository;

  GetCurrentUser(this._repository);

  Future<Either<Failure, User>> call() {
    return _repository.getCurrentUser();
  }
}
