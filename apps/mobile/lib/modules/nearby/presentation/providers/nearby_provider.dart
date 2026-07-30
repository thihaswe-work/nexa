import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import '../../../../core/services/location_service.dart';
import '../../../../core/socket/socket_client.dart';
import '../../data/datasources/nearby_remote_datasource.dart';
import '../../data/repositories/nearby_repository_impl.dart';
import '../../domain/entities/location.dart';
import '../../domain/repositories/nearby_repository.dart';
import 'nearby_state.dart';

final nearbyRepositoryProvider = Provider<NearbyRepository>((ref) {
  final remote = ref.read(nearbyRemoteDataSourceProvider);
  return NearbyRepositoryImpl(remote);
});

final nearbyProvider =
    StateNotifierProvider<NearbyNotifier, NearbyState>((ref) {
  final repository = ref.read(nearbyRepositoryProvider);
  final locationService = ref.read(locationServiceProvider);
  final socketClient = ref.read(socketClientProvider);
  return NearbyNotifier(repository, locationService, socketClient);
});

class NearbyNotifier extends StateNotifier<NearbyState> {
  final NearbyRepository _repository;
  final LocationService _locationService;
  final SocketClient _socketClient;
  StreamSubscription<Map<String, dynamic>>? _socketSub;
  StreamSubscription<Position>? _gpsSub;
  Timer? _refreshTimer;

  NearbyNotifier(
    this._repository,
    this._locationService,
    this._socketClient,
  ) : super(const NearbyState());

  Future<void> init() async {
    final hasPerm = await _locationService.hasPermission();
    if (!hasPerm) {
      state = state.copyWith(
        status: NearbyStatus.loaded,
        showNearby: false,
      );
      return;
    }

    final pos = await _locationService.getCurrentPosition();
    if (pos == null) {
      state = state.copyWith(status: NearbyStatus.loaded);
      return;
    }

    final location = Location(lat: pos.latitude, lng: pos.longitude);
    state = state.copyWith(currentLocation: location);

    await saveLocation(location.lat, location.lng);
    await searchNearby(
      lat: location.lat,
      lng: location.lng,
      radius: state.radiusMeters,
    );

    _startGpsListener();
    _startSocketListener();
    _startAutoRefresh();
  }

  void _startGpsListener() {
    _gpsSub?.cancel();
    _gpsSub = _locationService.getPositionStream(10).listen((pos) {
      final location = Location(lat: pos.latitude, lng: pos.longitude);
      state = state.copyWith(currentLocation: location);
      _repository.updateLocation(location);
    });
  }

  void _startSocketListener() {
    _socketSub?.cancel();
    if (_socketClient.isConnected) {
      state = state.copyWith(socketConnected: true);
    }
    _socketSub = _socketClient.stream.listen((event) {
      final eventName = event['event'] as String?;
      if (eventName == 'presence:update' && state.currentLocation != null) {
        searchNearby(
          lat: state.currentLocation!.lat,
          lng: state.currentLocation!.lng,
          radius: state.radiusMeters,
        );
      }
    });
    state = state.copyWith(socketConnected: true);
  }

  void _startAutoRefresh() {
    _refreshTimer?.cancel();
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (state.currentLocation != null && state.showNearby) {
        searchNearby(
          lat: state.currentLocation!.lat,
          lng: state.currentLocation!.lng,
          radius: state.radiusMeters,
        );
      }
    });
  }

  Future<void> saveLocation(double lat, double lng) async {
    final result = await _repository.saveLocation(
      Location(lat: lat, lng: lng),
    );
    result.fold(
      (failure) => state = state.copyWith(
        status: NearbyStatus.error,
        errorMessage: failure.message,
      ),
      (_) {},
    );
  }

  Future<void> refreshNearby() async {
    if (state.currentLocation == null) return;
    state = state.copyWith(isRefreshing: true);
    await searchNearby(
      lat: state.currentLocation!.lat,
      lng: state.currentLocation!.lng,
      radius: state.radiusMeters,
    );
    state = state.copyWith(isRefreshing: false);
  }

  Future<void> searchNearby({
    double? lat,
    double? lng,
    int radius = 5000,
  }) async {
    if (!state.showNearby) return;

    state = state.copyWith(status: NearbyStatus.loading, errorMessage: null);
    final result = await _repository.searchNearby(
      lat: lat,
      lng: lng,
      radius: radius,
    );
    result.fold(
      (failure) => state = state.copyWith(
        status: NearbyStatus.error,
        errorMessage: failure.message,
      ),
      (users) => state = state.copyWith(
        status: NearbyStatus.loaded,
        nearbyUsers: users,
      ),
    );
  }

  void setRadius(int meters) {
    state = state.copyWith(radiusMeters: meters);
    if (state.currentLocation != null) {
      searchNearby(
        lat: state.currentLocation!.lat,
        lng: state.currentLocation!.lng,
        radius: meters,
      );
    }
  }

  Future<void> toggleShowNearby(bool value) async {
    state = state.copyWith(showNearby: value);
    if (value && state.currentLocation != null) {
      await _repository.saveLocation(state.currentLocation!);
      await searchNearby(
        lat: state.currentLocation!.lat,
        lng: state.currentLocation!.lng,
        radius: state.radiusMeters,
      );
    } else if (!value) {
      await _repository.clearLocation();
      state = state.copyWith(nearbyUsers: []);
    }
  }

  void setViewMode(ViewMode mode) {
    state = state.copyWith(viewMode: mode);
  }

  @override
  void dispose() {
    _gpsSub?.cancel();
    _socketSub?.cancel();
    _refreshTimer?.cancel();
    super.dispose();
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}
