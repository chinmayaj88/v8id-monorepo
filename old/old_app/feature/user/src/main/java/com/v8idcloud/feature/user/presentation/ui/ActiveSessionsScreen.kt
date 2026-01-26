package com.v8idcloud.feature.user.presentation.ui

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Computer
import androidx.compose.material.icons.outlined.Smartphone
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel
import com.v8idcloud.core.data.network.DeviceSessionDto

@Composable
fun ActiveSessionsScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val activeSessions by viewModel.activeSessions.collectAsState()
    val sessionMessage by viewModel.sessionMessage.collectAsState()
    val sessionError by viewModel.sessionError.collectAsState()
    var currentSessionId by remember { mutableStateOf<String?>(null) }
    
    // Load data
    LaunchedEffect(Unit) {
        viewModel.loadActiveSessions()
        currentSessionId = viewModel.getCurrentSessionId()
    }
    
    // Simple Toast/Snackbar shim
    val snackbarHostState = remember { SnackbarHostState() }
    LaunchedEffect(sessionMessage) {
        sessionMessage?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSessionMessage()
        }
    }
    LaunchedEffect(sessionError) {
        sessionError?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearSessionError()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()
        
        // Content
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Check if sessions are loaded
            if (activeSessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = V8idColors.Purple.VibrantPurple)
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(horizontal = 20.dp),
                    contentPadding = PaddingValues(
                        top = 16.dp + statusBarHeight,
                        bottom = 32.dp
                    ),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Header
                    item {
                         Row(
                            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
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
                            
                            Spacer(modifier = Modifier.width(16.dp))
                            
                            Text(
                                text = "Active Sessions",
                                fontSize = 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = V8idColors.UI.TextPrimary
                            )
                        }
                    }

                    // Section Title
                    item {
                        Text(
                            text = "Your Devices",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = V8idColors.UI.TextPrimary
                        )
                    }

                    items(activeSessions) { session ->
                       SessionItem(
                           session = session,
                           isCurrent = (session.id == currentSessionId),
                           onRevoke = { viewModel.revokeSession(session.id) }
                       )
                    }
                   
                    item {
                       Spacer(modifier = Modifier.height(24.dp))
                       Button(
                           onClick = { viewModel.revokeAllSessions() },
                           colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFFFEBEE)), // Light red bg
                           modifier = Modifier.fillMaxWidth().height(56.dp),
                           elevation = ButtonDefaults.buttonElevation(0.dp),
                           shape = RoundedCornerShape(28.dp)
                       ) {
                           Icon(
                               Icons.Default.Logout, 
                               contentDescription = null, 
                               modifier = Modifier.size(20.dp),
                               tint = V8idColors.Semantic.Error
                           )
                           Spacer(modifier = Modifier.width(12.dp))
                           Text(
                               "Log Out All Other Devices", 
                               color = V8idColors.Semantic.Error,
                               fontSize = 16.sp,
                               fontWeight = FontWeight.Bold
                           )
                       }
                       // Disclaimer
                       Text(
                           text = "Revoking sessions will log out other devices immediately.",
                           color = V8idColors.UI.TextTertiary,
                           fontSize = 13.sp,
                           modifier = Modifier.padding(top = 12.dp).fillMaxWidth(),
                           textAlign = androidx.compose.ui.text.style.TextAlign.Center
                       )
                    }
                }
            }
        }
        
        // Snackbar
        SnackbarHost(
            hostState = snackbarHostState,
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 32.dp)
        )
    }
}

@Composable
fun SessionItem(
    session: DeviceSessionDto,
    isCurrent: Boolean,
    onRevoke: () -> Unit
) {
    val iconColor = if (isCurrent) V8idColors.Purple.VibrantPurple else V8idColors.UI.TextSecondary
    val bgColor = if (isCurrent) V8idColors.Purple.SubtlePurpleTint else V8idColors.UI.Surface
    
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        color = bgColor,
        border = if (!isCurrent) BorderStroke(1.dp, V8idColors.UI.TextTertiary.copy(alpha = 0.1f)) else null
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                modifier = Modifier.size(48.dp),
                shape = CircleShape,
                color = if (isCurrent) V8idColors.Purple.VibrantPurple.copy(alpha = 0.1f) else V8idColors.UI.SearchBackground
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (session.deviceType == "MOBILE") Icons.Outlined.Smartphone else Icons.Outlined.Computer,
                        contentDescription = null,
                        tint = iconColor,
                        modifier = Modifier.size(24.dp)
                    )
                    
                    if (isCurrent) {
                        Surface(
                            modifier = Modifier.size(12.dp).align(Alignment.BottomEnd).offset(x = (-2).dp, y = (-2).dp),
                            shape = CircleShape,
                            color = Color(0xFF4CAF50), // Green dot
                            border = BorderStroke(2.dp, bgColor)
                        ) {}
                    }
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Info
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = session.deviceName,
                        color = V8idColors.UI.TextPrimary,
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 16.sp
                    )
                    if (isCurrent) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            color = V8idColors.Purple.VibrantPurple.copy(alpha = 0.1f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                "CURRENT",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = V8idColors.Purple.VibrantPurple,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = "${session.ipAddress ?: "Unknown IP"} • ${session.location ?: "Unknown Location"}",
                    color = V8idColors.UI.TextSecondary,
                    fontSize = 13.sp
                )
                
                Text(
                    text = "Last active: ${session.lastActiveAt ?: "Unknown"}",
                    color = V8idColors.UI.TextTertiary,
                    fontSize = 12.sp
                )
            }
            
            // Action
            if (!isCurrent) {
                IconButton(onClick = onRevoke) {
                    Icon(
                        imageVector = Icons.Default.DeleteOutline, // Outline version is cleaner
                        contentDescription = "Revoke",
                        tint = V8idColors.Semantic.Error.copy(alpha = 0.8f)
                    )
                }
            }
        }
    }
}
