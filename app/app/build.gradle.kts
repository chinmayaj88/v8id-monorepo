import java.util.Properties
import java.io.FileInputStream
import java.io.File

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.hilt)
    alias(libs.plugins.kotlin.kapt)
}

// Load local.properties file from project root (standard Android location)
// In standard Android projects, local.properties is at the root where settings.gradle.kts and gradlew are
// rootProject.projectDir points to the root where settings.gradle.kts is located
val localPropertiesFile = File(rootProject.projectDir, "local.properties")
val baseUrl = if (localPropertiesFile.exists()) {
    val properties = Properties()
    FileInputStream(localPropertiesFile).use { properties.load(it) }
    val url = properties.getProperty("BASE_URL") ?: "http://10.0.2.2:4000/api/"
    // Ensure proper format with trailing slash
    url.trim().let { if (it.endsWith("/")) it else "$it/" }
} else {
    "http://10.0.2.2:4000/api/"
}

android {
    namespace = "com.v8idcloud"
    compileSdk {
        version = release(36)
    }

    defaultConfig {
        applicationId = "com.v8idcloud"
        minSdk = 24
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        debug {
            // Backend runs on port 4000, API routes start with /api/
            // BASE_URL can be set in local.properties file
            // For Emulator: BASE_URL=http://10.0.2.2:4000/api/
            // For Physical Device: BASE_URL=http://YOUR_PC_IP:4000/api/
            buildConfigField("String", "BASE_URL", "\"$baseUrl\"")
            buildConfigField("String", "ENVIRONMENT", "\"development\"")
            isDebuggable = true
        }
        release {
            buildConfigField("String", "BASE_URL", "\"https://api.v8idcloud.com/api/\"")
            buildConfigField("String", "ENVIRONMENT", "\"production\"")
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }
    kotlinOptions {
        jvmTarget = "11"
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    // Core modules
    implementation(project(":core:common"))
    implementation(project(":core:domain"))
    implementation(project(":core:data"))
    implementation(project(":core:ui"))
    
    // Feature modules
    implementation(project(":feature:auth"))
    implementation(project(":feature:home"))
    implementation(project(":feature:folders"))
    implementation(project(":feature:user"))
    implementation(project(":feature:vault"))
    
    // Core Android
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.activity.compose)
    
    // Compose
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    
    // Coil
    implementation(libs.coil.compose)
    
    // OkHttp
    implementation(libs.okhttp)
    implementation(libs.okhttp.logging)
    
    // Navigation
    implementation(libs.navigation.compose)
    
    // Hilt
    implementation(libs.hilt.android)
    implementation(libs.hilt.navigation.compose)
    kapt(libs.hilt.compiler)
    
    // Testing
    testImplementation(libs.junit)
    androidTestImplementation(libs.androidx.junit)
    androidTestImplementation(libs.androidx.espresso.core)
    androidTestImplementation(platform(libs.androidx.compose.bom))
    androidTestImplementation(libs.androidx.compose.ui.test.junit4)
    debugImplementation(libs.androidx.compose.ui.tooling)
    debugImplementation(libs.androidx.compose.ui.test.manifest)
}
