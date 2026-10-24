# Formwise Android app

This is an Android Studio project wrapping the Formwise workout tracker as an offline-first WebView app. The HTML app is bundled locally, so workout tracking does not require internet. Exercise demonstration links open in your browser and need internet.

## Included
- LocalStorage-based workout logs and weight/waist tracking
- Import JSON backup using Android's file picker
- Export JSON backup into the phone's Downloads folder
- Exercise demonstration links open externally in the browser

## Build an APK without installing Android Studio (GitHub Actions)
1. Create a new GitHub repository and upload the contents of this folder (the `app`, `.github`, `build.gradle`, `settings.gradle`, and `gradle.properties` files) to its root.
2. Open the repository's **Actions** tab and choose **Build Formwise APK**. If prompted, enable workflows, then click **Run workflow**. A push to `main` or `master` also triggers a build.
3. When the run finishes, open it and download the **Formwise-debug-apk** artifact. Extract the ZIP to get `app-debug.apk`.
4. Send the APK to your Android phone, open it, and allow installation from that source if Android asks.

## Build locally
Open this folder in Android Studio with Android SDK Platform 35 and JDK 17 installed, then build the `app` debug APK. Or run `gradle assembleDebug` from this folder with a working Android SDK configured.

## Important
- The APK produced by this workflow is a debug build for personal installation, not a Play Store release.
- The app stores its progress locally on the device. Uninstalling the app or clearing its app data can erase logs, so export backups periodically.
- Exercise videos open in the phone's browser and require internet.
