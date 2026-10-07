package com.shafare.app.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import com.shafare.app.ui.theme.Shafare
import com.shafare.app.ui.theme.ShafareRadius
import com.shafare.app.ui.theme.ShafareSpacing

/**
 * Primary call-to-action. While [loading] is true it shows a spinner (optionally with
 * [loadingText]) and ignores clicks, which prevents duplicate submissions.
 */
@Composable
fun ShafareButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    loadingText: String? = null,
) {
    val colors = Shafare.colors
    val shape = RoundedCornerShape(ShafareRadius.md)
    val label = if (loading && loadingText != null) loadingText else text
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .alpha(if (enabled) 1f else 0.4f)
            .clip(shape)
            .background(Brush.horizontalGradient(listOf(colors.gradientStart, colors.gradientEnd)))
            .clickable(enabled = enabled && !loading, role = Role.Button, onClick = onClick)
            .semantics { if (loading) stateDescription = label }
            .padding(horizontal = ShafareSpacing.xl, vertical = ShafareSpacing.md),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (loading) {
            CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp, color = Color.White)
            androidx.compose.foundation.layout.Spacer(Modifier.padding(horizontal = ShafareSpacing.xs))
        }
        Text(label, style = MaterialTheme.typography.labelLarge, color = Color.White)
    }
}

@Composable
fun ShafareOutlinedButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val shape = RoundedCornerShape(ShafareRadius.md)
    val stroke = BorderStroke(1.dp, MaterialTheme.colorScheme.outline)
    Row(
        modifier = modifier
            .fillMaxWidth()
            .heightIn(min = 52.dp)
            .alpha(if (enabled) 1f else 0.4f)
            .clip(shape)
            .border(stroke, shape)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .padding(horizontal = ShafareSpacing.xl, vertical = ShafareSpacing.md),
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Text(text, style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.onSurface)
    }
}
