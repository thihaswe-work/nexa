// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_settings_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

AppSettingsModel _$AppSettingsModelFromJson(Map<String, dynamic> json) =>
    AppSettingsModel(
      showNearby: json['showNearby'] as bool? ?? true,
      showOnlineStatus: json['showOnlineStatus'] as bool? ?? true,
      showReadReceipts: json['showReadReceipts'] as bool? ?? true,
      allowFriendRequests: json['allowFriendRequests'] as bool? ?? true,
      pushNotifications: json['pushNotifications'] as bool? ?? true,
      soundEnabled: json['soundEnabled'] as bool? ?? true,
      vibrationEnabled: json['vibrationEnabled'] as bool? ?? true,
      nearbyRadius: (json['nearbyRadius'] as num?)?.toDouble() ?? 5000,
    );

Map<String, dynamic> _$AppSettingsModelToJson(AppSettingsModel instance) =>
    <String, dynamic>{
      'showNearby': instance.showNearby,
      'showOnlineStatus': instance.showOnlineStatus,
      'showReadReceipts': instance.showReadReceipts,
      'allowFriendRequests': instance.allowFriendRequests,
      'pushNotifications': instance.pushNotifications,
      'soundEnabled': instance.soundEnabled,
      'vibrationEnabled': instance.vibrationEnabled,
      'nearbyRadius': instance.nearbyRadius,
    };
