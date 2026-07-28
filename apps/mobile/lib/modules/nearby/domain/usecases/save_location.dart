import 'package:fpdart/fpdart.dart';
import '../../../../core/errors/failures.dart';
import '../entities/location.dart';
import '../repositories/nearby_repository.dart';

class SaveLocation {
  final NearbyRepository _repository;

  SaveLocation(this._repository);

  Future<Either<Failure, void>> call(Location location) =>
      _repository.saveLocation(location);
}
