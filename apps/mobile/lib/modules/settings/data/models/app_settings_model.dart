import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/app_settings.dart';

part 'app_settings_model.g.dart';

@JsonSerializable()
class AppSettingsModel extends AppSettings {
  const AppSettingsModel({
    super.showNearby,
    super.showOnlineStatus,
    super.showReadReceipts,
    super.allowFriendRequests,
    super.pushNotifications,
    super.soundEnabled,
    super.vibrationEnabled,
    super.nearbyRadius,
  });

  factory AppSettingsModel.fromJson(JsonMap json) =>
      _$AppSettingsModelFromJson(json);

  JsonMap toJson() => _$AppSettingsModelToJson(this);
}
