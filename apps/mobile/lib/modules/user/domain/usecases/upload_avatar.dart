import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/user_repository.dart';

class UploadAvatar {
  final UserRepository _repository;

  UploadAvatar(this._repository);

  Future<Either<Failure, String>> call(String filePath) =>
      _repository.uploadAvatar(filePath);
}
