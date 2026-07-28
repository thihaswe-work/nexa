# ---- Flutter Build Stage (Android APK) ----
FROM ghcr.io/cirruslabs/flutter:3.22.0 AS android-builder
LABEL stage=android-builder

WORKDIR /app

# Copy pubspec and get dependencies
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy source code
COPY . .

# Build Android APK (release)
RUN flutter build apk --release --split-per-abi

# ---- Flutter Build Stage (Android App Bundle) ----
FROM ghcr.io/cirruslabs/flutter:3.22.0 AS android-aab-builder
LABEL stage=android-aab-builder

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .

# Build Android App Bundle for Play Store
RUN flutter build appbundle --release

# ---- Flutter Build Stage (iOS IPA) ----
FROM ghcr.io/cirruslabs/flutter:3.22.0 AS ios-builder
LABEL stage=ios-builder

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .

# Build iOS (requires macOS runner with Xcode)
RUN flutter build ios --release --no-codesign

# ---- Web Build Stage (Flutter Web fallback) ----
FROM ghcr.io/cirruslabs/flutter:3.22.0 AS web-builder
LABEL stage=web-builder

WORKDIR /app

COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

COPY . .

RUN flutter build web --release

# ---- Production (static web files) ----
FROM nginx:alpine AS production

COPY --from=web-builder /app/build/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
