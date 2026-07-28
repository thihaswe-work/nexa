import 'package:equatable/equatable.dart';

class AppSettings extends Equatable {
  final bool showNearby;
  final bool showOnlineStatus;
  final bool showReadReceipts;
  final bool allowFriendRequests;
  final bool pushNotifications;
  final bool soundEnabled;
  final bool vibrationEnabled;
  final double nearbyRadius;

  const AppSettings({
    this.showNearby = true,
    this.showOnlineStatus = true,
    this.showReadReceipts = true,
    this.allowFriendRequests = true,
    this.pushNotifications = true,
    this.soundEnabled = true,
    this.vibrationEnabled = true,
    this.nearbyRadius = 5000,
  });

  AppSettings copyWith({
    bool? showNearby,
    bool? showOnlineStatus,
    bool? showReadReceipts,
    bool? allowFriendRequests,
    bool? pushNotifications,
    bool? soundEnabled,
    bool? vibrationEnabled,
    double? nearbyRadius,
  }) {
    return AppSettings(
      showNearby: showNearby ?? this.showNearby,
      showOnlineStatus: showOnlineStatus ?? this.showOnlineStatus,
      showReadReceipts: showReadReceipts ?? this.showReadReceipts,
      allowFriendRequests:
          allowFriendRequests ?? this.allowFriendRequests,
      pushNotifications: pushNotifications ?? this.pushNotifications,
      soundEnabled: soundEnabled ?? this.soundEnabled,
      vibrationEnabled: vibrationEnabled ?? this.vibrationEnabled,
      nearbyRadius: nearbyRadius ?? this.nearbyRadius,
    );
  }

  @override
  List<Object?> get props => [
        showNearby,
        showOnlineStatus,
        showReadReceipts,
        allowFriendRequests,
        pushNotifications,
        soundEnabled,
        vibrationEnabled,
        nearbyRadius,
      ];
}
