import 'package:equatable/equatable.dart';
import '../../../nearby/domain/entities/location.dart';
import '../../../nearby/domain/entities/nearby_user.dart';

enum NearbyStatus { initial, loading, loaded, error }

enum ViewMode { map, list }

class NearbyState extends Equatable {
  final NearbyStatus status;
  final ViewMode viewMode;
  final Location? currentLocation;
  final List<NearbyUser> nearbyUsers;
  final int radiusMeters;
  final bool showNearby;
  final bool socketConnected;
  final String? errorMessage;
  final bool isRefreshing;

  const NearbyState({
    this.status = NearbyStatus.initial,
    this.viewMode = ViewMode.map,
    this.currentLocation,
    this.nearbyUsers = const [],
    this.radiusMeters = 5000,
    this.showNearby = true,
    this.socketConnected = false,
    this.errorMessage,
    this.isRefreshing = false,
  });

  NearbyState copyWith({
    NearbyStatus? status,
    ViewMode? viewMode,
    Location? currentLocation,
    List<NearbyUser>? nearbyUsers,
    int? radiusMeters,
    bool? showNearby,
    bool? socketConnected,
    String? errorMessage,
    bool? isRefreshing,
  }) {
    return NearbyState(
      status: status ?? this.status,
      viewMode: viewMode ?? this.viewMode,
      currentLocation: currentLocation ?? this.currentLocation,
      nearbyUsers: nearbyUsers ?? this.nearbyUsers,
      radiusMeters: radiusMeters ?? this.radiusMeters,
      showNearby: showNearby ?? this.showNearby,
      socketConnected: socketConnected ?? this.socketConnected,
      errorMessage: errorMessage ?? this.errorMessage,
      isRefreshing: isRefreshing ?? this.isRefreshing,
    );
  }

  @override
  List<Object?> get props => [
        status,
        viewMode,
        currentLocation,
        nearbyUsers,
        radiusMeters,
        showNearby,
        socketConnected,
        errorMessage,
        isRefreshing,
      ];
}
