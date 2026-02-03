package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.R

@Composable
fun FilesScreen(navController: NavHostController) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Folder,
                contentDescription = "Files",
                modifier = Modifier.size(64.dp),
                tint = V8idColors.Purple.VibrantPurple
            )
            Text(
                text = "Files",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )
            Text(
                text = "Browse all your files and folders",
                fontSize = 14.sp,
                color = V8idColors.Purple.Indigo,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun UploadScreen(navController: NavHostController) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.CloudUpload,
                contentDescription = "Upload",
                modifier = Modifier.size(64.dp),
                tint = V8idColors.Purple.VibrantPurple
            )
            Text(
                text = "Upload",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )
            Text(
                text = "Upload files to your cloud storage",
                fontSize = 14.sp,
                color = V8idColors.Purple.Indigo,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun SettingsScreen(navController: NavHostController) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Settings,
                contentDescription = "Settings",
                modifier = Modifier.size(64.dp),
                tint = V8idColors.Purple.VibrantPurple
            )
            Text(
                text = "Settings",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )
            Text(
                text = "Manage your app settings",
                fontSize = 14.sp,
                color = V8idColors.Purple.Indigo,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun ProfileScreen(navController: NavHostController) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = "Profile",
                modifier = Modifier.size(64.dp),
                tint = V8idColors.Purple.VibrantPurple
            )
            Text(
                text = "Profile",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )
            Text(
                text = "View and edit your profile",
                fontSize = 14.sp,
                color = V8idColors.Purple.Indigo,
                textAlign = TextAlign.Center
            )
        }
    }
}
