import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../repositories/nearby_repository.dart';

class ClearLocation {
  final NearbyRepository _repository;

  ClearLocation(this._repository);

  Future<Either<Failure, void>> call() =>
      _repository.clearLocation();
}
