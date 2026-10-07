package com.shafare.app.navigation

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.navigation.NavController
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraphBuilder
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.navigation
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.shafare.app.domain.model.AppSettings
import com.shafare.app.presentation.common.PlaceholderScreen
import com.shafare.app.presentation.common.UnavailableScreen
import com.shafare.app.presentation.splash.SplashScreen
import com.shafare.app.utils.navigateToTab

@Composable
fun ShafareNavHost(settings: AppSettings) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route
    val showBottomBar = BottomTab.entries.any { it.route == currentRoute }

    Scaffold(
        containerColor = MaterialTheme.colorScheme.background,
        bottomBar = {
            AnimatedVisibility(visible = showBottomBar) {
                ShafareBottomBar(navController)
            }
        },
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = Routes.SPLASH,
            modifier = Modifier.padding(padding),
        ) {
            composable(Routes.SPLASH) {
                SplashScreen(onReady = {
                    // Phase 2 adds the Firebase auth check; authenticated users will go to MAIN_GRAPH.
                    val target = if (settings.onboardingCompleted) Routes.LOGIN else Routes.ONBOARDING
                    navController.navigate(target) {
                        popUpTo(Routes.SPLASH) { inclusive = true }
                    }
                })
            }
            composable(Routes.UNAVAILABLE) {
                UnavailableScreen(onGoHome = {
                    navController.navigate(Routes.HOME) {
                        popUpTo(Routes.UNAVAILABLE) { inclusive = true }
                    }
                })
            }
            authGraph()
            mainGraph(navController)
            adminGraph()
        }
    }
}

@Composable
private fun ShafareBottomBar(navController: NavController) {
    val backStackEntry by navController.currentBackStackEntryAsState()
    val destination = backStackEntry?.destination
    NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
        BottomTab.entries.forEach { tab ->
            val selected = destination?.hierarchy?.any { it.route == tab.route } == true
            val label = stringResource(tab.label)
            NavigationBarItem(
                selected = selected,
                onClick = { if (!selected) navController.navigateToTab(tab.route) },
                icon = { Icon(tab.icon, contentDescription = label) },
                label = { Text(label) },
                colors = NavigationBarItemDefaults.colors(
                    indicatorColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.18f),
                    selectedIconColor = MaterialTheme.colorScheme.secondary,
                    selectedTextColor = MaterialTheme.colorScheme.secondary,
                ),
            )
        }
    }
}

private fun NavGraphBuilder.authGraph() {
    navigation(startDestination = Routes.LOGIN, route = Routes.AUTH_GRAPH) {
        composable(Routes.ONBOARDING) { PlaceholderScreen("Onboarding", phase = 2) }
        composable(Routes.LOGIN) { PlaceholderScreen("Login", phase = 2) }
        composable(Routes.REGISTER) { PlaceholderScreen("Create account", phase = 2) }
        composable(Routes.VERIFY_EMAIL) { PlaceholderScreen("Verify email", phase = 2) }
        composable(Routes.FORGOT_PASSWORD) { PlaceholderScreen("Forgot password", phase = 2) }
        composable(Routes.RESET_PASSWORD) { PlaceholderScreen("Reset password", phase = 2) }
    }
}

private fun NavGraphBuilder.mainGraph(navController: NavController) {
    navigation(startDestination = Routes.HOME, route = Routes.MAIN_GRAPH) {
        composable(Routes.HOME) { PlaceholderScreen("Home", phase = 3) }
        composable(Routes.EXPLORE) { PlaceholderScreen("Explore", phase = 3) }
        composable(Routes.SEARCH) { PlaceholderScreen("Search", phase = 3) }
        composable(
            Routes.SEARCH_RESULTS,
            arguments = listOf(navArgument("query") { type = NavType.StringType }),
        ) { entry ->
            val query = entry.arguments?.getString("query")
            GuardedArgument(navController, query) { PlaceholderScreen("Search results", phase = 3) }
        }
        composable(Routes.ACTIVITY) { PlaceholderScreen("Activity", phase = 3) }
        composable(Routes.NOTIFICATIONS) { PlaceholderScreen("Notifications", phase = 3) }
        composable(Routes.FAVORITES) { PlaceholderScreen("Favorites", phase = 3) }
        composable(Routes.PROFILE) { PlaceholderScreen("Profile", phase = 3) }
        composable(Routes.SETTINGS) { PlaceholderScreen("Settings", phase = 3) }
        composable(Routes.SECURITY) { PlaceholderScreen("Security", phase = 4) }
        composable(
            Routes.ITEM_DETAIL,
            arguments = listOf(navArgument("itemId") { type = NavType.StringType }),
        ) { entry ->
            val itemId = entry.arguments?.getString("itemId")
            GuardedArgument(navController, itemId) { PlaceholderScreen("Item details", phase = 3) }
        }
    }
}

private fun NavGraphBuilder.adminGraph() {
    navigation(startDestination = Routes.ADMIN_DASHBOARD, route = Routes.ADMIN_GRAPH) {
        // Access control for admin routes is enforced server-side and via role checks in Phase 4.
        composable(Routes.ADMIN_DASHBOARD) { PlaceholderScreen("Admin dashboard", phase = 4) }
        composable(Routes.ADMIN_USERS) { PlaceholderScreen("Users", phase = 4) }
        composable(Routes.ADMIN_REPORTS) { PlaceholderScreen("Reports", phase = 4) }
        composable(Routes.ADMIN_ANALYTICS) { PlaceholderScreen("Analytics", phase = 4) }
        composable(Routes.ADMIN_SECURITY_LOGS) { PlaceholderScreen("Security logs", phase = 4) }
        composable(Routes.ADMIN_SETTINGS) { PlaceholderScreen("Admin settings", phase = 4) }
    }
}

/** Routes missing/blank arguments to the "Page unavailable" fallback instead of crashing. */
@Composable
private fun GuardedArgument(navController: NavController, argument: String?, content: @Composable () -> Unit) {
    if (argument.isNullOrBlank()) {
        LaunchedEffect(Unit) {
            navController.navigate(Routes.UNAVAILABLE) { launchSingleTop = true }
        }
    } else {
        content()
    }
}
