interface PaginationProps {
  page: number
  totalPages: number
  onChange: (page: number) => void
  className?: string
}

export default function Pagination({ page, totalPages, onChange, className = '' }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className={`flex justify-center gap-2 mt-4 ${className}`}>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button key={p} onClick={() => onChange(p)}
          className={`w-8 h-8 rounded-lg text-sm font-medium border transition-colors ${
            page === p
              ? 'bg-green text-white border-green'
              : 'bg-surface border-line text-ink/60 hover:bg-concrete hover:border-green/40'
          }`}>
          {p}
        </button>
      ))}
    </div>
  )
}
