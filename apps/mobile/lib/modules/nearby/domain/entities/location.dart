import 'package:equatable/equatable.dart';

class Location extends Equatable {
  final double lat;
  final double lng;

  const Location({required this.lat, required this.lng});

  @override
  List<Object?> get props => [lat, lng];
}
