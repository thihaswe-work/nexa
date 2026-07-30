// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'send_message_request.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SendMessageRequest _$SendMessageRequestFromJson(Map<String, dynamic> json) =>
    SendMessageRequest(
      content: json['content'] as String,
      type: json['type'] as String?,
      replyToId: json['replyToId'] as String?,
      attachments: (json['attachments'] as List<dynamic>?)
          ?.map((e) => AttachmentEntry.fromJson(e as Map<String, dynamic>))
          .toList(),
    );

Map<String, dynamic> _$SendMessageRequestToJson(SendMessageRequest instance) =>
    <String, dynamic>{
      'content': instance.content,
      'type': instance.type,
      'replyToId': instance.replyToId,
      'attachments': instance.attachments,
    };

AttachmentEntry _$AttachmentEntryFromJson(Map<String, dynamic> json) =>
    AttachmentEntry(
      key: json['key'] as String,
      type: json['type'] as String,
      fileName: json['fileName'] as String?,
      fileSize: (json['fileSize'] as num?)?.toInt(),
      mimeType: json['mimeType'] as String?,
      width: (json['width'] as num?)?.toInt(),
      height: (json['height'] as num?)?.toInt(),
      duration: (json['duration'] as num?)?.toInt(),
    );

Map<String, dynamic> _$AttachmentEntryToJson(AttachmentEntry instance) =>
    <String, dynamic>{
      'key': instance.key,
      'type': instance.type,
      'fileName': instance.fileName,
      'fileSize': instance.fileSize,
      'mimeType': instance.mimeType,
      'width': instance.width,
      'height': instance.height,
      'duration': instance.duration,
    };
