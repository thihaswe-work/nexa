class ServerException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  const ServerException({
    required this.message,
    this.statusCode,
    this.data,
  });
}

class CacheException implements Exception {
  final String message;

  const CacheException({required this.message});
}

class NetworkException implements Exception {
  final String message;

  const NetworkException({required this.message});
}

class UnauthorizedException implements Exception {
  final String message;

  const UnauthorizedException({required this.message});
}

class NotFoundException implements Exception {
  final String message;

  const NotFoundException({required this.message});
}

class ValidationException implements Exception {
  final String message;
  final Map<String, dynamic>? errors;

  const ValidationException({required this.message, this.errors});
}
