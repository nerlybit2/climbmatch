# Add project specific ProGuard rules here.
# You can control the set of applied configuration files using the
# proguardFiles setting in build.gradle.
#
# For more details, see
#   http://developer.android.com/guide/developing/tools/proguard.html

# ── Preserve runtime annotations ─────────────────────────────────────────────
# R8 strips annotations by default. Without this, @CapacitorPlugin on plugin
# classes becomes null at runtime, causing NullPointerException in
# Plugin.getPermissionStates() → fatal crash on the CapacitorPlugins thread.
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions

# ── Capacitor core ────────────────────────────────────────────────────────────
-keep class com.getcapacitor.** { *; }
-keep @com.getcapacitor.annotation.CapacitorPlugin class * { *; }
-keepclassmembers class * {
    @com.getcapacitor.annotation.PluginMethod public *;
}

# ── Capacitor plugins ─────────────────────────────────────────────────────────
-keep class com.capacitorjs.plugins.** { *; }

# ── Firebase / Google services ────────────────────────────────────────────────
# Firebase includes its own consumer ProGuard rules, but R8 in full-mode can
# still strip initializers. Keeping these prevents "FirebaseApp not initialized".
-keep class com.google.firebase.** { *; }
-keep class com.google.android.gms.** { *; }
-dontwarn com.google.firebase.**
-dontwarn com.google.android.gms.**

# ── Debugging: preserve line numbers in stack traces ──────────────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
