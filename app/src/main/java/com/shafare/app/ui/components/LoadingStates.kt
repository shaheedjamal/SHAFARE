package com.shafare.app.ui.components

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Shape
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import com.shafare.app.R
import com.shafare.app.ui.theme.LocalReducedMotion
import com.shafare.app.ui.theme.Shafare
import com.shafare.app.ui.theme.ShafareRadius
import com.shafare.app.ui.theme.ShafareSpacing

/** Full-screen loading for startup and critical transitions. */
@Composable
fun FullScreenLoading(modifier: Modifier = Modifier, message: String = stringResource(R.string.loading_default)) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .semantics { contentDescription = message },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        CircularProgressIndicator(color = MaterialTheme.colorScheme.primary)
        Text(
            message,
            modifier = Modifier.padding(top = ShafareSpacing.lg),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
        )
    }
}

/** Skeleton placeholder block. Static (no shimmer) when reduced motion is on. */
@Composable
fun SkeletonBox(
    modifier: Modifier = Modifier,
    shape: Shape = RoundedCornerShape(ShafareRadius.md),
) {
    val base = Shafare.colors.skeleton
    val highlight = Shafare.colors.skeletonHighlight
    val reduced = LocalReducedMotion.current
    val progress = if (reduced) {
        0f
    } else {
        val transition = rememberInfiniteTransition(label = "skeleton")
        val value by transition.animateFloat(
            initialValue = -1f,
            targetValue = 2f,
            animationSpec = infiniteRepeatable(tween(1400, easing = LinearEasing), RepeatMode.Restart),
            label = "skeletonShift",
        )
        value
    }
    Box(
        modifier = modifier
            .clip(shape)
            .drawBehind {
                drawRect(base)
                if (!reduced) {
                    drawRect(
                        Brush.horizontalGradient(
                            colors = listOf(base, highlight, base),
                            startX = size.width * (progress - 0.5f),
                            endX = size.width * (progress + 0.5f),
                        ),
                    )
                }
            },
    )
}

@Composable
fun EmptyState(
    title: String,
    message: String,
    modifier: Modifier = Modifier,
    actionLabel: String? = null,
    onAction: (() -> Unit)? = null,
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(ShafareSpacing.xl),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge, textAlign = TextAlign.Center)
        Text(
            message,
            modifier = Modifier.padding(vertical = ShafareSpacing.md),
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            textAlign = TextAlign.Center,
        )
        if (actionLabel != null && onAction != null) {
            ShafareButton(text = actionLabel, onClick = onAction)
        }
    }
}

/** Non-technical error with retry. Never pass stack traces or backend messages here. */
@Composable
fun ErrorState(
    message: String,
    onRetry: () -> Unit,
    modifier: Modifier = Modifier,
    title: String = "Something went wrong",
) {
    EmptyState(
        title = title,
        message = message,
        modifier = modifier,
        actionLabel = stringResource(R.string.retry),
        onAction = onRetry,
    )
}
