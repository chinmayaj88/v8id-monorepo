package com.v8idcloud.feature.vault.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.core.ui.components.SearchBar

@Composable
fun VaultScreen(navController: NavHostController) {
    // Mock vault items (encrypted/password-protected files)
    val vaultItems = remember {
        listOf(
            VaultItem("Bank Statements", "PDF", "2.3 MB", Icons.Default.Description, Color(0xFFFFC107)),
            VaultItem("Passport Copy", "PDF", "1.8 MB", Icons.Default.Badge, Color(0xFF2196F3)),
            VaultItem("Tax Documents", "PDF", "3.5 MB", Icons.Default.Receipt, Color(0xFFFFC107)),
            VaultItem("Private Notes", "TXT", "0.2 MB", Icons.Default.Note, Color(0xFF4CAF50)),
            VaultItem("Medical Records", "PDF", "4.1 MB", Icons.Default.MedicalServices, Color(0xFFE91E63))
        )
    }

    var searchQuery by remember { mutableStateOf("") }

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
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = "Secure Vault",
                            fontSize = 24.sp,
                            fontWeight = FontWeight.Bold,
                            color = V8idColors.UI.TextPrimary
                        )
                        Text(
                            text = "End-to-end encrypted storage",
                            fontSize = 13.sp,
                            color = V8idColors.UI.TextSecondary
                        )
                    }
                    
                    Surface(
                        modifier = Modifier.size(44.dp),
                        shape = CircleShape,
                        color = V8idColors.Purple.SubtlePurpleTint
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Https,
                                contentDescription = "Secure",
                                modifier = Modifier.size(24.dp),
                                tint = V8idColors.Purple.VibrantPurple
                            )
                        }
                    }
                }
            }

            // Search Bar
            item {
                SearchBar(
                    hint = "Search in vault",
                    searchQuery = searchQuery,
                    onQueryChange = { searchQuery = it },
                    onFilterClick = { /* Filter */ }
                )
            }

            // Security Badge Card
            item {
                Surface(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(20.dp),
                    color = Color(0xFFE8F5E9), // Light green
                    border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFF4CAF50).copy(alpha = 0.2f))
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.VerifiedUser,
                            contentDescription = null,
                            tint = Color(0xFF4CAF50),
                            modifier = Modifier.size(24.dp)
                        )
                        Text(
                            text = "Your files are protected with AES-256 military-grade encryption.",
                            fontSize = 13.sp,
                            color = Color(0xFF2E7D32),
                            lineHeight = 18.sp
                        )
                    }
                }
            }

            // Section Info
            item {
                Row(
                    modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Protected Files",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold,
                        color = V8idColors.UI.TextPrimary
                    )
                    Text(
                        text = "${vaultItems.size} items",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextSecondary
                    )
                }
            }

            // Vault Items
            items(vaultItems) { item ->
                VaultItemCard(item = item)
            }
        }
    }
}

@Composable
private fun VaultItemCard(item: VaultItem) {
    val backgroundTintColor = item.iconColor.copy(alpha = 0.08f)
    
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { /* Open item */ },
        shape = RoundedCornerShape(20.dp),
        color = backgroundTintColor
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                modifier = Modifier.size(48.dp),
                shape = RoundedCornerShape(12.dp),
                color = item.iconColor.copy(alpha = 0.15f)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = null,
                        tint = item.iconColor,
                        modifier = Modifier.size(24.dp)
                    )
                    
                    // Small Lock Badge
                    Surface(
                        modifier = Modifier.size(16.dp).align(Alignment.BottomEnd).offset(x = 4.dp, y = 4.dp),
                        shape = CircleShape,
                        color = V8idColors.UI.Surface,
                        shadowElevation = 2.dp
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Icon(
                                imageVector = Icons.Default.Lock,
                                contentDescription = null,
                                tint = V8idColors.Purple.VibrantPurple,
                                modifier = Modifier.size(10.dp)
                            )
                        }
                    }
                }
            }
            
            // Text
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.name,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.UI.TextPrimary
                )
                Text(
                    text = "${item.type} • ${item.size} • Encrypted",
                    fontSize = 12.sp,
                    color = V8idColors.UI.TextTertiary
                )
            }
            
            // More
            IconButton(onClick = { /* More options */ }) {
                Icon(
                    imageVector = Icons.Default.MoreHoriz,
                    contentDescription = "More",
                    tint = V8idColors.UI.TextTertiary
                )
            }
        }
    }
}

data class VaultItem(
    val name: String,
    val type: String,
    val size: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val iconColor: Color
)
