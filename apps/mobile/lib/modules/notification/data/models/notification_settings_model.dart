import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';

part 'notification_settings_model.g.dart';

@JsonSerializable()
class NotificationSettingsModel {
  final bool pushEnabled;
  final bool messageNotifications;
  final bool nearbyNotifications;
  final bool friendRequestNotifications;
  final bool soundEnabled;
  final bool vibrationEnabled;

  const NotificationSettingsModel({
    this.pushEnabled = true,
    this.messageNotifications = true,
    this.nearbyNotifications = true,
    this.friendRequestNotifications = true,
    this.soundEnabled = true,
    this.vibrationEnabled = true,
  });

  factory NotificationSettingsModel.fromJson(JsonMap json) =>
      _$NotificationSettingsModelFromJson(json);

  JsonMap toJson() => _$NotificationSettingsModelToJson(this);
}
