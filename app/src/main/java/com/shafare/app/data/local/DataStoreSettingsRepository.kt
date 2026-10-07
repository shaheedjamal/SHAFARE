package com.shafare.app.data.local

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import com.shafare.app.domain.model.AppSettings
import com.shafare.app.domain.model.ThemeMode
import com.shafare.app.domain.repository.SettingsRepository
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

@Singleton
class DataStoreSettingsRepository @Inject constructor(
    private val dataStore: DataStore<Preferences>,
) : SettingsRepository {

    private object Keys {
        val THEME_MODE = stringPreferencesKey("theme_mode")
        val REDUCED_MOTION = booleanPreferencesKey("reduced_motion")
        val ONBOARDING_COMPLETED = booleanPreferencesKey("onboarding_completed")
    }

    override val settings: Flow<AppSettings> = dataStore.data
        .catch { if (it is IOException) emit(emptyPreferences()) else throw it }
        .map { prefs ->
            AppSettings(
                themeMode = prefs[Keys.THEME_MODE]
                    ?.let { runCatching { ThemeMode.valueOf(it) }.getOrNull() }
                    ?: ThemeMode.DARK,
                reducedMotion = prefs[Keys.REDUCED_MOTION] ?: false,
                onboardingCompleted = prefs[Keys.ONBOARDING_COMPLETED] ?: false,
            )
        }

    override suspend fun setOnboardingCompleted(completed: Boolean) {
        dataStore.edit { it[Keys.ONBOARDING_COMPLETED] = completed }
    }

    override suspend fun setThemeMode(mode: ThemeMode) {
        dataStore.edit { it[Keys.THEME_MODE] = mode.name }
    }

    override suspend fun setReducedMotion(enabled: Boolean) {
        dataStore.edit { it[Keys.REDUCED_MOTION] = enabled }
    }
}
