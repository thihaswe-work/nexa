import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/location.dart';

part 'location_model.g.dart';

@JsonSerializable()
class LocationModel extends Location {
  const LocationModel({required super.lat, required super.lng});

  factory LocationModel.fromJson(JsonMap json) =>
      _$LocationModelFromJson(json);

  JsonMap toJson() => _$LocationModelToJson(this);
}
