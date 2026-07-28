import 'package:equatable/equatable.dart';

class Profile extends Equatable {
  final String userId;
  final String displayName;
  final String? bio;
  final String? avatarUrl;
  final String? coverUrl;
  final double? lat;
  final double? lng;
  final bool showNearby;
  final DateTime? birthDate;
  final String? gender;
  final List<String> interests;
  final DateTime createdAt;

  const Profile({
    required this.userId,
    required this.displayName,
    this.bio,
    this.avatarUrl,
    this.coverUrl,
    this.lat,
    this.lng,
    this.showNearby = true,
    this.birthDate,
    this.gender,
    this.interests = const [],
    required this.createdAt,
  });

  Profile copyWith({
    String? userId,
    String? displayName,
    String? bio,
    String? avatarUrl,
    String? coverUrl,
    double? lat,
    double? lng,
    bool? showNearby,
    DateTime? birthDate,
    String? gender,
    List<String>? interests,
    DateTime? createdAt,
  }) {
    return Profile(
      userId: userId ?? this.userId,
      displayName: displayName ?? this.displayName,
      bio: bio ?? this.bio,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      coverUrl: coverUrl ?? this.coverUrl,
      lat: lat ?? this.lat,
      lng: lng ?? this.lng,
      showNearby: showNearby ?? this.showNearby,
      birthDate: birthDate ?? this.birthDate,
      gender: gender ?? this.gender,
      interests: interests ?? this.interests,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        userId,
        displayName,
        bio,
        avatarUrl,
        coverUrl,
        lat,
        lng,
        showNearby,
        birthDate,
        gender,
        interests,
        createdAt,
      ];
}
