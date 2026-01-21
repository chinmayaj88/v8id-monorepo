package com.v8idcloud.feature.user.presentation.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.SubcomposeAsyncImage
import coil.compose.SubcomposeAsyncImageContent
import coil.compose.AsyncImagePainter
import coil.ImageLoader
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel

@Composable
fun UserScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel(),
    imageLoader: ImageLoader? = null
) {
    val userEmailFlow by viewModel.userEmail.collectAsState()
    val userFirstNameFlow by viewModel.userFirstName.collectAsState()
    val userLastNameFlow by viewModel.userLastName.collectAsState()
    val userAvatarUrlFlow by viewModel.userAvatarUrl.collectAsState()
    val userStorageQuotaFlow by viewModel.userStorageQuota.collectAsState()
    val userStorageUsedFlow by viewModel.userStorageUsed.collectAsState()
    
    val usedGB = remember(userStorageUsedFlow) {
        val bytes = userStorageUsedFlow?.toLongOrNull() ?: 0L
        bytes.toFloat() / (1024 * 1024 * 1024)
    }

    val totalGB = remember(userStorageQuotaFlow) {
        val bytes = userStorageQuotaFlow?.toLongOrNull() ?: (10L * 1024 * 1024 * 1024) // 10GB default
        bytes.toFloat() / (1024 * 1024 * 1024)
    }
    
    val actualImageLoader = imageLoader ?: coil.compose.LocalImageLoader.current

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
            .background(V8idColors.UI.Background)
    ) {
        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 20.dp),
            contentPadding = PaddingValues(
                top = 16.dp + statusBarHeight,
                bottom = 96.dp
            ),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header with back arrow, title, and edit button
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    // Back button
                    Surface(
                        modifier = Modifier.size(44.dp),
                        shape = CircleShape,
                        color = V8idColors.UI.Surface,
                        border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable { navController.popBackStack() },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.ArrowBack,
                                contentDescription = "Back",
                                tint = V8idColors.UI.TextPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                    
                    // Title
                    Text(
                        text = "Account",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = V8idColors.UI.TextPrimary
                    )
                    
                    // Edit button
                    Surface(
                        modifier = Modifier.size(44.dp),
                        shape = CircleShape,
                        color = V8idColors.UI.Surface,
                        border = BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.2f))
                    ) {
                        Box(
                            modifier = Modifier
                                .fillMaxSize()
                                .clickable { navController.navigate("user/edit") },
                            contentAlignment = Alignment.Center
                        ) {
                            Icon(
                                imageVector = Icons.Outlined.Edit,
                                contentDescription = "Edit Profile",
                                tint = V8idColors.UI.TextPrimary,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            // Profile Card (centered avatar with name below)
            item {
                ProfileCard(
                    userName = userName,
                    userEmail = userEmail,
                    avatarUrl = userAvatarUrlFlow,
                    initials = initials,
                    imageLoader = actualImageLoader
                )
            }

            // Your Plan Card
            item {
                PlanCard(
                    planName = "V8id Cloud Basic",
                    isFree = true,
                    usedGB = usedGB,
                    totalGB = totalGB,
                    onClick = { navController.navigate("user/storage") }
                )
            }

            // Menu Items
            item {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    AccountMenuItem(
                        icon = Icons.Outlined.PhotoCamera,
                        iconColor = Color(0xFF2196F3), // Blue
                        title = "Camera Uploads",
                        subtitle = "Auto-backup your photos",
                        onClick = { /* Navigate */ }
                    )
                    
                    AccountMenuItem(
                        icon = Icons.Outlined.DesktopWindows,
                        iconColor = Color(0xFF2196F3), // Blue
                        title = "Link your desktop",
                        subtitle = "Sync files with your computer",
                        onClick = { /* Navigate */ }
                    )
                    
                    AccountMenuItem(
                        icon = Icons.Outlined.Restore,
                        iconColor = Color(0xFF9C27B0), // Purple
                        title = "Recover deleted files",
                        subtitle = "Restore files from trash",
                        onClick = { /* Navigate */ }
                    )
                    
                    AccountMenuItem(
                        icon = Icons.Outlined.Security,
                        iconColor = V8idColors.Purple.VibrantPurple,
                        title = "Active Sessions",
                        subtitle = "Manage your logged-in devices",
                        onClick = { navController.navigate("user/active-sessions") }
                    )
                    
                    AccountMenuItem(
                        icon = Icons.Outlined.Storage,
                        iconColor = Color(0xFF4CAF50), // Green
                        title = "Storage Details",
                        subtitle = "${"%.1f".format(usedGB)} GB of ${"%.0f".format(totalGB)} GB used",
                        onClick = { navController.navigate("user/storage") }
                    )
                    
                    AccountMenuItem(
                        icon = Icons.Outlined.Lock,
                        iconColor = Color(0xFFFFC107), // Amber
                        title = "Security Settings",
                        subtitle = "Password and 2FA",
                        onClick = { /* Navigate */ }
                    )
                }
            }

            // Logout Button
            item {
                LogoutButton(
                    onClick = {
                        viewModel.logout {
                            navController.navigate("auth/login") {
                                popUpTo(0)
                            }
                        }
                    }
                )
            }
        }
    }
}

