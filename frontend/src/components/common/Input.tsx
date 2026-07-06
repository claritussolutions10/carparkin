interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export default function Input({ label, error, id, className = '', ...props }: InputProps) {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="space-y-1.5">
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {label}
      </label>
      <input
        id={inputId}
        className={`w-full rounded-lg border px-4 py-2.5 font-body text-ink placeholder:text-ink/40 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-green/30 ${
          error ? 'border-danger' : 'border-line focus:border-green'
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}
