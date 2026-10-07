package com.shafare.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.shafare.app.navigation.ShafareNavHost
import com.shafare.app.presentation.main.MainViewModel
import com.shafare.app.ui.theme.ShafareTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        val splash = installSplashScreen()
        super.onCreate(savedInstanceState)
        splash.setKeepOnScreenCondition { viewModel.settings.value == null }
        enableEdgeToEdge()

        setContent {
            val settings by viewModel.settings.collectAsStateWithLifecycle()
            settings?.let { current ->
                ShafareTheme(themeMode = current.themeMode, reducedMotion = current.reducedMotion) {
                    ShafareNavHost(settings = current)
                }
            }
        }
    }
}
