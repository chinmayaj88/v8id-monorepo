Color Palette Applied (from your background):
Primary Colors:

#7C3AED & #8B5CF6 - Vibrant purple (main accent, buttons, icons)
#6366F1 - Indigo (links, secondary text)
#4C1D95 - Deep purple (labels, primary text)
#1E1B4B - Dark navy (headings)

Light Variants:

#A78BFA - Light purple (placeholders)
#DDD6FE - Very light purple (borders, disabled states)
#FAF5FF - Subtle purple tint (input backgrounds)



.\gradlew assembleDebug
.\gradlew assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk

adb logcat -c && adb logcat -v time

## 🔧 Configuring API Base URL for Physical Device

**Problem**: App shows "communication to IP not permitted" or uses emulator IP instead of your PC's IP.

**Solution**: Set `BASE_URL` in `local.properties` file.

### Step 1: Find Your PC's IP Address

**Windows (PowerShell):**
```powershell
# Get your Wi-Fi/Ethernet IP address
ipconfig | Select-String -Pattern "IPv4" -Context 0,1

# Or more specific:
Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.InterfaceAlias -like "*Wi-Fi*" -or $_.InterfaceAlias -like "*Ethernet*"} | Select-Object IPAddress, InterfaceAlias
```

**Windows (Command Prompt):**
```cmd
ipconfig
# Look for "IPv4 Address" under your Wi-Fi or Ethernet adapter
```

### Step 2: Create/Update local.properties

Create or edit `app/local.properties` file:

```properties
# Your PC's local IP address (from Step 1)
BASE_URL=http://YOUR_PC_IP:4000/api/

# Example:
# BASE_URL=http://192.168.1.100:4000/api/
# BASE_URL=http://172.29.87.213:4000/api/
```

**Important Notes:**
- Use your **PC's local IP** (not `127.0.0.1` or `localhost`)
- Use your **Wi-Fi/Ethernet adapter IP** (not Docker/virtual network IPs like `172.31.0.1`)
- Include the port `:4000` and trailing `/api/`
- For **Android Emulator**: Use `BASE_URL=http://10.0.2.2:4000/api/` (special emulator IP)

### Step 3: Rebuild the App

**After changing local.properties, you MUST rebuild:**

```powershell
# Clean and rebuild
.\gradlew clean assembleDebug

# Or just rebuild
.\gradlew assembleDebug
```

### Step 4: Verify Backend is Accessible

Make sure your backend server is running and accessible:

```powershell
# Test from your PC (should work)
curl http://YOUR_PC_IP:4000/health

# Or in browser:
# http://YOUR_PC_IP:4000/health
```

### Troubleshooting

**Still seeing emulator IP?**
1. Make sure `local.properties` is in `app/` directory (not root)
2. Rebuild the app: `.\gradlew clean assembleDebug`
3. Check `local.properties` format: `BASE_URL=http://IP:4000/api/` (no quotes)

**"Connection refused" or "Network error"?**
1. Check Windows Firewall allows port 4000
2. Verify backend is running: `curl http://localhost:4000/health`
3. Make sure PC and phone are on same Wi-Fi network
4. Try disabling VPN if active

**Wrong IP address?**
- Don't use `127.0.0.1` or `localhost` (these only work on the PC itself)
- Don't use Docker/virtual network IPs (like `172.31.0.1`)
- Use the actual Wi-Fi/Ethernet adapter IPv4 address

# Android Build & Run Guide - Without Android Studio