@Composable
private fun ProfileCard(
    userName: String,
    userEmail: String,
    avatarUrl: String?,
    initials: String,
    imageLoader: ImageLoader
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        // Avatar with green gradient border
        Box(
            modifier = Modifier
                .size(100.dp)
                .background(
                    brush = Brush.linearGradient(
                        colors = listOf(
                            Color(0xFF7CB342), // Light green
                            Color(0xFF558B2F)  // Dark green
                        )
                    ),
                    shape = CircleShape
                )
                .padding(4.dp), // Border width
            contentAlignment = Alignment.Center
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .clip(CircleShape)
                    .background(V8idColors.UI.Surface),
                contentAlignment = Alignment.Center
            ) {
                if (!avatarUrl.isNullOrBlank()) {
                    SubcomposeAsyncImage(
                        model = avatarUrl,
                        contentDescription = "User Avatar",
                        imageLoader = imageLoader,
                        modifier = Modifier
                            .fillMaxSize()
                            .clip(CircleShape),
                        contentScale = ContentScale.Crop
                    ) {
                        when (painter.state) {
                            is AsyncImagePainter.State.Loading -> {
                                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(24.dp),
                                        color = V8idColors.Purple.VibrantPurple,
                                        strokeWidth = 2.dp
                                    )
                                }
                            }
                            is AsyncImagePainter.State.Error -> {
                                Text(
                                    text = initials,
                                    fontSize = 36.sp,
                                    fontWeight = FontWeight.Bold,
                                    color = V8idColors.Purple.VibrantPurple
                                )
                            }
                            else -> SubcomposeAsyncImageContent()
                        }
                    }
                } else {
                    Text(
                        text = initials,
                        fontSize = 36.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.Purple.VibrantPurple
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // User Name
        Text(
            text = userName,
            fontSize = 22.sp,
            fontWeight = FontWeight.Bold,
            color = V8idColors.UI.TextPrimary
        )

        Spacer(modifier = Modifier.height(4.dp))

        // User Email
        Text(
            text = userEmail,
            fontSize = 14.sp,
            color = V8idColors.UI.TextSecondary
        )
    }
}

@Composable
private fun PlanCard(
    planName: String,
    isFree: Boolean,
    usedGB: Float,
    totalGB: Float,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = V8idColors.UI.Surface,
        shadowElevation = 2.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Purple cloud icon
                Surface(
                    modifier = Modifier.size(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    color = V8idColors.Purple.SubtlePurpleTint
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(
                            imageVector = Icons.Filled.Cloud,
                            contentDescription = null,
                            tint = V8idColors.Purple.VibrantPurple,
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
                
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Your Plan",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextSecondary
                    )
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = planName,
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = V8idColors.UI.TextPrimary
                        )
                        if (isFree) {
                            Surface(
                                shape = RoundedCornerShape(8.dp),
                                color = Color(0xFFE8F5E9) // Light green
                            ) {
                                Text(
                                    text = "Free",
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Medium,
                                    color = Color(0xFF4CAF50), // Green
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }
                    }
                    Text(
                        text = "Manage your plan details here.",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextTertiary
                    )
                }
            }
            
            // Manage Your Plan button
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable(onClick = onClick),
                shape = RoundedCornerShape(12.dp),
                color = V8idColors.UI.SearchBackground
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 14.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Manage Your Plan",
                        fontSize = 15.sp,
                        fontWeight = FontWeight.Medium,
                        color = V8idColors.UI.TextPrimary
                    )
                    
                    Surface(
                        modifier = Modifier.size(32.dp),
                        shape = CircleShape,
                        color = V8idColors.UI.TextPrimary
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.ArrowForward,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.size(18.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun AccountMenuItem(
    icon: ImageVector,
    iconColor: Color,
    title: String,
    subtitle: String,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = iconColor.copy(alpha = 0.08f)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 14.dp),
            horizontalArrangement = Arrangement.spacedBy(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                modifier = Modifier.size(40.dp),
                shape = RoundedCornerShape(10.dp),
                color = iconColor.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(22.dp)
                    )
                }
            }
            
            // Text
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = title,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Medium,
                    color = V8idColors.UI.TextPrimary
                )
                Text(
                    text = subtitle,
                    fontSize = 12.sp,
                    color = V8idColors.UI.TextTertiary
                )
            }
            
            // Arrow
            Icon(
                imageVector = Icons.Default.ArrowForward,
                contentDescription = null,
                tint = V8idColors.UI.TextTertiary,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun LogoutButton(onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = Color(0xFFFCE4EC), // Light red/pink
        border = BorderStroke(1.dp, Color(0xFFE91E63).copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.Logout,
                contentDescription = "Logout",
                tint = Color(0xFFE91E63),
                modifier = Modifier.size(22.dp)
            )
            Text(
                text = "Log Out",
                fontSize = 15.sp,
                fontWeight = FontWeight.SemiBold,
                color = Color(0xFFE91E63)
            )
            Spacer(modifier = Modifier.weight(1f))
        }
    }
}
