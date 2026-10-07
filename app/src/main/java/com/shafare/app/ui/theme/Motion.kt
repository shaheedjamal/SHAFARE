package com.shafare.app.ui.theme

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.runtime.compositionLocalOf

object ShafareMotion {
    const val Fast = 150
    const val Normal = 300
    const val Slow = 600
    val Emphasized = CubicBezierEasing(0.2f, 0f, 0f, 1f)
}

/** True when the user (or the OS) asked for reduced motion. Animations must check this. */
val LocalReducedMotion = compositionLocalOf { false }
