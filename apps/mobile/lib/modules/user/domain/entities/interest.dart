import 'package:equatable/equatable.dart';

class Interest extends Equatable {
  final String id;
  final String name;
  final String? category;
  final String? icon;

  const Interest({
    required this.id,
    required this.name,
    this.category,
    this.icon,
  });

  @override
  List<Object?> get props => [id, name, category, icon];
}
