package com.v8idcloud.feature.user.presentation.ui

import androidx.compose.foundation.Image
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
import androidx.compose.ui.res.painterResource
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
import com.v8idcloud.core.ui.R

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

    // Mock admin status - in real app, fetch from backend/viewmodel
    val isAdmin = false // TODO: Get from backend

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.DarkBlueBackground)
    ) {
        // Background Image (bg2.jpg)
        Image(
            painter = painterResource(id = R.drawable.bg2),
            contentDescription = "Background",
            contentScale = ContentScale.FillBounds,
            modifier = Modifier.fillMaxSize()
        )

        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            contentPadding = PaddingValues(
                top = 24.dp + statusBarHeight,
                bottom = 96.dp // Bottom nav padding
            ),
            verticalArrangement = Arrangement.spacedBy(24.dp)
        ) {
            // Header
            item {
                Text(
                    text = "Account",
                    fontSize = 32.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )
            }

            // Profile Card
            item {
                ProfileCard(
                    userName = userName,
                    userEmail = userEmail,
                    avatarUrl = userAvatarUrlFlow,
                    initials = initials,
                    imageLoader = actualImageLoader,
                    onEditClick = { navController.navigate("user/edit") }
                )
            }

            // Storage Section
            item {
                StorageCard(
                    usedGB = 23.4f,
                    totalGB = 50f,
                    onClick = { /* Navigate to storage details */ }
                )
            }

            // Menu Sections
            item {
                Text(
                    text = "Settings",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = Color.White,
                    modifier = Modifier.padding(top = 8.dp)
                )
            }

            item {
                MenuSection {
                    MenuItem(
                        icon = Icons.Outlined.Security,
                        title = "Active Sessions",
                        subtitle = "Manage your logged-in devices",
                        onClick = { /* Navigate to sessions */ }
                    )
                    
                    MenuItem(
                        icon = Icons.Outlined.Share,
                        title = "File Permissions",
                        subtitle = "Track shared files and folders",
                        onClick = { /* Navigate to permissions */ }
                    )
                    
                    MenuItem(
                        icon = Icons.Outlined.Edit,
                        title = "Edit Profile",
                        subtitle = "Update your account information",
                        onClick = { navController.navigate("user/edit") }
                    )
                    
                    MenuItem(
                        icon = Icons.Outlined.Lock,
                        title = "Security Settings",
                        subtitle = "Password and 2FA",
                        onClick = { /* Navigate to security */ }
                    )
                }
            }

            // Admin Section (conditional)
            if (isAdmin) {
                item {
                    Text(
                        text = "Admin",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = Color.White,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }

                item {
                    MenuSection {
                        MenuItem(
                            icon = Icons.Outlined.PersonAdd,
                            title = "Add Users",
                            subtitle = "Invite new team members",
                            onClick = { /* Navigate to add users */ },
                            iconTint = V8idColors.Purple.VibrantPurple
                        )
                        
                        MenuItem(
                            icon = Icons.Outlined.AccountBox,
                            title = "Manage Users",
                            subtitle = "View and manage all users",
                            onClick = { /* Navigate to manage users */ },
                            iconTint = V8idColors.Purple.VibrantPurple
                        )
                    }
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
    imageLoader: ImageLoader,
    onEditClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onEditClick),
        shape = RoundedCornerShape(24.dp),
        color = V8idColors.DarkBlueSurface,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Avatar with Gradient or AsyncImage
            Box(
                modifier = Modifier
                    .size(70.dp)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                V8idColors.Purple.VibrantPurple,
                                V8idColors.PrimaryBlue
                            )
                        ),
                        shape = CircleShape
                    ),
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
                                        color = Color.White.copy(alpha = 0.5f),
                                        strokeWidth = 2.dp
                                    )
                                }
                            }
                            is AsyncImagePainter.State.Error -> {
                                Icon(
                                    imageVector = Icons.Default.Error,
                                    contentDescription = "Error loading avatar",
                                    tint = Color.White.copy(alpha = 0.5f),
                                    modifier = Modifier.size(32.dp)
                                )
                            }
                            else -> SubcomposeAsyncImageContent()
                        }
                    }
                } else {
                    Text(
                        text = initials,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
            }

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = userName,
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color.White
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = userEmail,
                    fontSize = 14.sp,
                    color = V8idColors.LightGray
                )
            }

            // Edit button
            IconButton(
                onClick = onEditClick,
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        color = V8idColors.Purple.VibrantPurple.copy(alpha = 0.2f),
                        shape = CircleShape
                    )
            ) {
                Icon(
                    imageVector = Icons.Default.Edit,
                    contentDescription = "Edit Profile",
                    tint = V8idColors.Purple.VibrantPurple,
                    modifier = Modifier.size(20.dp)
                )
            }
        }
    }
}

