package com.shafare.app.presentation.splash

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.scale
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.shafare.app.ui.components.ShafareLogo
import com.shafare.app.ui.theme.LocalReducedMotion
import com.shafare.app.ui.theme.ShafareMotion
import com.shafare.app.ui.theme.ShafarePalette
import com.shafare.app.ui.theme.ShafareSpacing

/**
 * Animated splash. Navigation happens as soon as initialization is done ([onReady]); there is no
 * fixed delay. In Phase 2 the Firebase auth check runs here, so real startup latency is what lets
 * the animation play.
 */
@Composable
fun SplashScreen(onReady: () -> Unit) {
    val reduced = LocalReducedMotion.current
    val progress = remember { Animatable(if (reduced) 1f else 0f) }
    val currentOnReady = rememberUpdatedState(onReady)

    LaunchedEffect(reduced) {
        if (!reduced) progress.animateTo(1f, tween(ShafareMotion.Slow, easing = ShafareMotion.Emphasized))
    }
    LaunchedEffect(Unit) { currentOnReady.value() }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(ShafarePalette.Black)
            .drawBehind {
                drawRect(
                    Brush.radialGradient(
                        listOf(ShafarePalette.ElectricBlue.copy(alpha = 0.18f), ShafarePalette.Black),
                        radius = size.minDimension * 0.7f,
                    ),
                )
            },
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        ShafareLogo(
            size = 96.dp,
            modifier = Modifier
                .scale(0.85f + 0.15f * progress.value)
                .alpha(progress.value),
        )
        Text(
            text = "SHAFARE",
            modifier = Modifier
                .padding(top = ShafareSpacing.xl)
                .alpha(progress.value),
            color = ShafarePalette.Silver,
            fontSize = 22.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = 8.sp,
            textAlign = TextAlign.Center,
        )
    }
}
