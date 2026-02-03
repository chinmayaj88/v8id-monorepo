pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "V8idCloud"

// App module
include(":app")

// Core modules
include(":core:common")
include(":core:domain")
include(":core:data")
include(":core:ui")

// Feature modules
include(":feature:auth")
include(":feature:home")
include(":feature:folders")
include(":feature:user")
include(":feature:vault")