@Composable
private fun StorageCard(usedGB: Float, totalGB: Float, onClick: () -> Unit) {
    val usagePercentage = (usedGB / totalGB).coerceIn(0f, 1f)
    
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(20.dp),
        color = V8idColors.DarkBlueSurface,
        shadowElevation = 6.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Surface(
                        shape = CircleShape,
                        color = V8idColors.PrimaryBlue.copy(alpha = 0.2f),
                        modifier = Modifier.size(48.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Outlined.Storage,
                                contentDescription = "Storage",
                                modifier = Modifier.size(24.dp),
                                tint = V8idColors.PrimaryBlue
                            )
                        }
                    }
                    
                    Column {
                        Text(
                            text = "Storage",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = Color.White
                        )
                        Text(
                            text = "${"%.1f".format(usedGB)} GB of ${"%.0f".format(totalGB)} GB used",
                            fontSize = 13.sp,
                            color = V8idColors.LightGray
                        )
                    }
                }
                
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = "View Details",
                    tint = V8idColors.LightGray,
                    modifier = Modifier.size(20.dp)
                )
            }
            
            // Progress Bar
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(8.dp)
                    .background(Color.White.copy(alpha = 0.1f), RoundedCornerShape(4.dp))
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(usagePercentage)
                        .fillMaxHeight()
                        .background(
                            brush = Brush.horizontalGradient(
                                colors = listOf(
                                    V8idColors.PrimaryBlue,
                                    V8idColors.Purple.VibrantPurple
                                )
                            ),
                            shape = RoundedCornerShape(4.dp)
                        )
                )
            }
        }
    }
}

@Composable
private fun MenuSection(content: @Composable () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = V8idColors.DarkBlueSurface,
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier.fillMaxWidth()
        ) {
            content()
        }
    }
}

@Composable
private fun MenuItem(
    icon: ImageVector,
    title: String,
    subtitle: String,
    onClick: () -> Unit,
    iconTint: Color = Color.White
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 20.dp, vertical = 16.dp),
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            shape = CircleShape,
            color = iconTint.copy(alpha = 0.15f),
            modifier = Modifier.size(44.dp)
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    modifier = Modifier.size(22.dp),
                    tint = iconTint
                )
            }
        }
        
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                fontSize = 15.sp,
                fontWeight = FontWeight.Medium,
                color = Color.White
            )
            Text(
                text = subtitle,
                fontSize = 13.sp,
                color = V8idColors.LightGray
            )
        }
        
        Icon(
            imageVector = Icons.Default.ArrowForward,
            contentDescription = "Navigate",
            tint = V8idColors.LightGray.copy(alpha = 0.5f),
            modifier = Modifier.size(20.dp)
        )
    }
}

@Composable
private fun LogoutButton(onClick: () -> Unit) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = V8idColors.DarkBlueSurface,
        shadowElevation = 6.dp,
        border = androidx.compose.foundation.BorderStroke(2.dp, V8idColors.Semantic.Error)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Outlined.Logout,
                contentDescription = "Logout",
                tint = V8idColors.Semantic.Error,
                modifier = Modifier.size(24.dp)
            )
            Text(
                text = "Log Out",
                fontSize = 16.sp,
                fontWeight = FontWeight.SemiBold,
                color = V8idColors.Semantic.Error
            )
            Spacer(modifier = Modifier.weight(1f))
        }
    }
}
