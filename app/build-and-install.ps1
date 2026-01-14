# PowerShell script to clean, build, and install APK
# Usage: .\build-and-install.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BUILD AND INSTALL APK" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Step 1: Stop Gradle daemons
Write-Host "1. Stopping Gradle daemons..." -ForegroundColor Yellow
.\gradlew --stop 2>$null
Start-Sleep -Seconds 2

# Step 2: Kill any remaining Java/Gradle processes
Write-Host "`n2. Cleaning up Java processes..." -ForegroundColor Yellow
Get-Process -Name "java" -ErrorAction SilentlyContinue | ForEach-Object {
    try {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    } catch {
        # Ignore errors
    }
}
Start-Sleep -Seconds 2

# Step 3: Delete all build directories
Write-Host "`n3. Deleting build files..." -ForegroundColor Yellow
$buildDirs = @(
    ".gradle",
    "core\ui\build",
    "core\data\build",
    "core\common\build",
    "feature\auth\build",
    "feature\home\build",
    "feature\folders\build",
    "feature\user\build",
    "feature\vault\build",
    "app\build"
)

foreach ($dir in $buildDirs) {
    if (Test-Path $dir) {
        try {
            Remove-Item -Path $dir -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host "   Removed: $dir" -ForegroundColor Gray
        } catch {
            Write-Host "   Could not remove: $dir (may be locked)" -ForegroundColor Yellow
        }
    }
}
Start-Sleep -Seconds 2

# Step 4: Build the project
Write-Host "`n4. Building project..." -ForegroundColor Yellow
Write-Host "   Running: .\gradlew assembleDebug`n" -ForegroundColor Gray

.\gradlew assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[ERROR] Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above.`n" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

Write-Host "`n[SUCCESS] Build completed!" -ForegroundColor Green

# Step 5: Install APK to device
Write-Host "`n5. Installing APK to device..." -ForegroundColor Yellow
$apkPath = "app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "   [ERROR] APK not found at: $apkPath" -ForegroundColor Red
    Write-Host "   Build may have completed but APK was not generated.`n" -ForegroundColor Yellow
    exit 1
}

# Check if ADB is available
$adbCheck = Get-Command adb -ErrorAction SilentlyContinue
if (-not $adbCheck) {
    Write-Host "   [WARNING] ADB not found in PATH." -ForegroundColor Yellow
    Write-Host "   Make sure Android SDK platform-tools are in your PATH" -ForegroundColor Gray
    Write-Host "   APK location: $apkPath" -ForegroundColor Cyan
    Write-Host "   Install manually: adb install -r $apkPath`n" -ForegroundColor Gray
    exit 0
}

# Check for connected devices
Write-Host "   Checking for connected devices..." -ForegroundColor Gray
$devices = adb devices 2>$null
$deviceCount = ($devices | Select-String "device$" | Measure-Object).Count

if ($deviceCount -eq 0) {
    Write-Host "   [WARNING] No Android device/emulator connected." -ForegroundColor Yellow
    Write-Host "   Connect a device or start an emulator, then run:" -ForegroundColor Gray
    Write-Host "   adb install -r $apkPath`n" -ForegroundColor Cyan
    exit 0
}

# Install APK
Write-Host "   Found $deviceCount device(s). Installing APK..." -ForegroundColor Gray
Write-Host "   Running: adb install -r $apkPath`n" -ForegroundColor Gray

adb install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[SUCCESS] APK installed successfully!" -ForegroundColor Green
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  BUILD AND INSTALL COMPLETE!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
} else {
    Write-Host "`n[ERROR] APK installation failed." -ForegroundColor Red
    Write-Host "Try manually: adb install -r $apkPath`n" -ForegroundColor Yellow
    exit $LASTEXITCODE
}

exit 0
