import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/profile.dart';
import '../entities/interest.dart';

abstract class UserRepository {
  Future<Either<Failure, Profile>> getProfile();
  Future<Either<Failure, Profile>> getProfileById(String userId);
  Future<Either<Failure, Profile>> updateProfile(
      Map<String, dynamic> updates);
  Future<Either<Failure, String>> uploadAvatar(String filePath);
  Future<Either<Failure, void>> deleteAvatar();
  Future<Either<Failure, List<Interest>>> getInterests();
  Future<Either<Failure, void>> updateInterests(List<String> interestIds);
}
