import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';
import '../../domain/entities/message.dart';
import '../../domain/entities/message_reaction.dart';

part 'message_model.g.dart';

@JsonSerializable()
class MessageModel extends Message {
  const MessageModel({
    required super.id,
    required super.conversationId,
    required super.senderId,
    required super.senderName,
    super.senderAvatarUrl,
    super.content,
    super.type,
    super.editCount,
    super.attachments,
    super.reactions,
    super.replyTo,
    super.deliveredAt,
    super.readAt,
    super.editedAt,
    required super.createdAt,
  });

  factory MessageModel.fromJson(JsonMap json) =>
      _$MessageModelFromJson(json);

  JsonMap toJson() => _$MessageModelToJson(this);
}

@JsonSerializable()
class MessageAttachmentModel extends MessageAttachment {
  const MessageAttachmentModel({
    required super.id,
    required super.type,
    required super.url,
    super.fileName,
    super.fileSize,
    super.mimeType,
    super.width,
    super.height,
    super.duration,
  });

  factory MessageAttachmentModel.fromJson(JsonMap json) =>
      _$MessageAttachmentModelFromJson(json);

  JsonMap toJson() => _$MessageAttachmentModelToJson(this);
}

@JsonSerializable()
class MessageReactionModel extends MessageReaction {
  const MessageReactionModel({
    required super.emoji,
    required super.userId,
    required super.createdAt,
  });

  factory MessageReactionModel.fromJson(JsonMap json) =>
      _$MessageReactionModelFromJson(json);

  JsonMap toJson() => _$MessageReactionModelToJson(this);
}

@JsonSerializable()
class ReplyPreviewModel extends ReplyPreview {
  const ReplyPreviewModel({
    required super.id,
    required super.content,
    required super.senderId,
    required super.senderName,
  });

  factory ReplyPreviewModel.fromJson(JsonMap json) =>
      _$ReplyPreviewModelFromJson(json);

  JsonMap toJson() => _$ReplyPreviewModelToJson(this);
}
