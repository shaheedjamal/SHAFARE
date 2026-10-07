package com.shafare.app.domain.repository

import com.shafare.app.domain.model.AppSettings
import com.shafare.app.domain.model.ThemeMode
import kotlinx.coroutines.flow.Flow

interface SettingsRepository {
    val settings: Flow<AppSettings>
    suspend fun setOnboardingCompleted(completed: Boolean)
    suspend fun setThemeMode(mode: ThemeMode)
    suspend fun setReducedMotion(enabled: Boolean)
}