This guide shows you how to build, install, and run your V8id Cloud Android app using command-line tools only. No Android Studio required!

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Setup Instructions](#setup-instructions)
- [Build Commands](#build-commands)
- [Install & Run Commands](#install--run-commands)
- [Running on Physical Device](#running-on-physical-device)
- [Clean Commands](#clean-commands)
- [Useful Commands](#useful-commands)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

1. **Android SDK** - Installed (usually at `C:\Users\<YourUser>\AppData\Local\Android\Sdk`)
2. **ADB (Android Debug Bridge)** - Part of Android SDK
3. **Java Development Kit (JDK)** - Version 11 or higher
4. **Gradle** - Included in project (via Gradle Wrapper)

---

## Setup Instructions

### 1. Add Android SDK to PATH (Windows)

**Option A: Temporary (Current Session Only)**
```powershell
# Open PowerShell and run:
$env:Path += ";C:\Users\<YourUser>\AppData\Local\Android\Sdk\platform-tools"
$env:Path += ";C:\Users\<YourUser>\AppData\Local\Android\Sdk\tools"
$env:Path += ";C:\Users\<YourUser>\AppData\Local\Android\Sdk\cmdline-tools\latest\bin"
```

**Option B: Permanent (Recommended)**
1. Press `Win + X` and select "System"
2. Click "Advanced system settings"
3. Click "Environment Variables"
4. Under "System variables", find and select "Path", then click "Edit"
5. Click "New" and add these paths (replace `<YourUser>` with your username):
   - `C:\Users\<YourUser>\AppData\Local\Android\Sdk\platform-tools`
   - `C:\Users\<YourUser>\AppData\Local\Android\Sdk\tools`
   - `C:\Users\<YourUser>\AppData\Local\Android\Sdk\cmdline-tools\latest\bin`
6. Click "OK" on all dialogs
7. **Restart your terminal/IDE** for changes to take effect

### 2. Verify Setup

```powershell
# Check if ADB is accessible
adb version

# Check if Gradle is working
./gradlew --version

# Check Java version
java -version
```

---

## Build Commands

### Basic Build Commands

```bash
# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Build both debug and release
./gradlew assemble

# Build and install debug APK in one command
./gradlew installDebug

# Build and install release APK
./gradlew installRelease
```

### Build Specific Modules

```bash
# Build only the auth feature module
./gradlew :feature:auth:assembleDebug

# Build only core modules
./gradlew :core:common:assembleDebug
./gradlew :core:ui:assembleDebug
./gradlew :core:data:assembleDebug
./gradlew :core:domain:assembleDebug
```

### Build with Options

```bash
# Build with verbose output
./gradlew assembleDebug --info

# Build with stack trace on errors
./gradlew assembleDebug --stacktrace

# Build without daemon (useful for CI/CD)
./gradlew assembleDebug --no-daemon

# Build and skip tests
./gradlew assembleDebug -x test
```

### APK Location

After building, your APK will be located at:
- **Debug APK**: `app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `app/build/outputs/apk/release/app-release.apk`

---

## Install & Run Commands

### Install APK on Device/Emulator

```bash
# Install debug APK (replaces existing if installed)
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Install release APK
adb install -r app/build/outputs/apk/release/app-release.apk

# Install without replacing (fails if already installed)
adb install app/build/outputs/apk/debug/app-debug.apk

# Install and grant runtime permissions automatically
adb install -r -g app/build/outputs/apk/debug/app-debug.apk
```

### Launch the App

```bash
# Launch the app (package: com.v8idcloud, activity: com.v8idcloud.MainActivity)
adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity

# Launch with specific action
adb shell am start -a android.intent.action.MAIN -n com.v8idcloud/com.v8idcloud.MainActivity

# Launch and clear app data first
adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity --ez clear true
```

### Build, Install & Run in One Command

```bash
# Build, install, and launch debug version
./gradlew installDebug && adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity

# For PowerShell (use && or separate commands)
./gradlew installDebug; if ($?) { adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity }
```

### Stop the App

```bash
# Force stop the app
adb shell am force-stop com.v8idcloud

# Clear app data and cache
adb shell pm clear com.v8idcloud
```

---

## Running on Physical Device

### Step 1: Enable Developer Options on Your Android Device

1. Open **Settings** on your Android device
2. Go to **About phone** (or **About device**)
3. Find **Build number** and tap it **7 times**
4. You'll see a message: "You are now a developer!"

### Step 2: Enable USB Debugging

1. Go back to **Settings**
2. Find **Developer options** (usually under System or Advanced)
3. Enable **USB debugging**
4. (Optional) Enable **Stay awake** (keeps screen on while charging)
5. (Optional) Enable **USB debugging (Security settings)** if available

### Step 3: Connect Your Device

1. Connect your Android device to your computer via USB cable
2. On your device, you'll see a popup: **"Allow USB debugging?"**
3. Check **"Always allow from this computer"** (optional but recommended)
4. Tap **"Allow"**

### Step 4: Verify Connection

```bash
# List all connected devices
adb devices

# Expected output:
# List of devices attached
# ABC123XYZ    device
```

If you see `unauthorized`, check your device and accept the USB debugging prompt.

### Step 5: Build and Install

```bash
# Build and install the app
./gradlew installDebug

# Or manually install
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Step 6: Launch the App

```bash
# Launch the app
adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity
```

The app should now launch on your physical device!

### Wireless Debugging (Android 11+)

If you prefer wireless connection:

```bash
# On your device: Settings > Developer options > Wireless debugging
# Note the IP address and port shown

# Connect via ADB
adb connect <device-ip>:<port>

# Verify connection
adb devices

# Now you can use all ADB commands wirelessly!
```

---

## Clean Commands

### Clean Build Artifacts

```bash
# Clean all build outputs
./gradlew clean

# Clean specific module
./gradlew :feature:auth:clean
./gradlew :app:clean

# Clean and rebuild
./gradlew clean assembleDebug

# Clean everything including Gradle cache (use with caution)
./gradlew clean --refresh-dependencies
```

### Remove Build Directories Manually

```bash
# Windows PowerShell - Remove build directories
Remove-Item -Path "app\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "feature\auth\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "core\*\build" -Recurse -Force -ErrorAction SilentlyContinue

# Or use Gradle clean
./gradlew clean
```

### Clean Gradle Cache

```bash
# Clean Gradle cache (removes downloaded dependencies)
./gradlew cleanBuildCache

# Clean user's Gradle cache (global)
# Location: C:\Users\<YourUser>\.gradle\caches
# Delete manually or use:
Remove-Item -Path "$env:USERPROFILE\.gradle\caches" -Recurse -Force
```

---

## Useful Commands

### Device Management

```bash
# List connected devices
adb devices

# List all installed packages
adb shell pm list packages

# Check if app is installed
adb shell pm list packages | grep v8idcloud

# Get device info
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release

# Reboot device
adb reboot

# Take screenshot
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### Logs and Debugging (Native Android Logging)

**📱 Using Android Log Class**

Use Android's built-in `Log` class in your code:

```kotlin
import android.util.Log

class MyViewModel : ViewModel() {
    companion object {
        private const val TAG = "MyViewModel"  // Tag for filtering logs
    }
    
    fun doSomething() {
        Log.d(TAG, "Debug message")           // Debug (most common)
        Log.i(TAG, "Info message")            // Info
        Log.w(TAG, "Warning message")        // Warning
        Log.e(TAG, "Error message", exception) // Error (with exception)
        Log.v(TAG, "Verbose message")         // Verbose (detailed)
    }
}
```

**Log Levels:**
- `Log.d()` - Debug (for development debugging)
- `Log.i()` - Info (for informational messages)
- `Log.w()` - Warning (for warnings)
- `Log.e()` - Error (for errors, can include exception)
- `Log.v()` - Verbose (for very detailed debugging)

**🖥️ Viewing Logs in Terminal**

**⚠️ Why logs keep coming even when you're not using the app:**

When you run `adb logcat`, it shows **ALL logs from the entire device** - system services, other apps, background processes, etc. That's why logs keep appearing even when you're not doing anything. The device is always running!

**✅ Solution: Filter to only YOUR app's logs:**

**For PowerShell (Windows):**
```powershell
# Filter by your app's package name (RECOMMENDED - only shows your app)
adb logcat | Select-String "com.v8idcloud"

# Filter by your app's package name with timestamps
adb logcat -v time | Select-String "com.v8idcloud"

# Filter by specific tags from your app (replace TAG with your tag)
adb logcat -s LoginViewModel:D LoginViewModel:E LoginViewModel:W LoginViewModel:I

# Example: View all your ViewModel logs
adb logcat -s LoginViewModel:D TotpViewModel:D HomeViewModel:D

# View only errors from your app
adb logcat -s LoginViewModel:E TotpViewModel:E HomeViewModel:E

# Clear buffer first, then show only your app (best for clean start)
adb logcat -c; adb logcat -v time | Select-String "com.v8idcloud"
```

**For Bash/Linux/Mac:**
```bash
# Filter by your app's package name (RECOMMENDED - only shows your app)
adb logcat | grep com.v8idcloud

# Filter by your app's package name with timestamps
adb logcat -v time | grep com.v8idcloud

# Clear buffer first, then show only your app (best for clean start)
adb logcat -c && adb logcat -v time | grep com.v8idcloud
```

**📋 All Log Commands:**

**For PowerShell (Windows):**
```powershell
# View all logs with timestamps (shows EVERYTHING - system + all apps)
adb logcat -v time

# View all logs from your app package only
adb logcat | Select-String "com.v8idcloud"

# View logs filtered by tag (replace TAG with your tag name)
adb logcat -s TAG:D TAG:E TAG:W TAG:I

# Clear log buffer and start fresh
adb logcat -c; adb logcat -v time

# Save logs to file
adb logcat -v time > app_logs.txt

# View logs filtered by log level (all apps)
adb logcat *:E    # Only errors
adb logcat *:W    # Warnings and above
adb logcat *:I    # Info and above
adb logcat *:D    # Debug and above
```

**For Bash/Linux/Mac:**
```bash
# View all logs with timestamps (shows EVERYTHING - system + all apps)
adb logcat -v time

# View all logs from your app package only
adb logcat | grep com.v8idcloud

# Clear log buffer and start fresh
adb logcat -c && adb logcat -v time
```

**🎯 Quick Commands (Filtered to Your App Only)**

**For PowerShell (Windows):**
```powershell
# BEST: Only your app's logs with timestamps (no system spam!)
adb logcat -v time | Select-String "com.v8idcloud"

# Only errors from your app
adb logcat | Select-String "com.v8idcloud" | Select-String " E "

# Filter by your app's ViewModel tags
adb logcat -s LoginViewModel:D LoginViewModel:E TotpViewModel:D HomeViewModel:D

# Clear buffer and show only your app (clean start)
adb logcat -c; adb logcat -v time | Select-String "com.v8idcloud"

# View all system logs (if you need to see everything)
adb logcat -v time
```

**For Bash/Linux/Mac:**
```bash
# BEST: Only your app's logs with timestamps (no system spam!)
adb logcat -v time | grep com.v8idcloud

# Only errors from your app
adb logcat | grep com.v8idcloud | grep " E "

# Clear buffer and show only your app (clean start)
adb logcat -c && adb logcat -v time | grep com.v8idcloud
```

**💡 Tips:**

1. **Use consistent tags**: Use class name as TAG (e.g., `LoginViewModel`)
2. **Use appropriate log levels**: 
   - `Log.d()` for debugging during development
   - `Log.e()` for errors that need attention
   - `Log.i()` for important events (login, logout, etc.)
3. **Include context**: Log relevant variables and state
4. **Filter in terminal**: Use `-s TAG:LEVEL` to filter specific tags
5. **Use timestamps**: Always use `-v time` to see when logs occurred

### App Management

```bash
# Uninstall the app
adb uninstall com.v8idcloud

# Uninstall with data
adb uninstall com.v8idcloud --user 0

# Get app info
adb shell dumpsys package com.v8idcloud

# List app activities
adb shell dumpsys package com.v8idcloud | grep Activity

# Grant permissions
adb shell pm grant com.v8idcloud android.permission.INTERNET
```

### File Operations

```bash
# Push file to device
adb push local_file.txt /sdcard/

# Pull file from device
adb pull /sdcard/file.txt ./

# List files on device
adb shell ls /sdcard/

# Open device shell
adb shell
```

### Gradle Commands

```bash
# Check Gradle version
./gradlew --version

# Show all available tasks
./gradlew tasks

# Show tasks for specific module
./gradlew :app:tasks

# Run tests
./gradlew test

# Run instrumented tests
./gradlew connectedAndroidTest

# Generate dependency report
./gradlew dependencies > dependencies.txt

# Stop Gradle daemon
./gradlew --stop
```

---

## Troubleshooting

### ADB Not Found

**Problem**: `adb: command not found` or `'adb' is not recognized`

**Solution**:
1. Verify Android SDK is installed
2. Add SDK paths to environment variables (see [Setup Instructions](#setup-instructions))
3. Restart terminal/IDE
4. Verify with: `adb version`

### Device Not Detected

**Problem**: `adb devices` shows no devices

**Solutions**:
1. Check USB cable (use data cable, not charging-only)
2. Enable USB debugging on device
3. Accept USB debugging prompt on device
4. Try different USB port
5. Install device drivers (if needed)
6. Restart ADB server:
   ```bash
   adb kill-server
   adb start-server
   adb devices
   ```

### Build Fails

**Problem**: Build errors or failures

**Solutions**:
```bash
# Clean and rebuild
./gradlew clean assembleDebug

# Check for dependency issues
./gradlew dependencies

# Stop Gradle daemon and retry
./gradlew --stop
./gradlew assembleDebug

# Check Java version (should be 11+)
java -version
```

### File Lock Errors (Windows)

**Problem**: `Unable to delete directory` or `Failed to delete some children` errors during clean/build

This happens when files are locked by Gradle daemon or other processes.

**Solutions**:

**PowerShell (Windows):**
```powershell
# Solution 1: Stop Gradle daemon first, then clean
.\gradlew --stop
.\gradlew clean assembleDebug

# Solution 2: If that doesn't work, skip clean and just rebuild
.\gradlew assembleDebug

# Solution 3: Force kill any Java/Gradle processes (if needed)
Get-Process | Where-Object {$_.ProcessName -like "*java*" -or $_.ProcessName -like "*gradle*"} | Stop-Process -Force

# Solution 4: Manually delete build directories (if safe)
Remove-Item -Path "core\*\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "feature\*\build" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item -Path "app\build" -Recurse -Force -ErrorAction SilentlyContinue
.\gradlew assembleDebug
```

**Quick Fix (Recommended):**
```powershell
# Just skip clean and rebuild directly
.\gradlew assembleDebug
```

**Note**: The `clean` task is optional. You can build without cleaning if files are locked.

### Installation Fails

**Problem**: `adb install` fails

**Solutions**:
```bash
# Uninstall existing app first
adb uninstall com.v8idcloud

# Try installing again
adb install -r app/build/outputs/apk/debug/app-debug.apk

# Check if device has enough storage
adb shell df /data

# Grant install permissions
adb shell pm grant com.v8idcloud android.permission.INSTALL_PACKAGES
```

### App Crashes on Launch

**Problem**: App installs but crashes immediately

**Solutions**:
```bash
# Check logs for errors
# PowerShell:
adb logcat | Select-String -Pattern "v8idcloud|androidruntime|fatal" -CaseSensitive:$false
# Bash/Linux/Mac:
adb logcat | grep -i "v8idcloud\|androidruntime\|fatal"

# Clear app data and try again
adb shell pm clear com.v8idcloud
adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity

# Rebuild and reinstall
./gradlew clean assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Permission Issues

**Problem**: App doesn't have required permissions

**Solutions**:
```bash
# Grant all permissions manually
adb shell pm grant com.v8idcloud android.permission.INTERNET
adb shell pm grant com.v8idcloud android.permission.ACCESS_NETWORK_STATE

# Or install with -g flag (auto-grant)
adb install -r -g app/build/outputs/apk/debug/app-debug.apk
```

### Gradle Daemon Issues

**Problem**: Gradle daemon problems or hangs

**Solutions**:
```bash
# Stop all daemons
./gradlew --stop

# Check daemon status
./gradlew --status

# Run without daemon
./gradlew assembleDebug --no-daemon
```

---

## Quick Reference - Common Workflows

### Daily Development Workflow

```bash
# 1. Connect device
adb devices

# 2. Build, install, and run
./gradlew installDebug && adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity

# 3. View logs in another terminal
# PowerShell:
adb logcat | Select-String "com.v8idcloud"
# Bash/Linux/Mac:
adb logcat | grep com.v8idcloud
```

### Clean Rebuild Workflow

```bash
# Clean everything and rebuild
./gradlew clean assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity
```

### Testing Workflow

```bash
# Build and run tests
./gradlew test
./gradlew connectedAndroidTest

# Install and launch
./gradlew installDebug
adb shell am start -n com.v8idcloud/com.v8idcloud.MainActivity
```

---

## App Information

- **Package Name**: `com.v8idcloud`
- **Main Activity**: `com.v8idcloud.MainActivity`
- **Application Class**: `com.v8idcloud.V8idApplication`
- **Min SDK**: 24
- **Target SDK**: 36
- **Build Tool**: Gradle with Kotlin

---

## Additional Resources

- [Android Developer - Command Line Tools](https://developer.android.com/studio/command-line)
- [ADB Documentation](https://developer.android.com/studio/command-line/adb)
- [Gradle User Guide](https://docs.gradle.org/current/userguide/userguide.html)

---

## Notes

- Always ensure your device is connected before running `adb` commands
- Use `-r` flag with `adb install` to replace existing installations
- Keep your Android SDK and build tools updated
- For production releases, use `assembleRelease` and sign the APK properly
- Consider using `./gradlew` (Gradle Wrapper) instead of global `gradle` command

---

**Happy Coding! 🚀**
