import 'package:equatable/equatable.dart';

import '../../../user/domain/entities/profile.dart';

class NearbyUser extends Equatable {
  final String userId;
  final Profile profile;
  final double distance;
  final DateTime? lastSeen;

  const NearbyUser({
    required this.userId,
    required this.profile,
    required this.distance,
    this.lastSeen,
  });

  @override
  List<Object?> get props => [userId, profile, distance, lastSeen];
}
