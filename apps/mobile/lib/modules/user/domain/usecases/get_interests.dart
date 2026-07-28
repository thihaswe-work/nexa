import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/interest.dart';
import '../repositories/user_repository.dart';

class GetInterests {
  final UserRepository _repository;

  GetInterests(this._repository);

  Future<Either<Failure, List<Interest>>> call() =>
      _repository.getInterests();
}
