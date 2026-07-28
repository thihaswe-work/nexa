import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../../../../core/errors/exceptions.dart';
import '../../domain/entities/profile.dart';
import '../../domain/entities/interest.dart';
import '../../domain/repositories/user_repository.dart';
import '../datasources/user_remote_datasource.dart';
import '../models/profile_model.dart';
import '../models/interest_model.dart';

class UserRepositoryImpl implements UserRepository {
  final UserRemoteDataSource _remote;

  UserRepositoryImpl(this._remote);

  @override
  Future<Either<Failure, Profile>> getProfile() async {
    try {
      final json = await _remote.getProfile();
      return Right(ProfileModel.fromJson(json));
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
  Future<Either<Failure, Profile>> getProfileById(String userId) async {
    try {
      final json = await _remote.getProfileById(userId);
      return Right(ProfileModel.fromJson(json));
    } on NotFoundException catch (e) {
      return Left(NotFoundFailure(message: e.message));
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
  Future<Either<Failure, Profile>> updateProfile(
      Map<String, dynamic> updates) async {
    try {
      final json = await _remote.updateProfile(updates);
      return Right(ProfileModel.fromJson(json));
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
  Future<Either<Failure, String>> uploadAvatar(String filePath) async {
    try {
      final json = await _remote.uploadAvatar(filePath);
      final avatarUrl = json['avatarUrl'] as String;
      return Right(avatarUrl);
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
  Future<Either<Failure, void>> deleteAvatar() async {
    try {
      await _remote.deleteAvatar();
      return const Right(null);
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
  Future<Either<Failure, List<Interest>>> getInterests() async {
    try {
      final jsonList = await _remote.getInterests();
      final interests = jsonList
          .map((json) => InterestModel.fromJson(json))
          .toList();
      return Right(interests);
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
  Future<Either<Failure, void>> updateInterests(
      List<String> interestIds) async {
    try {
      await _remote.updateInterests(interestIds);
      return const Right(null);
    } on ServerException catch (e) {
      return Left(ServerFailure(
        message: e.message,
        statusCode: e.statusCode,
      ));
    } catch (e) {
      return Left(ServerFailure(message: e.toString()));
    }
  }
}
