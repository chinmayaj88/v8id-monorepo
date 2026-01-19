package com.v8idcloud.feature.home.presentation.ui

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.Orientation
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.draggable
import androidx.compose.foundation.gestures.rememberDraggableState
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.home.presentation.viewmodel.HomeViewModel
import com.v8idcloud.core.ui.R
import kotlin.math.roundToInt

@Composable
fun HomeScreen(
    navController: NavHostController,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val configuration = LocalConfiguration.current
    val screenHeight = configuration.screenHeightDp
    val screenWidth = configuration.screenWidthDp

    // Dynamic Spacing and Size Calculations
    val dynamicVerticalSpacing = (screenHeight / 50).dp.coerceIn(12.dp, 24.dp)
    val dynamicPadding = (screenWidth / 15).dp.coerceIn(16.dp, 32.dp)
    val dynamicIconSize = (screenWidth / 8.5).dp.coerceIn(40.dp, 52.dp)
    val dynamicFolderIconSize = (screenWidth / 7).dp.coerceIn(48.dp, 60.dp)

    val userEmailFlow by viewModel.userEmail.collectAsState()
    val userFirstNameFlow by viewModel.userFirstName.collectAsState()
    val userLastNameFlow by viewModel.userLastName.collectAsState()

    // State for tracking which file card is currently swiped/revealed
    var revealedFileId by remember { mutableStateOf<String?>(null) }

    // Compute user name
    val userEmail = userEmailFlow ?: ""
    val firstName = userFirstNameFlow ?: ""
    val userName = remember(userFirstNameFlow, userLastNameFlow, userEmail) {
        buildString {
            if (!userFirstNameFlow.isNullOrBlank()) append(userFirstNameFlow)
            if (!userLastNameFlow.isNullOrBlank()) {
                if (isNotEmpty()) append(" ")
                append(userLastNameFlow)
            }
        }.takeIf { it.isNotBlank() } ?: userEmail
    }

    // Mock data for cloud storage
    val storageUsed = 37.5f // GB
    val storageTotal = 50f // GB
    val storagePercentage = (storageUsed / storageTotal) * 100f

    val recentFiles = remember {
        listOf(
            FileItem("Passport_Scan.pdf", "2.5 MB", "2 hours ago", Icons.Default.Description),
            FileItem("Family_Photo.jpg", "5.1 MB", "Yesterday", Icons.Default.Image),
            FileItem("Budget_2024.xlsx", "1.2 MB", "3 days ago", Icons.Default.TableChart),
            FileItem("Tutorial_Video.mp4", "250 MB", "1 week ago", Icons.Default.VideoFile),
            FileItem("Project_Notes.txt", "45 KB", "2 weeks ago", Icons.Default.Note)
        )
    }

    val folders = remember {
        listOf(
            FolderData("My Backup", "50.5 GB", Icons.Outlined.Backup, Color(0xFFFF6B6B)),
            FolderData("Videos", "10.5 GB", Icons.Outlined.VideoLibrary, Color(0xFF4ECDC4)),
            FolderData("Projects", "600 MB", Icons.Outlined.Folder, Color(0xFFFFBE0B)),
            FolderData("Photos", "12.5 GB", Icons.Outlined.Photo, Color(0xFF95E1D3))
        )
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(V8idColors.UI.Background)
    ) {
        // Full Screen Background (bg2.jpg)
        Image(
            painter = painterResource(id = R.drawable.bg2),
            contentDescription = "Background",
            contentScale = ContentScale.FillBounds, // Fill bounds to fit perfectly without cropping
            modifier = Modifier.fillMaxSize()
        )

        val statusBarHeight = WindowInsets.statusBars.asPaddingValues().calculateTopPadding()

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = dynamicPadding),
            contentPadding = PaddingValues(
                top = dynamicVerticalSpacing + statusBarHeight,
                bottom = dynamicVerticalSpacing
            ),
            verticalArrangement = Arrangement.spacedBy(dynamicVerticalSpacing)
        ) {
            // Header with Profile and Notification
            item {
                ProfileHeader(
                    userName = firstName.takeIf { it.isNotBlank() } ?: userName,
                    storagePercentage = storagePercentage
                )
            }

            // Main Heading with Gradient
            item {
                GradientHeading()
            }

            // Search Bar
            item {
                SearchBar()
            }

            // Quick Access Card (Purple card with folders distributed evenly)
            item {
                QuickAccessCard(
                    folders = folders,
                    iconSize = dynamicFolderIconSize
                )
            }

            // File Count Chip
            item {
                FileSummaryChip(fileCount = 420, folderCount = 6)
            }

            // Recent Files Section
            item {
                Text(
                    text = "Recent Files",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1A1A1A)
                )
            }

            items(recentFiles, key = { it.name }) { file ->
                RecentFileCard(
                    file = file,
                    iconSize = dynamicIconSize,
                    isRevealed = revealedFileId == file.name,
                    onExpand = { revealedFileId = file.name },
                    onCollapse = { if (revealedFileId == file.name) revealedFileId = null }
                )
            }
        }
    }
}

