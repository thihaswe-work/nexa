class AppConfig {
  static const String appName = 'Nexa';
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://localhost:4000/api/v1',
  );
  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'http://localhost:4000',
  );
  static const int connectTimeout = 15000;
  static const int receiveTimeout = 15000;
  static const int uploadTimeout = 60000;
}
