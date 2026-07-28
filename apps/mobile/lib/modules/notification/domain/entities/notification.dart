import 'package:equatable/equatable.dart';

class Notification extends Equatable {
  final String id;
  final String type;
  final String title;
  final String body;
  final String? imageUrl;
  final String? data;
  final bool isRead;
  final String createdAt;

  const Notification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    this.imageUrl,
    this.data,
    this.isRead = false,
    required this.createdAt,
  });

  Notification copyWith({bool? isRead}) {
    return Notification(
      id: id,
      type: type,
      title: title,
      body: body,
      imageUrl: imageUrl,
      data: data,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt,
    );
  }

  @override
  List<Object?> get props => [
        id,
        type,
        title,
        body,
        imageUrl,
        data,
        isRead,
        createdAt,
      ];
}
