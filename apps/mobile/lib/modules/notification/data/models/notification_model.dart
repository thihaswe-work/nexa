import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/notification.dart';

part 'notification_model.g.dart';

@JsonSerializable()
class NotificationModel extends Notification {
  const NotificationModel({
    required super.id,
    required super.type,
    required super.title,
    required super.body,
    super.imageUrl,
    super.data,
    super.isRead,
    required super.createdAt,
  });

  factory NotificationModel.fromJson(JsonMap json) =>
      _$NotificationModelFromJson(json);

  JsonMap toJson() => _$NotificationModelToJson(this);
}
