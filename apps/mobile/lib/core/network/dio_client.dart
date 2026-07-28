import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../config/app_config.dart';
import '../storage/secure_storage.dart';

final dioClientProvider = Provider<DioClient>((ref) {
  final secureStorage = ref.read(secureStorageProvider);
  return DioClient(secureStorage);
});

class DioClient {
  late final Dio _dio;
  final SecureStorage _storage;

  DioClient(this._storage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: AppConfig.apiBaseUrl,
        connectTimeout: const Duration(milliseconds: AppConfig.connectTimeout),
        receiveTimeout: const Duration(milliseconds: AppConfig.receiveTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _dio.interceptors.addAll([
      _AuthInterceptor(_storage, _dio),
      _LogInterceptor(),
    ]);
  }

  Dio get dio => _dio;

  Future<void> setAuthToken(String token) async {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void removeAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
}

class _AuthInterceptor extends Interceptor {
  final SecureStorage _storage;
  final Dio _dio;
  bool _isRefreshing = false;
  final Set<String> _retriedRequests = {};

  _AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!options.headers.containsKey('Authorization')) {
      final token = await _storage.getAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode != 401 || _isRefreshing) {
      handler.next(err);
      return;
    }

    final requestId = '${err.requestOptions.method}:${err.requestOptions.path}';
    if (_retriedRequests.contains(requestId)) {
      handler.next(err);
      return;
    }
    _retriedRequests.add(requestId);

    final refreshToken = await _storage.getRefreshToken();
    if (refreshToken == null) {
      handler.next(err);
      return;
    }

    _isRefreshing = true;
    try {
      final response = await _dio.post('/auth/refresh', data: {
        'refreshToken': refreshToken,
      });
      if (response.statusCode == 200) {
        final accessToken = response.data['accessToken'] as String;
        final newRefreshToken = response.data['refreshToken'] as String;
        await _storage.saveTokens(accessToken, newRefreshToken);
        err.requestOptions.headers['Authorization'] = 'Bearer $accessToken';
        final retry = await _dio.fetch(err.requestOptions);
        _retriedRequests.remove(requestId);
        handler.resolve(retry);
        return;
      }
    } catch (_) {
      await _storage.clearTokens();
    } finally {
      _isRefreshing = false;
    }
    handler.next(err);
  }
}

class _LogInterceptor extends Interceptor {
  @override
  void onRequest(RequestOptions options, RequestInterceptorHandler handler) {
    handler.next(options);
  }

  @override
  void onResponse(Response response, ResponseInterceptorHandler handler) {
    handler.next(response);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) {
    handler.next(err);
  }
}
