# Why APK is Only Generated in the `app` Module

## 🎯 **Key Difference: Application vs Library Modules**

### **Two Types of Android Modules:**

1. **Application Module** → Generates **APK** (installable app)
2. **Library Module** → Generates **AAR** (reusable library)

---

## 📦 **Your Project Structure:**

```
app/                          ← Project root
│
├── app/                      ← APPLICATION MODULE
│   ├── build.gradle.kts
│   │   └── plugin: android.application  ← This makes it an app!
│   │
│   └── build/outputs/apk/
│       └── debug/
│           └── app-debug.apk  ← APK GENERATED HERE ✅
│
├── core/common/              ← LIBRARY MODULE
│   ├── build.gradle.kts
│   │   └── plugin: android.library  ← This makes it a library!
│   │
│   └── build/outputs/aar/
│       └── common-debug.aar  ← AAR generated here
│
├── core/ui/                  ← LIBRARY MODULE
│   ├── build.gradle.kts
│   │   └── plugin: android.library
│   │
│   └── build/outputs/aar/
│       └── ui-debug.aar      ← AAR generated here
│
└── feature/auth/             ← LIBRARY MODULE
    ├── build.gradle.kts
    │   └── plugin: android.library
    │
    └── build/outputs/aar/
        └── auth-debug.aar    ← AAR generated here
```

---

## 🔍 **The Difference in Code:**

### **App Module** (`app/build.gradle.kts`):
```kotlin
plugins {
    alias(libs.plugins.android.application)  ← APPLICATION plugin
    // ...
}

android {
    applicationId = "com.v8idcloud"  ← Has applicationId
    // ...
}
```

**Result:** Generates **APK** file (installable app)

---

### **Library Modules** (`core/ui/build.gradle.kts`):
```kotlin
plugins {
    alias(libs.plugins.android.library)  ← LIBRARY plugin
    // ...
}

android {
    // No applicationId  ← Libraries don't have app ID
    // ...
}
```

**Result:** Generates **AAR** file (reusable library)

---

## 🎯 **Why Only One APK?**

### **1. Only One Application Module**

**In your project:**
- ✅ **1 Application module** → `app/` → Generates APK
- ✅ **5 Library modules** → `core/*`, `feature/*` → Generate AARs

**Android rule:** Only application modules can generate APK files.

---

### **2. How It Works:**

```
Build Process:
  ↓
1. Library modules build first:
   ├── core/common → common.aar
   ├── core/ui → ui.aar
   └── feature/auth → auth.aar
  ↓
2. App module builds last:
   ├── Takes all AARs
   ├── Merges everything
   ├── Adds AndroidManifest.xml
   ├── Packages resources
   └── Creates app-debug.apk  ← FINAL APK
  ↓
3. APK installed on device
```

---

## 📁 **What Gets Generated Where:**

### **Library Modules** (core/*, feature/*):
```
core/ui/build/
├── outputs/
│   └── aar/
│       └── ui-debug.aar      ← Library file (not installable)
└── intermediates/
    └── ...                   ← Build artifacts
```

**AAR = Android Archive** (library, not installable)

---

### **App Module** (app/):
```
app/build/
├── outputs/
│   └── apk/
│       └── debug/
│           └── app-debug.apk  ← Installable app ✅
└── intermediates/
    └── ...                    ← Build artifacts
```

**APK = Android Package** (installable app)

---

## 💡 **Why This Design?**

### **1. Separation of Concerns:**

- **Libraries** = Reusable code (can't run alone)
- **App** = Executable application (can run on device)

### **2. Reusability:**

```
core/ui builds → ui.aar
  ↓
Can be used in:
  - This app (app module)
  - Another app
  - Published to Maven
```

### **3. Single Entry Point:**

- Only **one** app can be installed at a time
- The `app` module is the **main application**
- Other modules are **supporting libraries**

---

## 🎯 **Summary:**

**Why APK is only in `app/app/build/`:**

1. ✅ **Only `app` module uses `android.application` plugin**
2. ✅ **Only application modules generate APK**
3. ✅ **Other modules are libraries (generate AAR)**
4. ✅ **App module combines all libraries into one APK**
5. ✅ **This is standard Android architecture**

---

## 🔍 **Check Your Build Files:**

**App module:**
```kotlin
// app/build.gradle.kts
plugins {
    alias(libs.plugins.android.application)  ← APPLICATION
}
```

**Library modules:**
```kotlin
// core/ui/build.gradle.kts
plugins {
    alias(libs.plugins.android.library)  ← LIBRARY
}
```

**This is why only `app` generates APK!**

---

**Bottom line: Only the application module (`app/`) generates an APK because it's the only module with the `android.application` plugin. Other modules are libraries that generate AAR files, which get merged into the final APK.** 🎯
