package com.shafare.app.presentation.common

import androidx.compose.runtime.Composable
import androidx.compose.ui.res.stringResource
import com.shafare.app.R
import com.shafare.app.ui.components.EmptyState

@Composable
fun UnavailableScreen(onGoHome: () -> Unit) {
    EmptyState(
        title = stringResource(R.string.page_unavailable),
        message = stringResource(R.string.page_unavailable_message),
        actionLabel = stringResource(R.string.go_to_home),
        onAction = onGoHome,
    )
}
