package com.shafare.app.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

// Sizes are in sp so they scale with the user's font-size setting.
object ShafareFontSize {
    val caption = 12.sp
    val body = 15.sp
    val bodyLarge = 17.sp
    val title = 20.sp
    val headline = 28.sp
    val display = 36.sp
}

object ShafareFontWeight {
    val regular = FontWeight.Normal
    val medium = FontWeight.Medium
    val semibold = FontWeight.SemiBold
    val bold = FontWeight.Bold
    val black = FontWeight.Black
}

private val Family = FontFamily.Default

val ShafareTypography = Typography(
    displayLarge = TextStyle(Family, ShafareFontWeight.bold, ShafareFontSize.display, lineHeight = 44.sp, letterSpacing = (-0.5).sp),
    headlineLarge = TextStyle(Family, ShafareFontWeight.bold, ShafareFontSize.headline, lineHeight = 36.sp),
    headlineMedium = TextStyle(Family, ShafareFontWeight.semibold, 24.sp, lineHeight = 32.sp),
    titleLarge = TextStyle(Family, ShafareFontWeight.semibold, ShafareFontSize.title, lineHeight = 28.sp),
    titleMedium = TextStyle(Family, ShafareFontWeight.medium, ShafareFontSize.bodyLarge, lineHeight = 24.sp, letterSpacing = 0.1.sp),
    bodyLarge = TextStyle(Family, ShafareFontWeight.regular, ShafareFontSize.bodyLarge, lineHeight = 24.sp),
    bodyMedium = TextStyle(Family, ShafareFontWeight.regular, ShafareFontSize.body, lineHeight = 22.sp),
    bodySmall = TextStyle(Family, ShafareFontWeight.regular, ShafareFontSize.caption, lineHeight = 16.sp),
    labelLarge = TextStyle(Family, ShafareFontWeight.semibold, ShafareFontSize.body, lineHeight = 20.sp, letterSpacing = 0.4.sp),
    labelMedium = TextStyle(Family, ShafareFontWeight.medium, ShafareFontSize.caption, lineHeight = 16.sp, letterSpacing = 0.5.sp),
)
