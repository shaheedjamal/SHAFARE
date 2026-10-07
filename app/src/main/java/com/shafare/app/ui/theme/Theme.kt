package com.shafare.app.ui.theme

import android.app.Activity
import android.provider.Settings
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.remember
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat
import com.shafare.app.domain.model.ThemeMode

private val DarkScheme = darkColorScheme(
    primary = ShafarePalette.ElectricBlue,
    onPrimary = Color.White,
    secondary = ShafarePalette.Cyan,
    onSecondary = ShafarePalette.Black,
    tertiary = ShafarePalette.Silver,
    background = ShafarePalette.Black,
    onBackground = Color(0xFFE8ECF2),
    surface = ShafarePalette.Graphite,
    onSurface = Color(0xFFE8ECF2),
    surfaceVariant = ShafarePalette.GraphiteElevated,
    onSurfaceVariant = ShafarePalette.SilverDim,
    outline = ShafarePalette.GraphiteBorder,
    error = ShafarePalette.Error,
    onError = Color.White,
)

private val LightScheme = lightColorScheme(
    primary = ShafarePalette.LightBlue,
    onPrimary = Color.White,
    secondary = Color(0xFF0BA5C4),
    onSecondary = Color.White,
    tertiary = ShafarePalette.LightTextDim,
    background = ShafarePalette.LightBackground,
    onBackground = ShafarePalette.LightText,
    surface = ShafarePalette.LightSurface,
    onSurface = ShafarePalette.LightText,
    surfaceVariant = ShafarePalette.LightSurfaceVariant,
    onSurfaceVariant = ShafarePalette.LightTextDim,
    outline = ShafarePalette.LightBorder,
    error = Color(0xFFD92D4A),
    onError = Color.White,
)

private val ShafareShapes = Shapes(
    extraSmall = RoundedCornerShape(ShafareRadius.sm),
    small = RoundedCornerShape(ShafareRadius.sm),
    medium = RoundedCornerShape(ShafareRadius.md),
    large = RoundedCornerShape(ShafareRadius.lg),
    extraLarge = RoundedCornerShape(ShafareRadius.xl),
)

@Composable
fun ShafareTheme(
    themeMode: ThemeMode,
    reducedMotion: Boolean,
    content: @Composable () -> Unit,
) {
    val dark = when (themeMode) {
        ThemeMode.DARK -> true
        ThemeMode.LIGHT -> false
        ThemeMode.SYSTEM -> isSystemInDarkTheme()
    }
    val context = LocalContext.current
    val systemAnimationsOff = remember {
        Settings.Global.getFloat(context.contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as? Activity)?.window ?: return@SideEffect
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !dark
                isAppearanceLightNavigationBars = !dark
            }
        }
    }

    CompositionLocalProvider(
        LocalShafareColors provides if (dark) DarkShafareColors else LightShafareColors,
        LocalReducedMotion provides (reducedMotion || systemAnimationsOff),
    ) {
        MaterialTheme(
            colorScheme = if (dark) DarkScheme else LightScheme,
            typography = ShafareTypography,
            shapes = ShafareShapes,
            content = content,
        )
    }
}
