import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../domain/entities/auth_tokens.dart';
import '../../domain/entities/user.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_local_datasource.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/login_request.dart';
import '../models/register_request.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final AuthRemoteDataSource _remote;
  final AuthLocalDataSource _local;

  AuthRepositoryImpl(this._remote, this._local);

  @override
  Future<Either<Failure, AuthTokens>> login(
      String email, String password) async {
    try {
      final request = LoginRequest(email: email, password: password);
      final response = await _remote.login(request);
      await _local.saveTokens(response.accessToken, response.refreshToken);
      await _local.saveUserId(response.user.id);
      return Right(AuthTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      ));
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AuthTokens>> register(
      String email, String password, String displayName) async {
    try {
      final request = RegisterRequest(
        email: email,
        password: password,
        displayName: displayName,
      );
      final response = await _remote.register(request);
      await _local.saveTokens(response.accessToken, response.refreshToken);
      await _local.saveUserId(response.user.id);
      return Right(AuthTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      ));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      await _remote.logout();
      await _local.clearTokens();
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, AuthTokens>> refreshToken(String refreshToken) async {
    try {
      final response = await _remote.refreshToken(refreshToken);
      await _local.saveTokens(response.accessToken, response.refreshToken);
      return Right(AuthTokens(
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
      ));
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, User>> getCurrentUser() async {
    try {
      final json = await _remote.getCurrentUser();
      final user = UserModel.fromJson(json);
      return Right(user);
    } on UnauthorizedException catch (e) {
      return Left(UnauthorizedFailure(message: e.message));
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> forgotPassword(String email) async {
    try {
      await _remote.forgotPassword(email);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> resetPassword(
      String token, String password) async {
    try {
      await _remote.resetPassword(token, password);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<Either<Failure, void>> verifyEmail(String token) async {
    try {
      await _remote.verifyEmail(token);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(message: e.message));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }

  @override
  Future<bool> isAuthenticated() => _local.isAuthenticated();
}
