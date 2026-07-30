// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'notification_settings_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

NotificationSettingsModel _$NotificationSettingsModelFromJson(
        Map<String, dynamic> json) =>
    NotificationSettingsModel(
      pushEnabled: json['pushEnabled'] as bool? ?? true,
      messageNotifications: json['messageNotifications'] as bool? ?? true,
      nearbyNotifications: json['nearbyNotifications'] as bool? ?? true,
      friendRequestNotifications:
          json['friendRequestNotifications'] as bool? ?? true,
      soundEnabled: json['soundEnabled'] as bool? ?? true,
      vibrationEnabled: json['vibrationEnabled'] as bool? ?? true,
    );

Map<String, dynamic> _$NotificationSettingsModelToJson(
        NotificationSettingsModel instance) =>
    <String, dynamic>{
      'pushEnabled': instance.pushEnabled,
      'messageNotifications': instance.messageNotifications,
      'nearbyNotifications': instance.nearbyNotifications,
      'friendRequestNotifications': instance.friendRequestNotifications,
      'soundEnabled': instance.soundEnabled,
      'vibrationEnabled': instance.vibrationEnabled,
    };
