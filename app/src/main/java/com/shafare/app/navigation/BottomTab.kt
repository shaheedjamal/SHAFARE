package com.shafare.app.navigation

import androidx.annotation.StringRes
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Explore
import androidx.compose.material.icons.outlined.History
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.ui.graphics.vector.ImageVector
import com.shafare.app.R

enum class BottomTab(val route: String, @StringRes val label: Int, val icon: ImageVector) {
    Home(Routes.HOME, R.string.nav_home, Icons.Outlined.Home),
    Explore(Routes.EXPLORE, R.string.nav_explore, Icons.Outlined.Explore),
    Activity(Routes.ACTIVITY, R.string.nav_activity, Icons.Outlined.History),
    Notifications(Routes.NOTIFICATIONS, R.string.nav_notifications, Icons.Outlined.Notifications),
    Profile(Routes.PROFILE, R.string.nav_profile, Icons.Outlined.Person),
}
