# Building the Native Android App (MindEase AI)

The native Android app is a **React Native (Expo SDK 57) application** under `frontend/`.
It is **not** a WebView — it is a real native app (Jetpack Compose/New Architecture + Hermes JS engine).

Delivery artifacts (signed with the release keystore):

| Artifact | Purpose | Backend |
|----------|---------|---------|
| `mindease-ai-release.apk` | Installable production APK | `https://mindease-backend-r87i.onrender.com` |
| `mindease-ai-dev-LAN.apk` | Installable dev APK (same Wi-Fi) | `http://10.114.11.118:8000` (LAN) |
| `mindease-ai-release.aab` | Google Play Store bundle | `https://mindease-backend-r87i.onrender.com` |

> The production APK contains **no** `localhost`, `127.0.0.1`, or LAN IP. The bundled JS is scanned
> as part of the release checklist.

---

## 1. Prerequisites

- Node.js 20+ (this project was built with Node 26 / npm 11)
- JDK 17+ (built with **JDK 21**)
- Android SDK (compileSdk 36, build-tools 37.x, NDK **27.1.12297006**, CMake 3.22.1)
- Expo CLI (`npx expo`), packages under `frontend/package.json`

Current machine values (examples):
- `JAVA_HOME=D:\Java\jdk-21.0.12.1+1`
- `ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk`

## 2. Important Windows gotcha — NDK and spaces in the user path

If your user profile contains a space (e.g. `C:\Users\SHREYAS D R\...`), the CMake/clang
build strips `++` from `clang++.exe` (8.3 short name `CLANG_~1.EXE`), so clang compiles C++ as C
and the linker fails with thousands of `undefined symbol: std::terminate / operator new / __cxa_*`
errors.

**Fix:** copy the NDK to a space-free path and point Gradle at it:

```powershell
robocopy "$env:LOCALAPPDATA\Android\Sdk\ndk\27.1.12297006" D:\ndk\27.1.12297006 /E /MT:32
```

Then create `frontend/android/local.properties` (it is git-ignored):

```properties
sdk.dir=C\:\\Users\\SHREYAS~1\\AppData\\Local\\Android\\Sdk
ndk.dir=D\:\\ndk\\27.1.12297006
```

Symlinks do **not** work (CMake resolves them back to the spaced path); a physical copy is required.

## 3. Rebuilding from scratch

```powershell
cd D:\mindEase-ai\frontend

# 1) Clean + regenerate native project from app.json
npx expo prebuild -p android

# 2) Type-check
npx tsc --noEmit

# 3) Build the PRODUCTION APK (EXPO_PUBLIC_API_URL points at the Render backend)
$env:JAVA_HOME = "D:\Java\jdk-21.0.12.1+1"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:EXPO_PUBLIC_API_URL = "https://mindease-backend-r87i.onrender.com"
Remove-Item -Recurse -Force app\build\generated\assets\react\release   # clear the old JS bundle first
cd android
.\gradlew.bat assembleRelease --no-daemon

# 4) Build the Google Play bundle
.\gradlew.bat bundleRelease --no-daemon

# 5) Build a dev APK that talks to the laptop's LAN backend
Remove-Item -Recurse -Force app\build\generated\assets\react\release   # clear old JS bundle
$env:EXPO_PUBLIC_API_URL = "http://<LAN-IP>:8000"
.\gradlew.bat assembleRelease --no-daemon
```

Outputs:
- APK: `app/build/outputs/apk/release/app-release.apk`
- AAB: `app/build/outputs/bundle/release/app-release.aab`

## 4. Build notes / troubleshooting

- **`EXPO_PUBLIC_API_URL`** is inlined by `babel-preset-expo` **at bundle time** (`frontend/src/config.ts`).
  The gradle JS-bundling task (`createBundleReleaseJsAndAssets`) is incremental and does **not**
  track environment variables — that is why you must `Remove-Item` the generated JS asset before
  switching env, and why `clean`/re-prebuild is sometimes required.
- **Gradle daemon caching:** the daemon captures the environment from its first launch. Use
  `--no-daemon` when the `EXPO_PUBLIC_API_URL` differs between builds.
- **`react_native_dev_server_ip`:** the RN gradle plugin bakes the machine's LAN IP into
  `resources.arsc` unless overridden. `frontend/android/gradle.properties` sets
  `reactNativeDevServerIp=localhost` for this project. Re-apply this line if you regenerate the
  native project (it is not managed by prebuild).
- Metro transform cache: if switching environments appears to have no effect, clear
  `%LOCALAPPDATA%\Temp\metro-cache` and `dist-test/` before rebundling.

## 5. Signing

The release build is signed with a dedicated release keystore (NOT the debug keystore):

- Keystore: `C:\Users\SHREYAS D R\Desktop\mindEase-ai\keystore\mindease-release.keystore` (alias `mindease-release`)
- Passwords: `C:\Users\SHREYAS D R\Desktop\mindEase-ai\keystore\storepass.txt`
- Gradle wiring: `frontend/android/keystore.properties` (absolute paths, git-ignored)
- Both `*.keystore` and `keystore.properties` are excluded from git.

> **Back up the keystore + password.** Losing it means you cannot update the existing Play listing.

Verify a build:

```powershell
$env:JAVA_HOME = "D:\Java\jdk-21.0.12.1+1"
& "$env:LOCALAPPDATA\Android\Sdk\build-tools\37.0.0\apksigner.bat" verify --print-certs app-release.apk
# V2 Signer: certificate DN: CN=MindEase AI, ...
```

## 6. Release checklist (verify before shipping)

1. `apksigner verify --print-certs` shows the MindEase release cert.
2. Embedded JS bundle contains the production backend URL only (`https://mindease-backend-r87i.onrender.com`).
3. Scan the whole APK for dev URLs: must NOT contain `10.114.11.118`.
4. Backend smoke-test: `GET https://mindease-backend-r87i.onrender.com/health` returns `{"status":"healthy"}`.
5. Install APK on a device over USB/Wi-Fi and complete login + one mood log + one chat message.
6. Ensure notification permission is granted if daily reminder is enabled.

## 7. App configuration

Branding/identity lives in `frontend/app.json`:

- package `com.mindeaseai.app`, version `1.0.0` (versionCode 1)
- splash: `assets/splash-icon.png` on `#0FA3B3`
- adaptive icon: `assets/android-icon-foreground.png` on `#0FA3B3`
- theme mode: `automatic` (dark/light/system, controlled from Profile screen)

Icons/splash are generated by `frontend/scripts/generate-assets.ps1` (re-run to regenerate).