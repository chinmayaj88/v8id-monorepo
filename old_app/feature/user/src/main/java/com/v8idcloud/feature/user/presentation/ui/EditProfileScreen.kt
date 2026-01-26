package com.v8idcloud.feature.user.presentation.ui

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Person
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel

@Composable
fun EditProfileScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val firstNameFlow by viewModel.userFirstName.collectAsState()
    val lastNameFlow by viewModel.userLastName.collectAsState()
    val avatarUrlFlow by viewModel.userAvatarUrl.collectAsState()
    
    var firstName by remember(firstNameFlow) { mutableStateOf(firstNameFlow ?: "") }
    var lastName by remember(lastNameFlow) { mutableStateOf(lastNameFlow ?: "") }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    var isSaving by remember { mutableStateOf(false) }
    
    val context = LocalContext.current
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
    }

    val onSave = {
        if (!isSaving && firstName.isNotBlank()) {
            isSaving = true
            viewModel.updateProfile(context, firstName, lastName, selectedImageUri) {
                isSaving = false
                navController.popBackStack()
            }
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp + statusBarHeight),
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
                    text = "Edit Profile",
                    fontSize = 18.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = V8idColors.UI.TextPrimary
                )
                
                // Save button
                Surface(
                    modifier = Modifier.size(44.dp),
                    shape = CircleShape,
                    color = V8idColors.Purple.VibrantPurple.copy(alpha = 0.1f),
                    border = BorderStroke(1.dp, V8idColors.Purple.VibrantPurple.copy(alpha = 0.2f))
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .clickable(enabled = !isSaving) { onSave() },
                        contentAlignment = Alignment.Center
                    ) {
                        if (isSaving) {
                            CircularProgressIndicator(
                                modifier = Modifier.size(20.dp),
                                color = V8idColors.Purple.VibrantPurple,
                                strokeWidth = 2.dp
                            )
                        } else {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Save",
                                tint = V8idColors.Purple.VibrantPurple,
                                modifier = Modifier.size(20.dp)
                            )
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Profile Image Selection with green gradient border (consistent with UserScreen)
            Box(
                modifier = Modifier
                    .size(120.dp)
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                Color(0xFF7CB342), // Light green
                                Color(0xFF558B2F)  // Dark green
                            )
                        ),
                        shape = CircleShape
                    )
                    .padding(4.dp)
                    .clip(CircleShape)
                    .clickable { imagePickerLauncher.launch("image/*") },
                contentAlignment = Alignment.Center
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(V8idColors.UI.Surface),
                    contentAlignment = Alignment.Center
                ) {
                    when {
                        selectedImageUri != null -> {
                            AsyncImage(
                                model = selectedImageUri,
                                contentDescription = "Selected Avatar",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        !avatarUrlFlow.isNullOrBlank() -> {
                            AsyncImage(
                                model = avatarUrlFlow,
                                contentDescription = "Current Avatar",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Crop
                            )
                        }
                        else -> {
                            Icon(
                                Icons.Default.Person,
                                contentDescription = null,
                                modifier = Modifier.size(60.dp),
                                tint = V8idColors.UI.TextTertiary
                            )
                        }
                    }
                    
                    // Camera Overlay
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color.Black.copy(alpha = 0.2f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            Icons.Default.CameraAlt,
                            contentDescription = "Change Photo",
                            tint = Color.White.copy(alpha = 0.9f),
                            modifier = Modifier.size(28.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(40.dp))

            // Edit Fields Section
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Personal Information",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = V8idColors.UI.TextSecondary,
                    modifier = Modifier.padding(start = 4.dp)
                )
                
                OutlinedTextField(
                    value = firstName,
                    onValueChange = { firstName = it },
                    label = { Text("First Name") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = V8idColors.UI.TextPrimary,
                        unfocusedTextColor = V8idColors.UI.TextPrimary,
                        focusedBorderColor = V8idColors.Purple.VibrantPurple,
                        unfocusedBorderColor = V8idColors.UI.TextTertiary.copy(alpha = 0.3f),
                        focusedLabelColor = V8idColors.Purple.VibrantPurple,
                        unfocusedLabelColor = V8idColors.UI.TextTertiary
                    )
                )

                OutlinedTextField(
                    value = lastName,
                    onValueChange = { lastName = it },
                    label = { Text("Last Name") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedTextColor = V8idColors.UI.TextPrimary,
                        unfocusedTextColor = V8idColors.UI.TextPrimary,
                        focusedBorderColor = V8idColors.Purple.VibrantPurple,
                        unfocusedBorderColor = V8idColors.UI.TextTertiary.copy(alpha = 0.3f),
                        focusedLabelColor = V8idColors.Purple.VibrantPurple,
                        unfocusedLabelColor = V8idColors.UI.TextTertiary
                    )
                )
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Large Save Button at the bottom
            Button(
                onClick = onSave,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .padding(bottom = 8.dp),
                enabled = !isSaving && firstName.isNotBlank(),
                shape = RoundedCornerShape(28.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = V8idColors.Purple.VibrantPurple,
                    disabledContainerColor = V8idColors.Purple.VibrantPurple.copy(alpha = 0.5f)
                ),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 2.dp)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                } else {
                    Text("Save Changes", fontSize = 16.sp, fontWeight = FontWeight.Bold)
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
