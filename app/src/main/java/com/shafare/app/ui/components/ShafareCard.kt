package com.shafare.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.semantics.Role
import com.shafare.app.ui.theme.Shafare
import com.shafare.app.ui.theme.ShafareBorder
import com.shafare.app.ui.theme.ShafareRadius
import com.shafare.app.ui.theme.ShafareSpacing

/** Glass-style card: vertical graphite gradient with a hairline border. Clickable when [onClick] is set. */
@Composable
fun ShafareCard(
    modifier: Modifier = Modifier,
    onClick: (() -> Unit)? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colors = Shafare.colors
    val shape = RoundedCornerShape(ShafareRadius.lg)
    Column(
        modifier = modifier
            .fillMaxWidth()
            .clip(shape)
            .background(Brush.verticalGradient(listOf(colors.glassHigh, colors.glassLow)))
            .border(ShafareBorder.hairline, colors.glassBorder, shape)
            .then(if (onClick != null) Modifier.clickable(role = Role.Button, onClick = onClick) else Modifier)
            .padding(ShafareSpacing.lg),
        content = content,
    )
}
