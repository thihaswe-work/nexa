import 'package:equatable/equatable.dart';
import '../../../../core/utils/typedefs.dart';

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

  factory Profile.fromJson(JsonMap json) => Profile(
        userId: json['userId'] as String,
        displayName: json['displayName'] as String,
        bio: json['bio'] as String?,
        avatarUrl: json['avatarUrl'] as String?,
        coverUrl: json['coverUrl'] as String?,
        lat: (json['lat'] as num?)?.toDouble(),
        lng: (json['lng'] as num?)?.toDouble(),
        showNearby: json['showNearby'] as bool? ?? true,
        birthDate: json['birthDate'] == null
            ? null
            : DateTime.parse(json['birthDate'] as String),
        gender: json['gender'] as String?,
        interests: (json['interests'] as List<dynamic>?)
                ?.map((e) => e as String)
                .toList() ??
            const [],
        createdAt: DateTime.parse(json['createdAt'] as String),
      );

  JsonMap toJson() => {
        'userId': userId,
        'displayName': displayName,
        'bio': bio,
        'avatarUrl': avatarUrl,
        'coverUrl': coverUrl,
        'lat': lat,
        'lng': lng,
        'showNearby': showNearby,
        'birthDate': birthDate?.toIso8601String(),
        'gender': gender,
        'interests': interests,
        'createdAt': createdAt.toIso8601String(),
      };

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
