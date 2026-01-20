package com.v8idcloud.core.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Bottom Navigation Bar
 * Matches Dropbox-style design with black capsule background
 * Made transparent and floating to blend with screen background
 */
@Composable
fun V8idBottomNavigationBar(
    currentRoute: String,
    onTabSelected: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    // Fully transparent outer container
    Box(
        modifier = modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(start = 16.dp, end = 16.dp, bottom = 16.dp),
        contentAlignment = Alignment.BottomCenter
    ) {
        // Glassmorphic floating capsule
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(64.dp),
            color = Color.White.copy(alpha = 0.15f), // Glassmorphic transparent white
            shape = RoundedCornerShape(32.dp),
            shadowElevation = 8.dp,
            tonalElevation = 0.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 12.dp),
                horizontalArrangement = Arrangement.SpaceEvenly,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Home
                NavIcon(
                    icon = Icons.Outlined.Home,
                    isSelected = currentRoute == "home",
                    onClick = { onTabSelected("home") }
                )

                // Folders
                NavIcon(
                    icon = Icons.Outlined.Folder,
                    isSelected = currentRoute == "folders",
                    onClick = { onTabSelected("folders") }
                )

                // Add button (FAB)
                Surface(
                    modifier = Modifier
                        .size(48.dp)
                        .clickable { /* Add action */ },
                    shape = CircleShape,
                    color = Color(0xFF4285F4), // Material Blue
                    shadowElevation = 4.dp
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            imageVector = Icons.Outlined.Add,
                            contentDescription = "Add",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                }

                // Messages/Vault
                NavIcon(
                    icon = Icons.Outlined.Lock,
                    isSelected = currentRoute == "vault",
                    onClick = { onTabSelected("vault") }
                )

                // Profile
                NavIcon(
                    icon = Icons.Outlined.Person,
                    isSelected = currentRoute == "user",
                    onClick = { onTabSelected("user") }
                )
            }
        }
    }
}

@Composable
private fun NavIcon(
    icon: ImageVector,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = if (isSelected) {
        Color.White.copy(alpha = 0.25f)
    } else {
        Color.Transparent
    }

    val iconColor = if (isSelected) {
        Color.White
    } else {
        Color.White.copy(alpha = 0.6f)
    }

    Surface(
        modifier = Modifier
            .size(42.dp)
            .clickable(onClick = onClick),
        shape = CircleShape,
        color = backgroundColor
    ) {
        Box(
            contentAlignment = Alignment.Center,
            modifier = Modifier.fillMaxSize()
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = iconColor,
                modifier = Modifier.size(22.dp)
            )
        }
    }
}
