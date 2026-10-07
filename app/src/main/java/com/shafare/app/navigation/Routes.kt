package com.shafare.app.navigation

object Routes {
    const val SPLASH = "splash"
    const val UNAVAILABLE = "unavailable"

    // Graphs
    const val AUTH_GRAPH = "auth_graph"
    const val MAIN_GRAPH = "main_graph"
    const val ADMIN_GRAPH = "admin_graph"

    // Auth graph
    const val ONBOARDING = "onboarding"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val VERIFY_EMAIL = "verify_email"
    const val FORGOT_PASSWORD = "forgot_password"
    const val RESET_PASSWORD = "reset_password"

    // Main graph
    const val HOME = "home"
    const val EXPLORE = "explore"
    const val SEARCH = "search"
    const val SEARCH_RESULTS = "search_results/{query}"
    const val ACTIVITY = "activity"
    const val NOTIFICATIONS = "notifications"
    const val FAVORITES = "favorites"
    const val PROFILE = "profile"
    const val SETTINGS = "settings"
    const val SECURITY = "security"
    const val ITEM_DETAIL = "item/{itemId}"

    // Admin graph
    const val ADMIN_DASHBOARD = "admin_dashboard"
    const val ADMIN_USERS = "admin_users"
    const val ADMIN_REPORTS = "admin_reports"
    const val ADMIN_ANALYTICS = "admin_analytics"
    const val ADMIN_SECURITY_LOGS = "admin_security_logs"
    const val ADMIN_SETTINGS = "admin_settings"

    fun searchResults(query: String) = "search_results/${android.net.Uri.encode(query)}"
    fun itemDetail(itemId: String) = "item/${android.net.Uri.encode(itemId)}"
}
