import 'package:equatable/equatable.dart';
import '../../../user/domain/entities/profile.dart';

enum UserStatus { initial, loading, loaded, error }

class UserState extends Equatable {
  final UserStatus status;
  final Profile? profile;
  final String? errorMessage;

  const UserState({
    this.status = UserStatus.initial,
    this.profile,
    this.errorMessage,
  });

  UserState copyWith({
    UserStatus? status,
    Profile? profile,
    String? errorMessage,
  }) {
    return UserState(
      status: status ?? this.status,
      profile: profile ?? this.profile,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }

  @override
  List<Object?> get props => [status, profile, errorMessage];
}
