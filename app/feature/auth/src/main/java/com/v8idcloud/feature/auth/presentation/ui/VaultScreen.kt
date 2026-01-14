package com.v8idcloud.feature.auth.presentation.ui

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.auth.R

@Composable
fun VaultScreen(navController: NavHostController) {
    // Mock vault items (encrypted/password-protected files)
    val vaultItems = remember {
        listOf(
            VaultItem("Bank Statements", "PDF", "2.3 MB", Icons.Default.Description),
            VaultItem("Passport Copy", "PDF", "1.8 MB", Icons.Default.Badge),
            VaultItem("Tax Documents", "PDF", "3.5 MB", Icons.Default.Receipt),
            VaultItem("Private Notes", "TXT", "0.2 MB", Icons.Default.Note),
            VaultItem("Medical Records", "PDF", "4.1 MB", Icons.Default.MedicalServices)
        )
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

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(20.dp),
            contentPadding = PaddingValues(vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(20.dp)
        ) {
            // Header
            item {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                text = "Secure Vault",
                                fontSize = 28.sp,
                                fontWeight = FontWeight.Bold,
                                color = V8idColors.Purple.DarkNavy
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "Encrypted storage for sensitive files",
                                fontSize = 14.sp,
                                color = V8idColors.Purple.Indigo
                            )
                        }
                        Icon(
                            imageVector = Icons.Default.Lock,
                            contentDescription = "Secure",
                            modifier = Modifier.size(32.dp),
                            tint = V8idColors.Purple.VibrantPurple
                        )
                    }
                }
            }

            // Security Info Card
            item {
                SecurityInfoCard()
            }

            // Vault Items
            item {
                Text(
                    text = "Protected Files",
                    fontSize = 20.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.Purple.DarkNavy
                )
            }

            items(vaultItems) { item ->
                VaultItemCard(item = item)
            }
        }
    }
}

@Composable
private fun SecurityInfoCard() {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = V8idColors.Purple.SubtlePurpleTint,
        shadowElevation = 8.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                modifier = Modifier.size(56.dp),
                shape = RoundedCornerShape(12.dp),
                color = V8idColors.Purple.VibrantPurple
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = Icons.Default.Security,
                        contentDescription = "Security",
                        modifier = Modifier.size(28.dp),
                        tint = V8idColors.White
                    )
                }
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "AES-256 Encrypted",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.Purple.DarkNavy
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "All files are encrypted at rest",
                    fontSize = 13.sp,
                    color = V8idColors.Purple.Indigo
                )
            }
        }
    }
}

@Composable
private fun VaultItemCard(item: VaultItem) {
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
            // File Icon with Lock
            Box {
                Icon(
                    imageVector = item.icon,
                    contentDescription = item.name,
                    modifier = Modifier.size(40.dp),
                    tint = V8idColors.Purple.VibrantPurpleAlt
                )
                Icon(
                    imageVector = Icons.Default.Lock,
                    contentDescription = "Locked",
                    modifier = Modifier
                        .size(16.dp)
                        .offset(x = 24.dp, y = 24.dp),
                    tint = V8idColors.Purple.VibrantPurple
                )
            }

            // File Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.Purple.DarkNavy
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "${item.type} • ${item.size} • Encrypted",
                    fontSize = 12.sp,
                    color = V8idColors.Purple.Indigo
                )
            }

            // More Options
            IconButton(onClick = { /* More options */ }) {
                Icon(
                    imageVector = Icons.Default.MoreVert,
                    contentDescription = "More",
                    tint = V8idColors.Purple.Indigo
                )
            }
        }
    }
}

data class VaultItem(
    val name: String,
    val type: String,
    val size: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)
