package com.shafare.app.utils

import androidx.navigation.NavController
import androidx.navigation.NavGraph.Companion.findStartDestination
import com.shafare.app.navigation.Routes

/** Navigate without ever crashing on a malformed/unknown route; falls back to "Page unavailable". */
fun NavController.safeNavigate(route: String) {
    try {
        navigate(route)
    } catch (_: IllegalArgumentException) {
        navigate(Routes.UNAVAILABLE) { launchSingleTop = true }
    }
}

/** Tab switch: no duplicate destinations, state saved and restored per tab. */
fun NavController.navigateToTab(route: String) {
    navigate(route) {
        popUpTo(graph.findStartDestination().id) { saveState = true }
        launchSingleTop = true
        restoreState = true
    }
}
