const c = (n) => `rgb(var(--${n}) / <alpha-value>)`
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { bg: c('bg'), surface: c('surface'), surface2: c('surface2'), line: c('line'),
        fg: c('fg'), fg2: c('fg2'), muted: c('muted'), accent: c('accent'), cyan: c('cyan'), violet: c('violet') },
      fontFamily: { display: ['Sora', 'Inter', 'system-ui', 'sans-serif'], sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'], mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'] }
    }
  }
}