@Composable
private fun GradientHeading() {
    val gradientColors = listOf(
        V8idColors.Gradient.LightLavender,
        V8idColors.Gradient.VibrantPurple,
        V8idColors.Gradient.RoyalBlue,
        V8idColors.Gradient.DeepNavy
    )

    Text(
        text = buildAnnotatedString {
            append("Save With ")
            withStyle(
                style = SpanStyle(
                    brush = Brush.linearGradient(
                        colors = gradientColors,
                        start = Offset(0f, 0f),
                        end = Offset(800f, 0f)
                    ),
                    fontWeight = FontWeight.Bold
                )
            ) {
                append("V8id")
            }
            append(" Cloud")
        },
        fontSize = 34.sp,
        fontWeight = FontWeight.Bold,
        color = V8idColors.UI.TextPrimary,
        maxLines = 1
    )
}

@Composable
private fun ProfileHeader(userName: String, storagePercentage: Float) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Profile Photo
            Surface(
                modifier = Modifier.size(40.dp),
                shape = CircleShape,
                color = V8idColors.UI.ProfileGreen
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Icon(
                        imageVector = Icons.Default.Person,
                        contentDescription = "Profile",
                        modifier = Modifier.size(24.dp),
                        tint = V8idColors.UI.ProfileGreenDark
                    )
                }
            }

            // User Info
            Column {
                Text(
                    text = "Hi, $userName",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold,
                    color = V8idColors.UI.TextPrimary
                )
                Text(
                    text = "Storage Used: ${String.format("%.0f", storagePercentage)}%",
                    fontSize = 13.sp,
                    color = V8idColors.UI.TextSecondary
                )
            }
        }

        // Notification Icon
        Surface(
            modifier = Modifier.size(40.dp),
            shape = CircleShape,
            color = V8idColors.UI.Surface,
            shadowElevation = 2.dp
        ) {
            IconButton(onClick = { /* Notifications */ }) {
                Icon(
                    imageVector = Icons.Outlined.Notifications,
                    contentDescription = "Notifications",
                    tint = V8idColors.UI.TextPrimary
                )
            }
        }
    }
}

@Composable
private fun SearchBar(
  modifier: Modifier = Modifier,
  hint: String = "Search files",
  onFilterClick: () -> Unit = {}
) {
  var searchQuery by rememberSaveable { mutableStateOf("") }

  Surface(
    modifier = modifier
      .fillMaxWidth()
      .height(44.dp),
    shape = RoundedCornerShape(24.dp),
    color = V8idColors.UI.Surface,
    border = BorderStroke(
      1.dp,
      V8idColors.UI.TextTertiary.copy(alpha = 0.3f)
    ),
    tonalElevation = 0.dp
  ) {
    Row(
      modifier = Modifier
        .fillMaxSize()
        .padding(horizontal = 14.dp),
      verticalAlignment = Alignment.CenterVertically
    ) {

      Icon(
        imageVector = Icons.Outlined.Search,
        contentDescription = null,
        tint = V8idColors.UI.IconTint,
        modifier = Modifier.size(18.dp)
      )

      Spacer(modifier = Modifier.width(8.dp))

      BasicTextField(
        value = searchQuery,
        onValueChange = { searchQuery = it },
        singleLine = true,
        textStyle = TextStyle(
          fontSize = 14.sp,
          color = V8idColors.UI.TextPrimary
        ),
        modifier = Modifier.weight(1f),
        decorationBox = { innerTextField ->
          if (searchQuery.isEmpty()) {
            Text(
              text = hint,
              fontSize = 14.sp,
              color = V8idColors.UI.TextTertiary
            )
          }
          innerTextField()
        }
      )

      if (searchQuery.isNotEmpty()) {
        Icon(
          imageVector = Icons.Outlined.Close,
          contentDescription = "Clear",
          tint = V8idColors.UI.IconTint,
          modifier = Modifier
            .size(18.dp)
            .clickable { searchQuery = "" }
        )

        Spacer(modifier = Modifier.width(8.dp))
      }

      Icon(
        imageVector = Icons.Outlined.Tune,
        contentDescription = "Filter",
        tint = V8idColors.UI.IconTint,
        modifier = Modifier
          .size(18.dp)
          .clickable { onFilterClick() }
      )
    }
  }
}



@Composable
private fun QuickAccessCard(
    folders: List<FolderData>,
    iconSize: Dp
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        color = Color(0xFFD4BDFF),
        shadowElevation = 4.dp
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Recent Files & Folders",
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF1A1A1A)
                )
                Icon(
                    imageVector = Icons.Outlined.Menu,
                    contentDescription = "Menu",
                    tint = Color(0xFF1A1A1A)
                )
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Distributed Row for folders to fill the available width evenly
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                folders.forEach { folder ->
                    FolderIconItem(folder = folder, iconSize = iconSize)
                }
            }
        }
    }
}

