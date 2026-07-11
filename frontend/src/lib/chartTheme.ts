// Recharts takes literal color props, not Tailwind classes, so grid/axis
// colors can't inherit the CSS-variable dark mode flip automatically -
// dashboards read these directly off the theme store instead.
export function chartTheme(isDark: boolean) {
  return {
    grid: isDark ? '#2B3548' : '#D7DBE0',
    tick: isDark ? '#8A93A6' : '#6B7280',
  }
}
