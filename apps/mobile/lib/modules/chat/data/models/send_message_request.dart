import 'package:json_annotation/json_annotation.dart';
import '../../../../core/utils/typedefs.dart';

part 'send_message_request.g.dart';

@JsonSerializable()
class SendMessageRequest {
  final String content;
  final String? type;
  final String? replyToId;
  final List<AttachmentEntry>? attachments;

  const SendMessageRequest({
    required this.content,
    this.type,
    this.replyToId,
    this.attachments,
  });

  factory SendMessageRequest.fromJson(JsonMap json) =>
      _$SendMessageRequestFromJson(json);

  JsonMap toJson() => _$SendMessageRequestToJson(this);
}

@JsonSerializable()
class AttachmentEntry {
  final String key;
  final String type;
  final String? fileName;
  final int? fileSize;
  final String? mimeType;
  final int? width;
  final int? height;
  final int? duration;

  const AttachmentEntry({
    required this.key,
    required this.type,
    this.fileName,
    this.fileSize,
    this.mimeType,
    this.width,
    this.height,
    this.duration,
  });

  factory AttachmentEntry.fromJson(JsonMap json) =>
      _$AttachmentEntryFromJson(json);

  JsonMap toJson() => _$AttachmentEntryToJson(this);
}
