package com.shafare.app.ui.components

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Visibility
import androidx.compose.material.icons.outlined.VisibilityOff
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.shafare.app.R
import com.shafare.app.ui.theme.LocalReducedMotion
import com.shafare.app.ui.theme.Shafare
import com.shafare.app.ui.theme.ShafareMotion
import com.shafare.app.ui.theme.ShafareRadius
import androidx.compose.material3.MaterialTheme

/** Text input with a subtle electric-blue glow while focused and optional password visibility toggle. */
@Composable
fun ShafareTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    isPassword: Boolean = false,
    errorText: String? = null,
    leadingIcon: ImageVector? = null,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    keyboardActions: KeyboardActions = KeyboardActions.Default,
    singleLine: Boolean = true,
) {
    val interaction = remember { MutableInteractionSource() }
    val focused by interaction.collectIsFocusedAsState()
    val reduced = LocalReducedMotion.current
    val glow by animateFloatAsState(
        targetValue = if (focused) 1f else 0f,
        animationSpec = tween(if (reduced) 0 else ShafareMotion.Fast),
        label = "fieldGlow",
    )
    var passwordVisible by rememberSaveable { mutableStateOf(false) }
    val glowColor = Shafare.colors.glow
    val radius = ShafareRadius.md

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = modifier
            .fillMaxWidth()
            .drawBehind {
                if (glow > 0f) {
                    val e = 4.dp.toPx()
                    drawRoundRect(
                        color = glowColor.copy(alpha = 0.22f * glow),
                        topLeft = Offset(-e, -e),
                        size = Size(size.width + 2 * e, size.height + 2 * e),
                        cornerRadius = CornerRadius(radius.toPx() + e),
                    )
                }
            }
            .semantics { if (errorText != null) error(errorText) },
        enabled = enabled,
        singleLine = singleLine,
        isError = errorText != null,
        interactionSource = interaction,
        shape = androidx.compose.foundation.shape.RoundedCornerShape(radius),
        leadingIcon = leadingIcon?.let { icon -> { Icon(icon, contentDescription = null) } },
        trailingIcon = if (isPassword) {
            {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Outlined.VisibilityOff else Icons.Outlined.Visibility,
                        contentDescription = stringResource(if (passwordVisible) R.string.hide_password else R.string.show_password),
                    )
                }
            }
        } else null,
        visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
        keyboardOptions = if (isPassword) keyboardOptions.copy(keyboardType = KeyboardType.Password) else keyboardOptions,
        keyboardActions = keyboardActions,
        supportingText = if (errorText != null) { { Text(errorText) } } else null,
        colors = OutlinedTextFieldDefaults.colors(
            focusedBorderColor = MaterialTheme.colorScheme.primary,
            unfocusedBorderColor = MaterialTheme.colorScheme.outline,
            focusedContainerColor = MaterialTheme.colorScheme.surface,
            unfocusedContainerColor = MaterialTheme.colorScheme.surface,
        ),
    )
}