@Composable
private fun FolderIconItem(folder: FolderData, iconSize: Dp) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        // Circular Icon Background with dynamic size
        Surface(
            modifier = Modifier.size(iconSize),
            shape = CircleShape,
            color = Color.White
        ) {
            Box(
                contentAlignment = Alignment.Center,
                modifier = Modifier.fillMaxSize()
            ) {
                Icon(
                    imageVector = folder.icon,
                    contentDescription = folder.name,
                    modifier = Modifier.size(iconSize * 0.45f),
                    tint = folder.iconColor
                )
            }
        }

        // Folder Name
        Text(
            text = folder.name,
            fontSize = 13.sp,
            fontWeight = FontWeight.Medium,
            color = Color(0xFF1A1A1A)
        )

        // Folder Size
        Text(
            text = folder.size,
            fontSize = 11.sp,
            color = Color(0xFF666666)
        )
    }
}

@Composable
private fun FileSummaryChip(fileCount: Int, folderCount: Int) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Center
    ) {
        Surface(
            shape = RoundedCornerShape(20.dp),
            color = Color.White,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "$fileCount Files",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1A1A1A)
                )
                Box(
                    modifier = Modifier
                        .size(4.dp)
                        .clip(CircleShape)
                        .background(Color(0xFF999999))
                )
                Text(
                    text = "$folderCount Folder",
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium,
                    color = Color(0xFF1A1A1A)
                )
            }
        }
    }
}

@Composable
private fun RecentFileCard(
    file: FileItem,
    iconSize: Dp,
    isRevealed: Boolean,
    onExpand: () -> Unit,
    onCollapse: () -> Unit
) {
    // Menu width - fixed to ensure it doesn't go "out of view"
    val menuWidth = 160.dp

    // Smooth animation for the swipe offset
    val offset by animateDpAsState(
        targetValue = if (isRevealed) -menuWidth else 0.dp,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioNoBouncy,
            stiffness = Spring.StiffnessLow
        ),
        label = "swipeOffset"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(IntrinsicSize.Min),
        contentAlignment = Alignment.CenterEnd
    ) {
        // Swipe actions background (Revealed buttons)
        Row(
            modifier = Modifier
                .padding(end = 8.dp)
                .width(menuWidth),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            ActionIconButton(icon = Icons.Outlined.Download, color = V8idColors.Purple.VibrantPurple) {
                onCollapse()
                /* Handle download */
            }
            ActionIconButton(icon = Icons.Outlined.Link, color = V8idColors.Purple.Indigo) {
                onCollapse()
                /* Handle link */
            }
            ActionIconButton(icon = Icons.Outlined.Delete, color = V8idColors.Semantic.Error) {
                onCollapse()
                /* Handle delete */
            }
        }

        // Main card content (Foreground)
        Surface(
            modifier = Modifier
                .offset(x = offset)
                .fillMaxWidth()
                .pointerInput(Unit) {
                    detectHorizontalDragGestures { change, dragAmount ->
                        change.consume()
                        if (dragAmount < -15) onExpand() // Swipe left to reveal
                        if (dragAmount > 15) onCollapse() // Swipe right to hide
                    }
                },
            shape = RoundedCornerShape(16.dp),
            color = V8idColors.UI.Surface,
            shadowElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // File Icon
                Surface(
                    modifier = Modifier.size(iconSize),
                    shape = RoundedCornerShape(10.dp),
                    color = V8idColors.UI.SearchBackground
                ) {
                    Box(
                        contentAlignment = Alignment.Center,
                        modifier = Modifier.fillMaxSize()
                    ) {
                        Icon(
                            imageVector = file.icon,
                            contentDescription = file.name,
                            modifier = Modifier.size(iconSize * 0.5f),
                            tint = V8idColors.Purple.VibrantPurple
                        )
                    }
                }

                // File Info
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = file.name,
                        fontSize = 15.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = V8idColors.UI.TextPrimary
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "${file.size} • ${file.timeAgo}",
                        fontSize = 13.sp,
                        color = V8idColors.UI.TextTertiary
                    )
                }

                IconButton(onClick = { /* More options */ }) {
                    Icon(
                        imageVector = Icons.Outlined.MoreVert,
                        contentDescription = "More",
                        tint = V8idColors.UI.IconTint
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionIconButton(icon: ImageVector, color: Color, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        shape = CircleShape,
        color = color,
        modifier = Modifier.size(44.dp)
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = Color.White,
                modifier = Modifier.size(20.dp)
            )
        }
    }
}

// Data Classes
data class FileItem(
    val name: String,
    val size: String,
    val timeAgo: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)

data class FolderData(
    val name: String,
    val size: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val iconColor: Color
)
