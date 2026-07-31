import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:mocktail/mocktail.dart';
import 'package:nexa_mobile/modules/auth/presentation/providers/auth_notifier.dart';
import 'package:nexa_mobile/modules/auth/presentation/pages/login_page.dart';
import 'package:fpdart/fpdart.dart';
import '../helpers/mocks.dart';
import 'package:nexa_mobile/core/errors/failures.dart';

/// Simple wrapper for testing providers with a real GoRouter
class TestApp extends StatelessWidget {
  final AuthNotifier authNotifier;

  const TestApp({super.key, required this.authNotifier});

  @override
  Widget build(BuildContext context) {
    return ProviderScope(
      overrides: [
        authNotifierProvider.overrideWith((ref) => authNotifier),
      ],
      child: MaterialApp.router(
        routerConfig: GoRouter(
          initialLocation: '/login',
          routes: [
            GoRoute(path: '/login', builder: (_, __) => const LoginPage()),
            GoRoute(path: '/home', builder: (_, __) => const Scaffold()),
          ],
        ),
      ),
    );
  }
}

Finder _passwordEditable() {
  return find.descendant(
    of: find.byType(TextFormField).at(1),
    matching: find.byType(EditableText),
  );
}

void main() {
  late MockAuthRepository mockRepository;
  late AuthNotifier authNotifier;

  setUp(() {
    mockRepository = MockAuthRepository();
    authNotifier = AuthNotifier(mockRepository);
  });

  group('LoginPage', () {
    testWidgets('should display email and password fields', (tester) async {
      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      expect(find.text('Welcome back'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Sign In'), findsOneWidget);
      expect(find.text('Forgot password?'), findsOneWidget);
      expect(find.text("Don't have an account?"), findsOneWidget);
      expect(find.text('Create Account'), findsOneWidget);
    });

    testWidgets('should show validation errors for empty fields', (tester) async {
      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      expect(find.text('Enter your email'), findsOneWidget);
      expect(find.text('Enter your password'), findsOneWidget);
    });

    testWidgets('should show email validation error for invalid email', (tester) async {
      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'invalid-email');
      await tester.enterText(find.byType(TextFormField).at(1), 'password123');
      await tester.tap(find.text('Sign In'));
      await tester.pumpAndSettle();

      expect(find.text('Enter a valid email'), findsOneWidget);
    });

    testWidgets('should show error banner on login failure', (tester) async {
      when(() => mockRepository.login(any(), any()))
          .thenAnswer((_) async => Left(ServerFailure(message: 'Invalid credentials', statusCode: 401)));

      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'test@example.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'password123');
      await tester.tap(find.text('Sign In'));

      await tester.pumpAndSettle();

      expect(find.text('Invalid credentials'), findsOneWidget);
    });

    testWidgets('should show loading indicator while logging in', (tester) async {
      when(() => mockRepository.login(any(), any()))
          .thenAnswer((_) async => Right(tAuthTokens));
      when(() => mockRepository.getCurrentUser()).thenAnswer((_) async {
        await Future<void>.delayed(const Duration(seconds: 1));
        return Right(tUser);
      });

      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      await tester.enterText(find.byType(TextFormField).at(0), 'test@example.com');
      await tester.enterText(find.byType(TextFormField).at(1), 'password123');

      // Start the login process (don't await - we want to check loading state)
      await tester.tap(find.text('Sign In'));
      await tester.pump();

      // Loading state should show CircularProgressIndicator
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      await tester.pump(const Duration(seconds: 1));
      await tester.pump();
    });

    testWidgets('should toggle password visibility', (tester) async {
      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      // Initially password is obscured
      expect(tester.widget<EditableText>(_passwordEditable()).obscureText, isTrue);

      // Tap visibility toggle
      await tester.tap(find.byIcon(Icons.visibility_off_rounded));
      await tester.pump();

      // Password should now be visible
      expect(tester.widget<EditableText>(_passwordEditable()).obscureText, isFalse);
    });

    testWidgets('should have a forgot password link', (tester) async {
      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      expect(find.text('Forgot password?'), findsOneWidget);
    });

    testWidgets('should have a sign up link', (tester) async {
      await tester.pumpWidget(TestApp(authNotifier: authNotifier));
      await tester.pumpAndSettle();

      expect(find.text('Create Account'), findsOneWidget);
    });
  });
}
