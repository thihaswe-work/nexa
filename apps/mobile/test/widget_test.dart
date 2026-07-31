import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:nexa_mobile/app.dart';

void main() {
  testWidgets('NexaApp builds and renders', (WidgetTester tester) async {
    await tester.pumpWidget(const ProviderScope(child: NexaApp()));
    await tester.pump();

    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
