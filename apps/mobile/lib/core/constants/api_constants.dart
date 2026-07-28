class ApiConstants {
  ApiConstants._();

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';

  // Users
  static const String users = '/users';
  static const String profile = '/users/profile';
  static const String uploadAvatar = '/users/avatar';
  static const String interests = '/interests';

  // Nearby
  static const String nearby = '/nearby';
  static const String nearbySearch = '/nearby/search';
  static const String nearbySaveLocation = '/nearby/location';
  static const String nearbyClearLocation = '/nearby/clear-location';

  // Chat
  static const String conversations = '/chat/conversations';
  static const String privateConversation = '/chat/conversations/private';
  static const String nearbyRooms = '/chat/nearby/rooms';
  static const String joinRoom = '/chat/nearby/rooms';
  static const String leaveRoom = '/chat/nearby/rooms';

  static String messages(String conversationId) =>
      '/chat/conversations/$conversationId/messages';

  static String editMessage(String messageId) =>
      '/chat/messages/$messageId';

  static String addReaction(String messageId) =>
      '/chat/messages/$messageId/reactions';

  static String removeReaction(String messageId, String emoji) =>
      '/chat/messages/$messageId/reactions/$emoji';

  // Notifications
  static const String notifications = '/notifications';
  static const String markAllRead = '/notifications/read-all';

  static String markRead(String id) => '/notifications/$id/read';
  static String deleteNotification(String id) => '/notifications/$id';
}
