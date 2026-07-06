interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  loading?: boolean
}

export default function Button({
  variant = 'primary',
  loading,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-body font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green/30 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

  const variants = {
    primary:
      'bg-green text-white hover:bg-green-light hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
    secondary:
      'bg-transparent text-green border border-line hover:border-green hover:-translate-y-0.5',
    danger:
      'bg-danger text-white hover:bg-danger/90 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0',
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} disabled={disabled || loading} {...props}>
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {children}
    </button>
  )
}
