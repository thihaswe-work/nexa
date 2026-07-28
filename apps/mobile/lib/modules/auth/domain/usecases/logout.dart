import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/auth_repository.dart';

class Logout {
  final AuthRepository _repository;

  Logout(this._repository);

  Future<Either<Failure, void>> call() {
    return _repository.logout();
  }
}
