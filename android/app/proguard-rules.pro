# Proguard rules for Snake 3D Android TV app
# Keep WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Keep Leanback
-keep class androidx.leanback.** { *; }
