import 'package:equatable/equatable.dart';

class User extends Equatable {
  final String id;
  final String email;
  final String? displayName;
  final String? avatarUrl;
  final String? role;
  final bool isEmailVerified;
  final DateTime createdAt;

  const User({
    required this.id,
    required this.email,
    this.displayName,
    this.avatarUrl,
    this.role,
    this.isEmailVerified = false,
    required this.createdAt,
  });

  User copyWith({
    String? id,
    String? email,
    String? displayName,
    String? avatarUrl,
    String? role,
    bool? isEmailVerified,
    DateTime? createdAt,
  }) {
    return User(
      id: id ?? this.id,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      role: role ?? this.role,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        email,
        displayName,
        avatarUrl,
        role,
        isEmailVerified,
        createdAt,
      ];
}
