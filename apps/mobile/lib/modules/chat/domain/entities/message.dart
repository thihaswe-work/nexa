import 'package:equatable/equatable.dart';

class Message extends Equatable {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final String? senderAvatarUrl;
  final String? content;
  final String type;
  final int editCount;
  final List<MessageAttachment> attachments;
  final List<MessageReaction> reactions;
  final ReplyPreview? replyTo;
  final String? deliveredAt;
  final String? readAt;
  final String? editedAt;
  final String createdAt;

  const Message({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    this.senderAvatarUrl,
    this.content,
    this.type = 'TEXT',
    this.editCount = 0,
    this.attachments = const [],
    this.reactions = const [],
    this.replyTo,
    this.deliveredAt,
    this.readAt,
    this.editedAt,
    required this.createdAt,
  });

  @override
  List<Object?> get props => [
        id,
        conversationId,
        senderId,
        senderName,
        senderAvatarUrl,
        content,
        type,
        editCount,
        attachments,
        reactions,
        replyTo,
        deliveredAt,
        readAt,
        editedAt,
        createdAt,
      ];
}

class MessageAttachment extends Equatable {
  final String id;
  final String type;
  final String url;
  final String? fileName;
  final int? fileSize;
  final String? mimeType;
  final int? width;
  final int? height;
  final int? duration;

  const MessageAttachment({
    required this.id,
    required this.type,
    required this.url,
    this.fileName,
    this.fileSize,
    this.mimeType,
    this.width,
    this.height,
    this.duration,
  });

  @override
  List<Object?> get props => [
        id,
        type,
        url,
        fileName,
        fileSize,
        mimeType,
        width,
        height,
        duration,
      ];
}

class ReplyPreview extends Equatable {
  final String id;
  final String content;
  final String senderId;
  final String senderName;

  const ReplyPreview({
    required this.id,
    required this.content,
    required this.senderId,
    required this.senderName,
  });

  @override
  List<Object?> get props => [id, content, senderId, senderName];
}
