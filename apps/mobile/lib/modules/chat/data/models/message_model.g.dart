// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'message_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

MessageModel _$MessageModelFromJson(Map<String, dynamic> json) => MessageModel(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
      senderAvatarUrl: json['senderAvatarUrl'] as String?,
      content: json['content'] as String?,
      type: json['type'] as String? ?? 'TEXT',
      editCount: (json['editCount'] as num?)?.toInt() ?? 0,
      attachments: (json['attachments'] as List<dynamic>?)
              ?.map(
                  (e) => MessageAttachment.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      reactions: (json['reactions'] as List<dynamic>?)
              ?.map((e) => MessageReaction.fromJson(e as Map<String, dynamic>))
              .toList() ??
          const [],
      replyTo: json['replyTo'] == null
          ? null
          : ReplyPreview.fromJson(json['replyTo'] as Map<String, dynamic>),
      deliveredAt: json['deliveredAt'] as String?,
      readAt: json['readAt'] as String?,
      editedAt: json['editedAt'] as String?,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$MessageModelToJson(MessageModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'conversationId': instance.conversationId,
      'senderId': instance.senderId,
      'senderName': instance.senderName,
      'senderAvatarUrl': instance.senderAvatarUrl,
      'content': instance.content,
      'type': instance.type,
      'editCount': instance.editCount,
      'attachments': instance.attachments,
      'reactions': instance.reactions,
      'replyTo': instance.replyTo,
      'deliveredAt': instance.deliveredAt,
      'readAt': instance.readAt,
      'editedAt': instance.editedAt,
      'createdAt': instance.createdAt,
    };

MessageAttachmentModel _$MessageAttachmentModelFromJson(
        Map<String, dynamic> json) =>
    MessageAttachmentModel(
      id: json['id'] as String,
      type: json['type'] as String,
      url: json['url'] as String,
      fileName: json['fileName'] as String?,
      fileSize: (json['fileSize'] as num?)?.toInt(),
      mimeType: json['mimeType'] as String?,
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      duration: (json['duration'] as num?)?.toInt(),
    );

Map<String, dynamic> _$MessageAttachmentModelToJson(
        MessageAttachmentModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'type': instance.type,
      'url': instance.url,
      'fileName': instance.fileName,
      'fileSize': instance.fileSize,
      'mimeType': instance.mimeType,
      'width': instance.width,
      'height': instance.height,
      'duration': instance.duration,
    };

MessageReactionModel _$MessageReactionModelFromJson(
        Map<String, dynamic> json) =>
    MessageReactionModel(
      emoji: json['emoji'] as String,
      userId: json['userId'] as String,
      createdAt: json['createdAt'] as String,
    );

Map<String, dynamic> _$MessageReactionModelToJson(
        MessageReactionModel instance) =>
    <String, dynamic>{
      'emoji': instance.emoji,
      'userId': instance.userId,
      'createdAt': instance.createdAt,
    };

ReplyPreviewModel _$ReplyPreviewModelFromJson(Map<String, dynamic> json) =>
    ReplyPreviewModel(
      id: json['id'] as String,
      content: json['content'] as String,
      senderId: json['senderId'] as String,
      senderName: json['senderName'] as String,
    );

Map<String, dynamic> _$ReplyPreviewModelToJson(ReplyPreviewModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'content': instance.content,
      'senderId': instance.senderId,
      'senderName': instance.senderName,
    };
