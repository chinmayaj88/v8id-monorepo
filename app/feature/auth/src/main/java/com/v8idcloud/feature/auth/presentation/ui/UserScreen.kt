package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.R
import com.v8idcloud.feature.auth.presentation.viewmodel.HomeViewModel

@Composable
fun UserScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val userEmailFlow by viewModel.userEmail.collectAsState()
    val userFirstNameFlow by viewModel.userFirstName.collectAsState()
    val userLastNameFlow by viewModel.userLastName.collectAsState()

    val userEmail = userEmailFlow ?: ""
    val userName = remember(userFirstNameFlow, userLastNameFlow, userEmail) {
        buildString {
            if (!userFirstNameFlow.isNullOrBlank()) append(userFirstNameFlow)
            if (!userLastNameFlow.isNullOrBlank()) {
                if (isNotEmpty()) append(" ")
                append(userLastNameFlow)
            }
        }.takeIf { it.isNotBlank() } ?: userEmail
    }

    val initials = remember(userName) {
        userName.split(" ").take(2).joinToString("") { it.take(1).uppercase() }
            .takeIf { it.isNotBlank() } ?: userName.take(1).uppercase()
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.White)
    ) {
        // Background Image
        Image(
            painter = painterResource(id = R.drawable.bg1),
            contentDescription = "Background",
            contentScale = ContentScale.Crop,
            modifier = Modifier
                .fillMaxSize()
                .alpha(0.05f)
        )

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Header
            Text(
                text = "User Profile",
                fontSize = 28.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )

            // Profile Card
            ProfileCard(
                userName = userName,
                userEmail = userEmail,
                initials = initials
            )

            // Account Info Section
            AccountInfoSection()

            // Actions Section
            ActionsSection(navController = navController, viewModel = viewModel)
        }
    }
}

@Composable
private fun ProfileCard(userName: String, userEmail: String, initials: String) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = V8idColors.Purple.SubtlePurpleTint,
        shadowElevation = 8.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Avatar
            Surface(
                modifier = Modifier.size(100.dp),
                shape = CircleShape,
                color = V8idColors.Purple.VibrantPurple,
                shadowElevation = 12.dp
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Text(
                        text = initials,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.White
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            Text(
                text = userName,
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                color = V8idColors.Purple.DarkNavy
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = userEmail,
                fontSize = 14.sp,
                color = V8idColors.Purple.Indigo
            )
        }
    }
}

@Composable
private fun AccountInfoSection() {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Account Information",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            color = V8idColors.Purple.DarkNavy
        )

        InfoItem("Account Type", "Premium", Icons.Default.Star)
        InfoItem("Storage Plan", "50 GB", Icons.Default.Storage)
        InfoItem("Member Since", "January 2024", Icons.Default.CalendarToday)
    }
}

@Composable
private fun InfoItem(label: String, value: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                modifier = Modifier.size(24.dp),
                tint = V8idColors.Purple.VibrantPurple
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = label,
                    fontSize = 13.sp,
                    color = V8idColors.Purple.Indigo
                )
                Text(
                    text = value,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.Purple.DarkNavy
                )
            }
        }
    }
}

@Composable
private fun ActionsSection(navController: NavHostController, viewModel: HomeViewModel) {
    Column(
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Actions",
            fontSize = 18.sp,
            fontWeight = FontWeight.SemiBold,
            color = V8idColors.Purple.DarkNavy
        )

        ActionButton(
            text = "Edit Profile",
            icon = Icons.Default.Edit,
            onClick = { /* Edit profile */ }
        )

        ActionButton(
            text = "Change Password",
            icon = Icons.Default.Lock,
            onClick = { /* Change password */ }
        )

        ActionButton(
            text = "Logout",
            icon = Icons.Default.Logout,
            onClick = {
                viewModel.logout {}
                navController.navigate("auth/login") {
                    popUpTo("auth/login") { inclusive = true }
                }
            },
            isDestructive = true
        )
    }
}

@Composable
private fun ActionButton(
    text: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    onClick: () -> Unit,
    isDestructive: Boolean = false
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        color = if (isDestructive) {
            V8idColors.Semantic.Error.copy(alpha = 0.1f)
        } else {
            Color.White
        },
        shadowElevation = 2.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable(onClick = onClick)
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = icon,
                contentDescription = text,
                modifier = Modifier.size(24.dp),
                tint = if (isDestructive) {
                    V8idColors.Semantic.Error
                } else {
                    V8idColors.Purple.VibrantPurple
                }
            )
            Text(
                text = text,
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = if (isDestructive) {
                    V8idColors.Semantic.Error
                } else {
                    V8idColors.Purple.DarkNavy
                }
            )
        }
    }
}
