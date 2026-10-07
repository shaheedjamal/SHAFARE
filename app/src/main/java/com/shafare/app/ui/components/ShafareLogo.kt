package com.shafare.app.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shafare.app.R
import com.shafare.app.ui.theme.Shafare
import com.shafare.app.ui.theme.ShafarePalette

/** The "SF" brand mark: graphite plate, silver/blue gradient border, soft electric-blue glow. */
@Composable
fun ShafareLogo(modifier: Modifier = Modifier, size: Dp = 72.dp) {
    val colors = Shafare.colors
    val shape = RoundedCornerShape(size * 0.28f)
    val description = stringResource(R.string.logo_description)
    Box(
        modifier = modifier
            .size(size)
            .semantics { contentDescription = description }
            .drawBehind {
                drawCircle(
                    brush = Brush.radialGradient(
                        listOf(colors.glow.copy(alpha = 0.35f), colors.glow.copy(alpha = 0f)),
                        radius = this.size.minDimension * 0.9f,
                    ),
                    radius = this.size.minDimension * 0.9f,
                )
            }
            .background(Brush.linearGradient(listOf(ShafarePalette.GraphiteElevated, ShafarePalette.Black)), shape)
            .border(1.5.dp, Brush.linearGradient(listOf(ShafarePalette.Silver, colors.gradientStart, colors.gradientEnd)), shape),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = "SF",
            style = MaterialTheme.typography.headlineLarge.copy(
                brush = Brush.linearGradient(listOf(ShafarePalette.Silver, androidx.compose.ui.graphics.Color.White, ShafarePalette.Cyan)),
                fontSize = (size.value * 0.4f).sp,
                fontWeight = FontWeight.Black,
                letterSpacing = 1.sp,
            ),
        )
    }
}
