package com.v8idcloud.feature.user.presentation.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
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

@OptIn(ExperimentalMaterial3Api::class)
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

    Scaffold(
        topBar = {
            CenterAlignedTopAppBar(
                title = { Text("Active Sessions", color = Color.White, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
                    }
                },
                colors = TopAppBarDefaults.centerAlignedTopAppBarColors(
                    containerColor = Color.Transparent
                )
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        containerColor = V8idColors.DarkBlueBackground
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (activeSessions.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = V8idColors.Purple.VibrantPurple)
                }
            } else {
                LazyColumn(
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                   items(activeSessions) { session ->
                       SessionItem(
                           session = session,
                           isCurrent = (session.id == currentSessionId),
                           onRevoke = { viewModel.revokeSession(session.id) }
                       )
                   }
                   
                   item {
                       Spacer(modifier = Modifier.height(16.dp))
                       Button(
                           onClick = { viewModel.revokeAllSessions() },
                           colors = ButtonDefaults.buttonColors(containerColor = V8idColors.Semantic.Error),
                           modifier = Modifier.fillMaxWidth(),
                           shape = RoundedCornerShape(12.dp)
                       ) {
                           Icon(Icons.Default.Logout, contentDescription = null, modifier = Modifier.size(18.dp))
                           Spacer(modifier = Modifier.width(8.dp))
                           Text("Log Out All Other Devices", color = Color.White)
                       }
                       // Disclaimer
                       Text(
                           text = "Revoking sessions will log out devices immediately.",
                           color = V8idColors.SecondaryText,
                           fontSize = 12.sp,
                           modifier = Modifier.padding(top = 8.dp).align(Alignment.CenterHorizontally)
                       )
                   }
                }
            }
        }
    }
}

@Composable
fun SessionItem(
    session: DeviceSessionDto,
    isCurrent: Boolean,
    onRevoke: () -> Unit
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        color = V8idColors.Purple.SubtlePurpleTint.copy(alpha = 0.05f), // Very subtle
        border = androidx.compose.foundation.BorderStroke(1.dp, V8idColors.Purple.VeryLightPurple.copy(alpha = 0.2f))
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon
            Surface(
                modifier = Modifier.size(48.dp),
                shape = CircleShape,
                color = if (isCurrent) V8idColors.Purple.VibrantPurple else V8idColors.UI.Surface
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = if (session.deviceType == "MOBILE") Icons.Default.Smartphone else Icons.Default.Computer,
                        contentDescription = null,
                        tint = if (isCurrent) Color.White else V8idColors.SecondaryText
                    )
                }
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            // Info
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = session.deviceName,
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                    if (isCurrent) {
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            color = V8idColors.Purple.VibrantPurple.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                "THIS DEVICE",
                                fontSize = 10.sp,
                                fontWeight = FontWeight.Bold,
                                color = V8idColors.Purple.VibrantPurple,
                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                            )
                        }
                    }
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = "${session.ipAddress ?: "Unknown IP"} • ${session.location ?: "Unknown Location"}",
                    color = V8idColors.SecondaryText,
                    fontSize = 12.sp
                )
                
                Text(
                    text = "Last active: ${session.lastActiveAt ?: "Unknown"}",
                    color = V8idColors.SecondaryText,
                    fontSize = 12.sp
                )
            }
            
            // Action
            if (!isCurrent) {
                IconButton(onClick = onRevoke) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Revoke",
                        tint = V8idColors.Semantic.Error
                    )
                }
            }
        }
    }
}
