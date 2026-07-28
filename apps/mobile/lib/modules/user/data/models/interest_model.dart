import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/interest.dart';

part 'interest_model.g.dart';

@JsonSerializable()
class InterestModel extends Interest {
  const InterestModel({
    required super.id,
    required super.name,
    super.category,
    super.icon,
  });

  factory InterestModel.fromJson(JsonMap json) =>
      _$InterestModelFromJson(json);

  JsonMap toJson() => _$InterestModelToJson(this);
}
