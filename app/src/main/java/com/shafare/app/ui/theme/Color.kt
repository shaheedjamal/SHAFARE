package com.shafare.app.ui.theme

import androidx.compose.runtime.Immutable
import androidx.compose.runtime.ReadOnlyComposable
import androidx.compose.runtime.Composable
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/** Raw SHAFARE palette: deep black, graphite, metallic silver, electric blue, cyan. */
object ShafarePalette {
    val Black = Color(0xFF05070B)
    val Graphite = Color(0xFF0E1218)
    val GraphiteElevated = Color(0xFF161B24)
    val GraphiteBorder = Color(0xFF2A3240)
    val Silver = Color(0xFFD5DAE3)
    val SilverDim = Color(0xFF8A93A1)
    val ElectricBlue = Color(0xFF2F7BFF)
    val Cyan = Color(0xFF2EE6FF)
    val Success = Color(0xFF34D399)
    val Warning = Color(0xFFFFB84D)
    val Error = Color(0xFFFF5470)

    val LightBackground = Color(0xFFF4F6FA)
    val LightSurface = Color(0xFFFFFFFF)
    val LightSurfaceVariant = Color(0xFFE9EDF4)
    val LightBorder = Color(0xFFCBD2DE)
    val LightText = Color(0xFF0B0F17)
    val LightTextDim = Color(0xFF4A5568)
    val LightBlue = Color(0xFF1F63E0)
}

/** Tokens that Material 3's ColorScheme has no slot for. */
@Immutable
data class ShafareColors(
    val gradientStart: Color,
    val gradientEnd: Color,
    val glow: Color,
    val glassHigh: Color,
    val glassLow: Color,
    val glassBorder: Color,
    val success: Color,
    val warning: Color,
    val skeleton: Color,
    val skeletonHighlight: Color,
)

val DarkShafareColors = ShafareColors(
    gradientStart = ShafarePalette.ElectricBlue,
    gradientEnd = ShafarePalette.Cyan,
    glow = ShafarePalette.ElectricBlue,
    glassHigh = ShafarePalette.GraphiteElevated,
    glassLow = ShafarePalette.Graphite,
    glassBorder = ShafarePalette.GraphiteBorder,
    success = ShafarePalette.Success,
    warning = ShafarePalette.Warning,
    skeleton = ShafarePalette.GraphiteElevated,
    skeletonHighlight = ShafarePalette.GraphiteBorder,
)

val LightShafareColors = ShafareColors(
    gradientStart = ShafarePalette.LightBlue,
    gradientEnd = Color(0xFF0BA5C4),
    glow = ShafarePalette.LightBlue,
    glassHigh = ShafarePalette.LightSurface,
    glassLow = ShafarePalette.LightSurfaceVariant,
    glassBorder = ShafarePalette.LightBorder,
    success = Color(0xFF0F9F6E),
    warning = Color(0xFFB7791F),
    skeleton = ShafarePalette.LightSurfaceVariant,
    skeletonHighlight = Color(0xFFF8FAFD),
)

val LocalShafareColors = staticCompositionLocalOf { DarkShafareColors }

object Shafare {
    val colors: ShafareColors
        @Composable @ReadOnlyComposable get() = LocalShafareColors.current
}
