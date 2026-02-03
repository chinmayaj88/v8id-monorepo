package com.v8idcloud.feature.folders.presentation.ui

import android.view.ViewGroup
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.VideoView
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTransformGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Error
import androidx.compose.material.icons.filled.OpenInNew
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.AsyncImage
import com.v8idcloud.core.ui.theme.V8idColors
import com.v8idcloud.feature.folders.presentation.viewmodel.FileViewerUiState
import com.v8idcloud.feature.folders.presentation.viewmodel.FileViewerViewModel

@Composable
fun FileViewerScreen(
    navController: NavHostController,
    viewModel: FileViewerViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val uriHandler = LocalUriHandler.current

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black) // Dark background for viewer
    ) {
        when (val state = uiState) {
            is FileViewerUiState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = Color.White
                )
            }
            is FileViewerUiState.Error -> {
                Column(
                    modifier = Modifier.align(Alignment.Center),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.Error,
                        contentDescription = null,
                        tint = V8idColors.Semantic.Error,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(text = state.message, color = Color.White)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.loadFile() }) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Retry")
                    }
                }
            }
            is FileViewerUiState.Success -> {
                ViewerContent(
                    url = state.url,
                    mimeType = state.mimeType,
                    name = state.name,
                    localFile = state.localFile,
                    textContent = state.textContent
                )
            }
        }

        // Overlay Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = WindowInsets.statusBars.asPaddingValues().calculateTopPadding() + 16.dp)
                .padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            IconButton(
                onClick = { navController.popBackStack() },
                modifier = Modifier
                    .background(Color.Black.copy(alpha = 0.4f), CircleShape)
            ) {
                Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = Color.White)
            }
            
            Spacer(modifier = Modifier.width(16.dp))
            
            if (uiState is FileViewerUiState.Success) {
                 Text(
                    text = (uiState as FileViewerUiState.Success).name,
                    color = Color.White,
                    fontWeight = FontWeight.Bold,
                    maxLines = 1,
                    modifier = Modifier.weight(1f)
                )

                 // External link button
                 IconButton(
                    onClick = { uriHandler.openUri((uiState as FileViewerUiState.Success).url) },
                    modifier = Modifier
                        .background(Color.Black.copy(alpha = 0.4f), CircleShape)
                ) {
                    Icon(Icons.Default.OpenInNew, contentDescription = "Open External", tint = Color.White)
                }
            }
        }
    }
}

@Composable
fun ViewerContent(
    url: String, 
    mimeType: String, 
    name: String,
    localFile: java.io.File?,
    textContent: String?
) {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        when {
            // TEXT
            textContent != null -> {
                TextViewer(textContent)
            }
            // PDF
            mimeType == "application/pdf" && localFile != null -> {
                PdfViewer(localFile)
            }
            // IMAGE
            mimeType.startsWith("image/") -> {
                ZoomableImage(url, name)
            }
            // VIDEO
            mimeType.startsWith("video/") -> {
                VideoPlayer(url)
            }
            // FALLBACK / OTHER DOCS
            else -> {
                // If we have a local file but no viewer for it, show error/info
                if (localFile != null) {
                    Text("No viewer available for this file type.", color = Color.White)
                } else {
                   // Still try Google Docs Viewer as last resort for non-local scenarios,
                   // or simply show "Open Externally" message since we have the button in header.
                   Text("Preview not available.\nUse the button above to open externally.", 
                       color = Color.Gray, 
                       textAlign = androidx.compose.ui.text.style.TextAlign.Center
                   )
                }
            }
        }
    }
}

@Composable
fun TextViewer(content: String) {
    androidx.compose.foundation.lazy.LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .background(Color.White)
    ) {
        item {
             Text(
                text = content,
                color = Color.Black,
                modifier = Modifier.padding(bottom = 80.dp) // padding for scrolling
            )
        }
    }
}

@Composable
fun PdfViewer(file: java.io.File) {
    // We use remember to holding the renderer resources.
    // Note: PdfRenderer is not thread-safe, strict ui-thread usage is easiest here.
    val rendererResources = remember(file) {
        try {
            val fileDescriptor = android.os.ParcelFileDescriptor.open(file, android.os.ParcelFileDescriptor.MODE_READ_ONLY)
            val pdfRenderer = android.graphics.pdf.PdfRenderer(fileDescriptor)
            Pair(fileDescriptor, pdfRenderer)
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    if (rendererResources == null) {
        Text("Failed to load PDF", color = Color.Red)
        return
    }

    val (fileDescriptor, pdfRenderer) = rendererResources

    DisposableEffect(file) {
        onDispose {
            try {
                pdfRenderer.close()
                fileDescriptor.close()
            } catch (e: Exception) {
                e.printStackTrace()
            }
        }
    }

    androidx.compose.foundation.lazy.LazyColumn(
        modifier = Modifier.fillMaxSize().background(Color.White),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(pdfRenderer.pageCount) { index ->
            PdfPage(pdfRenderer, index)
        }
        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
fun PdfPage(renderer: android.graphics.pdf.PdfRenderer, index: Int) {
    // Render the page into a bitmap
    val bitmap = remember(renderer, index) {
        val page = renderer.openPage(index)
        // High quality scale: e.g. width of screen. 
        // For simplicity we use page width/height * 2 for decent quality,
        // but realistically we should scale to screen width.
        // Let's assume a fixed density scalar or just use page dimensions for now.
        // A standard A4 like page is around 595x842 points.
        val width = page.width * 2
        val height = page.height * 2
        val bmp = android.graphics.Bitmap.createBitmap(width, height, android.graphics.Bitmap.Config.ARGB_8888)
        page.render(bmp, null, null, android.graphics.pdf.PdfRenderer.Page.RENDER_MODE_FOR_DISPLAY)
        page.close()
        bmp
    }

    androidx.compose.foundation.Image(
        bitmap = bitmap.asImageBitmap(),
        contentDescription = "Page ${index + 1}",
        modifier = Modifier
            .fillMaxWidth()
            .background(Color.White),
        contentScale = ContentScale.FillWidth
    )
}

@Composable
fun ZoomableImage(url: String, name: String) {
    var scale by remember { mutableStateOf(1f) }
    var offset by remember { mutableStateOf(androidx.compose.ui.geometry.Offset.Zero) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .pointerInput(Unit) {
                detectTransformGestures { _, pan, zoom, _ ->
                    scale = (scale * zoom).coerceIn(1f, 5f)
                    if (scale == 1f) offset = androidx.compose.ui.geometry.Offset.Zero
                    else offset += pan
                }
            }
    ) {
         AsyncImage(
            model = url,
            contentDescription = name,
            modifier = Modifier
                .fillMaxSize()
                .graphicsLayer(
                    scaleX = scale,
                    scaleY = scale,
                    translationX = offset.x,
                    translationY = offset.y
                ),
            contentScale = ContentScale.Fit
        )
    }
}

@Composable
fun VideoPlayer(url: String) {
    val context = LocalContext.current
    
    // Simple VideoView for basic playback
    AndroidView(
        factory = { ctx ->
            VideoView(ctx).apply {
                layoutParams = ViewGroup.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.MATCH_PARENT
                )
                setVideoPath(url)
                val mediaController = android.widget.MediaController(ctx)
                mediaController.setAnchorView(this)
                setMediaController(mediaController)
                start()
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
