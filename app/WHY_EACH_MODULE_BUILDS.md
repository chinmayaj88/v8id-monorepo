.\gradlew.bat assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk

# Why Each Module Has Its Own Build - Explained

## 🏗️ **Multi-Module Architecture**

Your project is a **multi-module Android project**. This means:

```
Project Root (app/)
├── app/              ← Application module (builds APK)
├── core/common/      ← Library module (builds AAR)
├── core/domain/      ← Library module (builds AAR)
├── core/data/        ← Library module (builds AAR)
├── core/ui/          ← Library module (builds AAR)
└── feature/auth/     ← Library module (builds AAR)
```

**Each module is a separate Gradle project** that needs to be compiled independently.

---

## 🔄 **Why Each Module Builds Separately**

### **1. Modular Architecture Benefits**

**Each module is independent:**
- Can be developed separately
- Can be tested separately
- Can be reused in other projects
- Can be versioned independently

**Example:**
```
core/common/ → Builds → common.aar (library)
core/ui/     → Builds → ui.aar (library)
app/         → Uses both → Builds → app.apk
```

---

### **2. Dependency Chain**

**Modules depend on each other:**

```
app/
  └── depends on → feature/auth/
                    └── depends on → core/ui/
                                      └── depends on → core/common/
                                                         └── depends on → core/domain/
```

**Build order:**
1. `core:domain` builds first (no dependencies)
2. `core:common` builds (depends on domain)
3. `core:ui` builds (depends on common)
4. `core:data` builds (depends on common, domain)
5. `feature:auth` builds (depends on core modules)
6. `app` builds last (depends on everything)

**Each must build before the next can use it!**

---

### **3. What Gets Generated for Each Module**

#### **Library Modules** (core/*, feature/*):
```
module/build/
├── intermediates/
│   ├── compile_library_classes_jar/  ← Compiled Kotlin/Java classes
│   ├── bundle_lib_compile_to_jar/     ← JAR file for other modules
│   └── bundle_lib_runtime_to_jar/     ← Runtime JAR
├── outputs/
│   └── aar/                           ← Android Archive (library)
└── generated/                          ← Generated code (R class, etc.)
```

#### **App Module** (app/):
```
app/build/
├── intermediates/                     ← All intermediate files
├── outputs/
│   └── apk/
│       └── debug/
│           └── app-debug.apk         ← Final APK (what you install)
└── generated/                          ← Generated code
```

---

## 🎯 **Why This Design?**

### **1. Incremental Builds**

**Only changed modules rebuild:**

```
You change LoginScreen.kt in feature/auth/
  ↓
Only feature/auth rebuilds
  ↓
Only app rebuilds (depends on auth)
  ↓
core modules don't rebuild (unchanged)
```

**Result:** Faster builds! ⚡

---

### **2. Reusability**

**Library modules can be reused:**

```
core/ui/ builds → ui.aar
  ↓
Can be used in:
  - This app
  - Another app
  - Published to Maven
```

---

### **3. Separation of Concerns**

**Each module has a purpose:**

- `core:common` → Shared utilities
- `core:domain` → Business logic
- `core:data` → Data layer
- `core:ui` → UI components
- `feature:auth` → Authentication feature
- `app` → Main application

**Each builds independently!**

---

### **4. Parallel Building**

**Gradle can build modules in parallel:**

```
core:common ──┐
core:domain ──┼──→ Build in parallel (no dependencies)
core:data ────┘
  ↓
core:ui ──────→ Builds after common
  ↓
feature:auth ─→ Builds after core modules
  ↓
app ──────────→ Builds last (uses all)
```

**Result:** Faster overall build! ⚡⚡

---

## 📦 **What Each Module Produces**

### **Library Modules** (AAR files):

**AAR = Android Archive** (like JAR but for Android)

```
core/common/build/outputs/aar/
  └── common-debug.aar

core/ui/build/outputs/aar/
  └── ui-debug.aar

feature/auth/build/outputs/aar/
  └── auth-debug.aar
```

**Contains:**
- Compiled classes
- Resources (layouts, drawables)
- AndroidManifest.xml
- ProGuard rules

---

### **App Module** (APK file):

**APK = Android Package** (installable app)

```
app/build/outputs/apk/debug/
  └── app-debug.apk
```

**Contains:**
- All compiled code from app + all dependencies
- All resources
- Final AndroidManifest.xml
- Everything needed to run

---

## 🔍 **Build Process Example**

**When you run `gradlew installDebug`:**

```
1. Gradle analyzes dependencies
   ↓
2. Builds core:domain
   ├── Compiles Kotlin files
   ├── Generates R class
   └── Creates domain.aar
   ↓
3. Builds core:common (needs domain)
   ├── Compiles Kotlin files
   ├── Generates R class
   └── Creates common.aar
   ↓
4. Builds core:ui (needs common)
   ├── Compiles Kotlin files
   ├── Processes resources
   ├── Generates R class
   └── Creates ui.aar
   ↓
5. Builds feature:auth (needs core modules)
   ├── Compiles Kotlin files
   ├── Processes resources
   ├── Generates R class
   └── Creates auth.aar
   ↓
6. Builds app (needs everything)
   ├── Merges all AARs
   ├── Compiles app code
   ├── Processes all resources
   ├── Generates final R class
   ├── Packages everything
   └── Creates app-debug.apk
   ↓
7. Installs APK on device
```

**Each step creates build artifacts!**

---

## 💡 **Why Not One Big Build?**

### **Single Module (Bad):**
```
app/
  └── All code in one place
      └── Builds everything every time
          └── Slow! 🐌
```

### **Multi-Module (Good):**
```
app/
  ├── core/common/  → Builds only when changed
  ├── core/ui/     → Builds only when changed
  └── app/         → Builds only when changed
      └── Fast! ⚡
```

---

## 🎯 **Summary**

**Why each module builds:**

1. ✅ **Modular Architecture** - Each module is independent
2. ✅ **Dependency Chain** - Modules depend on each other
3. ✅ **Incremental Builds** - Only changed modules rebuild
4. ✅ **Reusability** - Libraries can be reused
5. ✅ **Parallel Building** - Modules build simultaneously
6. ✅ **Separation** - Clear boundaries between modules

**This is standard Android/Gradle architecture!**

---

## 📁 **Build Folders You See**

```
app/
├── app/build/              ← App module build output
├── core/common/build/      ← Common module build output
├── core/domain/build/      ← Domain module build output
├── core/data/build/        ← Data module build output
├── core/ui/build/          ← UI module build output
└── feature/auth/build/     ← Auth module build output
```

**Each is necessary for the build system to work!**

---

## 🚫 **Can You Avoid This?**

**No! This is how Gradle works:**

- Each module = separate Gradle project
- Each Gradle project = separate build
- This is **by design** and **beneficial**

**You could:**
- Put everything in one module (bad idea - slow, messy)
- Use multi-module (good idea - fast, organized) ✅

---

**Bottom line: Each module builds separately because that's how modular architecture works - and it's a good thing!** 🎉
