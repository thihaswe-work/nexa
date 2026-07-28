import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

class Register {
  final AuthRepository _repository;

  Register(this._repository);

  Future<Either<Failure, AuthTokens>> call({
    required String email,
    required String password,
    required String displayName,
  }) {
    return _repository.register(email, password, displayName);
  }
}
