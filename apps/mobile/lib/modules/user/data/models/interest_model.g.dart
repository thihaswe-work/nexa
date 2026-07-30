// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'interest_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InterestModel _$InterestModelFromJson(Map<String, dynamic> json) =>
    InterestModel(
      id: json['id'] as String,
      name: json['name'] as String,
      category: json['category'] as String?,
      icon: json['icon'] as String?,
    );

Map<String, dynamic> _$InterestModelToJson(InterestModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'category': instance.category,
      'icon': instance.icon,
    };
