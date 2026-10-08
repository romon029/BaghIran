# باغ ایرانی — پروژه Android Studio

## ساخت APK
1. Android Studio (نسخه Koala یا جدیدتر) را باز کنید → Open → پوشه `BaghIran`
2. صبر کنید Gradle Sync تمام شود (بار اول اینترنت لازم است).
3. برای APK تستی: Build → Build Bundle(s)/APK(s) → Build APK(s)
   خروجی: `app/build/outputs/apk/debug/app-debug.apk`
4. برای انتشار: Build → Generate Signed Bundle / APK → APK

## ساختار
- `app/src/main/assets/index.html` ← خود بازی
- `app/src/main/assets/features.js` ← فیچرهای جدید
- `app/src/main/java/com/baghiran/game/MainActivity.java` ← WebView + لرزش/اشتراک native
