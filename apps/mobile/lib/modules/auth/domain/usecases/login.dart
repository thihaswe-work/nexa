import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

class Login {
  final AuthRepository _repository;

  Login(this._repository);

  Future<Either<Failure, AuthTokens>> call({
    required String email,
    required String password,
  }) {
    return _repository.login(email, password);
  }
}
