package com.v8idcloud.core.ui.components

import androidx.compose.animation.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.v8idcloud.core.common.SearchSuggestion
import com.v8idcloud.core.common.SuggestionType
import com.v8idcloud.core.ui.theme.V8idColors

/**
 * Reusable Search Bar with suggestions
 */
@Composable
fun SearchBar(
    modifier: Modifier = Modifier,
    hint: String = "Search files",
    searchQuery: String = "",
    onQueryChange: (String) -> Unit = {},
    searchResults: List<SearchSuggestion> = emptyList(),
    onFilterClick: () -> Unit = {},
    onSuggestionClick: (SearchSuggestion) -> Unit = {}
) {
    Column(modifier = modifier) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .height(48.dp),
            shape = RoundedCornerShape(24.dp),
            color = V8idColors.UI.Surface,
            border = BorderStroke(
                1.dp,
                V8idColors.UI.TextTertiary.copy(alpha = 0.3f)
            ),
            tonalElevation = 2.dp
        ) {
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Outlined.Search,
                    contentDescription = null,
                    tint = V8idColors.UI.IconTint,
                    modifier = Modifier.size(20.dp)
                )

                Spacer(modifier = Modifier.width(12.dp))

                BasicTextField(
                    value = searchQuery,
                    onValueChange = onQueryChange,
                    singleLine = true,
                    textStyle = TextStyle(
                        fontSize = 15.sp,
                        color = V8idColors.UI.TextPrimary
                    ),
                    modifier = Modifier.weight(1f),
                    decorationBox = { innerTextField ->
                        if (searchQuery.isEmpty()) {
                            Text(
                                text = hint,
                                fontSize = 15.sp,
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
                            .size(20.dp)
                            .clickable { onQueryChange("") }
                    )

                    Spacer(modifier = Modifier.width(12.dp))
                }

                Icon(
                    imageVector = Icons.Outlined.Tune,
                    contentDescription = "Filter",
                    tint = V8idColors.UI.IconTint,
                    modifier = Modifier
                        .size(20.dp)
                        .clickable { onFilterClick() }
                )
            }
        }

        // Suggestions List
        AnimatedVisibility(
            visible = searchQuery.isNotEmpty() && searchResults.isNotEmpty(),
            enter = expandVertically() + fadeIn(),
            exit = shrinkVertically() + fadeOut()
        ) {
            Surface(
                shape = RoundedCornerShape(16.dp),
                color = V8idColors.UI.Surface,
                shadowElevation = 8.dp,
                modifier = Modifier.padding(top = 8.dp).fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(vertical = 8.dp)) {
                    searchResults.forEach { suggestion ->
                        SearchSuggestionItem(suggestion, onClick = { onSuggestionClick(suggestion) })
                    }
                }
            }
        }
    }
}

@Composable
fun SearchSuggestionItem(
    suggestion: SearchSuggestion,
    onClick: () -> Unit = {}
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(horizontal = 16.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Surface(
            modifier = Modifier.size(36.dp),
            shape = CircleShape,
            color = V8idColors.Purple.SubtlePurpleTint
        ) {
            Box(contentAlignment = Alignment.Center) {
                Icon(
                    imageVector = suggestion.icon ?: Icons.Outlined.Description,
                    contentDescription = null,
                    tint = V8idColors.Purple.VibrantPurple,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(
                text = suggestion.title,
                fontWeight = FontWeight.Medium,
                fontSize = 15.sp,
                color = V8idColors.UI.TextPrimary
            )
            Text(
                text = suggestion.subtitle,
                fontSize = 13.sp,
                color = V8idColors.UI.TextTertiary
            )
        }
    }
}


