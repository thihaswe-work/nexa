import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/auth_tokens.dart';
import '../repositories/auth_repository.dart';

class RefreshToken {
  final AuthRepository _repository;

  RefreshToken(this._repository);

  Future<Either<Failure, AuthTokens>> call(String refreshToken) {
    return _repository.refreshToken(refreshToken);
  }
}
