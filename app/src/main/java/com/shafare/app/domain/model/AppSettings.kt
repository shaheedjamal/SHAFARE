package com.shafare.app.domain.model

data class AppSettings(
    val themeMode: ThemeMode = ThemeMode.DARK,
    val reducedMotion: Boolean = false,
    val onboardingCompleted: Boolean = false,
)
