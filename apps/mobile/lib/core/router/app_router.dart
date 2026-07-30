import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../modules/auth/presentation/pages/splash_page.dart';
import '../../modules/auth/presentation/pages/login_page.dart';
import '../../modules/auth/presentation/pages/register_page.dart';
import '../../modules/auth/presentation/pages/forgot_password_page.dart';
import '../../modules/auth/presentation/pages/home_page.dart';
import '../../modules/auth/presentation/providers/auth_provider.dart';
import '../../modules/nearby/presentation/pages/nearby_screen.dart';
import '../../modules/chat/presentation/pages/chat_list_page.dart';
import '../../modules/chat/presentation/pages/chat_conversation_page.dart';
import '../../modules/notification/presentation/pages/notifications_page.dart';
import '../../modules/settings/presentation/pages/settings_page.dart';
import '../../modules/settings/presentation/pages/privacy_settings_page.dart';
import '../../modules/user/presentation/pages/profile_page.dart';

final appRouterProvider = Provider<GoRouter>((ref) {
  final authListenable = ValueNotifier<int>(0);

  ref.listen<AuthState>(authNotifierProvider, (_, __) {
    authListenable.value++;
  });

  final router = GoRouter(
    initialLocation: '/splash',
    refreshListenable: authListenable,
    redirect: (context, state) {
      final authState = ref.read(authNotifierProvider);
      final isAuth = authState.status == AuthStatus.authenticated;
      final isSplash = state.matchedLocation == '/splash';
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register' ||
          state.matchedLocation == '/forgot-password';

      if (authState.status == AuthStatus.initial ||
          authState.status == AuthStatus.loading) {
        return isSplash ? null : '/splash';
      }
      if (isSplash) return null;

      if (!isAuth && !isAuthRoute) return '/login';
      if (isAuth && isAuthRoute) return '/home';

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginPage(),
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) => const RegisterPage(),
      ),
      GoRoute(
        path: '/forgot-password',
        name: 'forgotPassword',
        builder: (context, state) => const ForgotPasswordPage(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const HomePage(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfilePage(),
      ),
      GoRoute(
        path: '/profile/edit',
        name: 'profileEdit',
        builder: (context, state) => const ProfileEditPage(),
      ),
      GoRoute(
        path: '/profile/:userId',
        name: 'userProfile',
        builder: (context, state) => ProfilePage(userId: state.pathParameters['userId']),
      ),
      GoRoute(
        path: '/nearby',
        name: 'nearby',
        pageBuilder: (context, state) => CustomTransitionPage(
          key: state.pageKey,
          child: const NearbyScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return SlideTransition(
              position: Tween<Offset>(begin: const Offset(1, 0), end: Offset.zero).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
              child: child,
            );
          },
        ),
      ),
      GoRoute(
        path: '/chat',
        name: 'chat',
        builder: (context, state) => const ChatListPage(),
      ),
      GoRoute(
        path: '/chat/:conversationId',
        name: 'chatConversation',
        builder: (context, state) => ChatConversationPage(
          conversationId: state.pathParameters['conversationId']!,
        ),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsPage(),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsPage(),
      ),
      GoRoute(
        path: '/settings/privacy',
        name: 'privacySettings',
        builder: (context, state) => const PrivacySettingsPage(),
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});
