import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/auth_tokens.dart';
import '../entities/user.dart';

abstract class AuthRepository {
  Future<Either<Failure, AuthTokens>> login(String email, String password);
  Future<Either<Failure, AuthTokens>> register(
      String email, String password, String displayName);
  Future<Either<Failure, void>> logout();
  Future<Either<Failure, AuthTokens>> refreshToken(String refreshToken);
  Future<Either<Failure, User>> getCurrentUser();
  Future<Either<Failure, void>> forgotPassword(String email);
  Future<Either<Failure, void>> resetPassword(
      String token, String password);
  Future<Either<Failure, void>> verifyEmail(String token);
  Future<bool> isAuthenticated();
}
