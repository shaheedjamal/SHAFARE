package com.shafare.app.presentation.common

import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import com.shafare.app.ui.components.EmptyState

/**
 * Honest stand-in for a screen that is built in a later phase.
 * It shows no fabricated content, only what is not implemented yet.
 */
@Composable
fun PlaceholderScreen(title: String, phase: Int, modifier: Modifier = Modifier) {
    EmptyState(
        title = title,
        message = "This screen is implemented in Phase $phase.",
        modifier = modifier,
    )
}
