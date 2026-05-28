# Руководство по сборке APK — «Маленькие Истории»

Это руководство описывает процесс сборки Android APK для приложения «Маленькие Истории» с использованием Capacitor.

---

## Содержание

1. [Предварительные требования](#предварительные-требования)
2. [Архитектура проекта](#архитектура-проекта)
3. [Быстрая сборка (команды)](#быстрая-сборка)
4. [Пошаговая инструкция](#пошаговая-инструкция)
5. [Конфигурация Capacitor](#конфигурация-capacitor)
6. [Известные ограничения](#известные-ограничения)
7. [Альтернатива: PWA Builder](#альтернатива-pwa-builder)
8. [Устранение неполадок](#устранение-неполадок)

---

## Предварительные требования

### Обязательные

| Компонент | Минимальная версия | Ссылка |
|---|---|---|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org) |
| **Bun** | 1.0+ | [bun.sh](https://bun.sh) |
| **Android Studio** | 2023.1+ | [developer.android.com/studio](https://developer.android.com/studio) |
| **Java JDK** | 17 | Встроен в Android Studio или [adoptium.net](https://adoptium.net) |
| **Android SDK** | API 34+ | Через Android Studio SDK Manager |

### Установка Android SDK через Android Studio

1. Откройте Android Studio → **Settings** → **Appearance & Behavior** → **System Settings** → **Android SDK**
2. Установите:
   - **Android 14 (API 34)** или новее
   - **Android SDK Build-Tools** (последняя версия)
   - **Android SDK Platform-Tools**
3. Запомните путь к SDK (обычно `~/Android/Sdk` на Linux, `~/Library/Android/sdk` на macOS)

### Переменные окружения

Добавьте в ваш `~/.bashrc` или `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk  # путь может отличаться
```

---

## Архитектура проекта

Проект использует **два режима сборки Next.js**:

| Режим | Команда | Назначение | Выход |
|---|---|---|---|
| `standalone` | `bun run build` | Серверное развёртывание | `.next/standalone/` |
| `export` | `bun run build:apk` | Статический экспорт для APK | `out/` |

Переключение режима происходит через переменную окружения `BUILD_TARGET=apk`.

### Файлы конфигурации

- **`next.config.ts`** — автоматически выбирает `output: "export"` при `BUILD_TARGET=apk`
- **`capacitor.config.ts`** — настройки Capacitor (appId, webDir, splash screen)
- **`android/`** — нативный Android-проект, созданный Capacitor

---

## Быстрая сборка

```bash
# 1. Сборка статики и синхронизация с Android
cd /home/z/my-project
bun run build:apk

# 2. Открыть проект в Android Studio
bun run cap:open

# 3. В Android Studio: Build → Build Bundle(s) / APK(s) → Build APK(s)
```

---

## Пошаговая инструкция

### Шаг 1. Установите зависимости

```bash
cd /home/z/my-project
bun install
```

### Шаг 2. Сборка статического экспорта

```bash
bun run build:apk
```

Эта команда:
1. Устанавливает `BUILD_TARGET=apk`, что переключает Next.js в режим `output: "export"`
2. Запускает `next build`, который создаёт статические файлы в папке `out/`
3. Запускает `npx cap sync android`, который копирует файлы из `out/` в `android/app/src/main/assets/public/`

### Шаг 3. Откройте проект в Android Studio

```bash
bun run cap:open
```

Или вручную: откройте Android Studio → **Open an existing project** → выберите папку `android/` в корне проекта.

### Шаг 4. Сборка APK в Android Studio

1. Дождитесь завершения индексации и синхронизации Gradle
2. В меню: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
3. Готовый APK появится в `android/app/build/outputs/apk/debug/app-debug.apk`

### Шаг 5. (Опционально) Подписанный релизный APK

Для публикации в Google Play:

1. Создайте keystore:
   ```bash
   keytool -genkey -v -keystore littlestories.keystore -alias littlestories -keyalg RSA -keysize 2048 -validity 10000
   ```

2. Создайте файл `android/key.properties`:
   ```properties
   storePassword=ВАШ_ПАРОЛЬ
   keyPassword=ВАШ_ПАРОЛЬ
   keyAlias=littlestories
   storeFile=/путь/к/littlestories.keystore
   ```

3. Соберите release APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

4. APK будет в `android/app/build/outputs/apk/release/app-release.apk`

---

## Конфигурация Capacitor

### capacitor.config.ts

```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.littlestories.app',        // Уникальный ID приложения
  appName: 'Маленькие Истории',           // Название на устройстве
  webDir: 'out',                          // Папка со статикой
  server: {
    androidScheme: 'https',               // Рекомендуемая схема для Android
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#fff7ed',
    },
  },
};
```

### Полезные команды

| Команда | Описание |
|---|---|
| `bun run build:apk` | Сборка статики + синхронизация с Android |
| `bun run cap:sync` | Копировать `out/` → Android (без пересборки) |
| `bun run cap:open` | Открыть Android Studio |
| `bun run cap:run` | Запустить на подключённом устройстве |
| `npx cap copy android` | Только копировать файлы (быстрее sync) |

### Живое обновление при разработке

Для отладки на реальном устройстве без пересборки:

1. В `capacitor.config.ts` раскомментируйте `server.url`:
   ```typescript
   server: {
     url: 'http://192.168.1.X:3000',  // IP вашего компьютера
     cleartext: true,
   },
   ```

2. Запустите dev-сервер: `bun run dev`

3. Выполните: `npx cap run android`

Приложение будет загружать страницу с вашего dev-сервера в реальном времени.

---

## Известные ограничения

### API-маршруты не поддерживаются в статическом экспорте

Проект содержит API-маршруты в `src/app/api/`:
- `api/route.ts`
- `api/seed/route.ts`
- `api/generate-image/route.ts`
- `api/stories/route.ts`
- `api/stories/[id]/route.ts`

**API-маршруты Next.js не работают в статическом экспорте** (`output: "export"`). Это значит, что:

- Функции, зависящие от серверных API (генерация изображений, работа с БД), **не будут работать** в APK
- При запуске `bun run build:apk` возможны ошибки сборки из-за наличия API-маршрутов

### Способы решения

1. **Рефакторинг**: перенести серверную логику в отдельный бэкенд, а в приложении вызывать внешние API
2. **Удаление API-маршрутов**: если приложение полностью клиентское, удалите папку `src/app/api/`
3. **Использование PWA Builder**: генерация APK из PWA без необходимости статического экспорта (см. ниже)

---

## Альтернатива: PWA Builder

Если в проекте есть API-маршруты и статический экспорт невозможен, используйте **PWA Builder** для создания APK из PWA.

### Что такое PWA Builder?

[PWA Builder](https://www.pwabuilder.com) — бесплатный сервис от Microsoft, который упаковывает PWA в APK (используя Trusted Web Activity / TWA). Приложение работает как обёртка вокруг сайта.

### Преимущества

- Не нужен статический экспорт — APK загружает ваш сайт
- Не нужен Android Studio
- Автоматическая генерация подписанного APK
- Поддержка push-уведомлений
- Бесплатно

### Инструкция

1. **Убедитесь, что PWA настроена корректно**:
   - Файл `public/manifest.json` уже существует в проекте
   - Убедитесь, что сайт доступен по HTTPS
   - Добавьте Service Worker (если его нет)

2. **Откройте [pwabuilder.com](https://www.pwabuilder.com)**

3. **Введите URL вашего развёрнутого сайта** (например, `https://littlestories.example.com`)

4. **Нажмите "Start"** — PWA Builder проанализирует ваш манифест

5. **Устраните предупреждения**, если они есть (обычно это отсутствие иконок определённого размера)

6. **Нажмите "Package for stores"** → выберите **Android**

7. **Настройте параметры**:
   - Package name: `com.littlestories.app`
   - App name: `Маленькие Истории`
   - Выберите формат: **APK** или **AAB** (для Google Play)

8. **Скачайте сгенерированный APK**

### Недостатки PWA Builder

- Приложение требует интернет-соединение (если не настроен offline-кэш)
- Меньше доступ к нативным функциям устройства
- Производительность может быть ниже, чем у нативного Capacitor-приложения

---

## Устранение неполадок

### Ошибка: "Android SDK not found"

```bash
# Установите Android SDK и задайте ANDROID_HOME
export ANDROID_HOME=$HOME/Android/Sdk
```

### Ошибка: "out directory missing"

```bash
# Сначала соберите статический экспорт
BUILD_TARGET=apk next build
```

### Ошибка при сборке из-за API-маршрутов

Если `next build` с `output: "export"` падает из-за API-маршрутов, временно удалите или переименуйте `src/app/api/`:

```bash
mv src/app/api src/app/api_backup
BUILD_TARGET=apk next build
npx cap sync android
mv src/app/api_backup src/app/api
```

### Ошибка Gradle: "Could not resolve com.android.application"

Откройте `android/build.gradle` и убедитесь, что репозитории Google и Maven Central указаны:

```gradle
allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

### Изменение иконок приложения

Замените файлы в папках `android/app/src/main/res/mipmap-*/`:
- `ic_launcher.png` — основная иконка
- `ic_launcher_round.png` — круглая иконка
- `ic_launcher_foreground.png` — передний план (adaptive icon)

Рекомендуемый инструмент: [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)

### Как обновить веб-контент в APK

После изменения кода:

```bash
bun run build:apk
# Затем пересоберите APK в Android Studio
```

---

## Структура файлов

```
my-project/
├── android/                    # Нативный Android-проект (Capacitor)
│   ├── app/
│   │   ├── build.gradle        # Настройки сборки Android-приложения
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       ├── java/com/littlestories/app/MainActivity.java
│   │       └── res/            # Иконки, splash-экраны, строки
│   ├── build.gradle            # Корневые настройки Gradle
│   └── settings.gradle
├── capacitor.config.ts         # Конфигурация Capacitor
├── next.config.ts              # Конфигурация Next.js (с поддержкой APK)
├── public/
│   ├── manifest.json           # PWA манифест
│   ├── icon-192.png
│   └── icon-512.png
├── out/                        # Статический экспорт (создаётся при build:apk)
└── src/                        # Исходный код Next.js
```

---

*Руководство создано автоматически. Последнее обновление: март 2026.*
