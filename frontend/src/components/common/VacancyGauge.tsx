import { useEffect, useState } from 'react'

interface VacancyGaugeProps {
  capacity: number
  vacancy: number
  size?: 'sm' | 'md'
}

export default function VacancyGauge({ capacity, vacancy, size = 'md' }: VacancyGaugeProps) {
  const [animated, setAnimated] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setAnimated(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const booked = capacity - vacancy
  const fillRatio = capacity > 0 ? booked / capacity : 0

  let color: string
  if (fillRatio > 0.8) color = '#D64545'
  else if (fillRatio > 0.5) color = '#F5A623'
  else color = '#34D399'

  const dims = size === 'sm' ? { w: 52, r: 18, sw: 4, fs1: 13, fs2: 8 } : { w: 72, r: 26, sw: 5, fs1: 16, fs2: 9 }
  const circumference = 2 * Math.PI * dims.r
  const dashOffset = animated ? circumference * (1 - fillRatio) : circumference

  return (
    <div className="flex items-center gap-2">
      <svg width={dims.w} height={dims.w} className="shrink-0" aria-hidden="true">
        <circle
          cx={dims.w / 2} cy={dims.w / 2} r={dims.r}
          fill="none" stroke="#D7DBE0" strokeWidth={dims.sw}
        />
        <circle
          cx={dims.w / 2} cy={dims.w / 2} r={dims.r}
          fill="none" stroke={color} strokeWidth={dims.sw}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
        <text x={dims.w / 2} y={dims.w / 2 - 2} textAnchor="middle" dominantBaseline="central"
          fill="#15202B" fontSize={dims.fs1} fontWeight={600} fontFamily="'Space Grotesk', sans-serif">
          {vacancy}
        </text>
        <text x={dims.w / 2} y={dims.w / 2 + (size === 'sm' ? 11 : 14)} textAnchor="middle"
          fill="#15202B" fontSize={dims.fs2} opacity={0.5} fontFamily="'IBM Plex Sans', sans-serif">
          left
        </text>
      </svg>
      <span className="sr-only">{vacancy} of {capacity} spots available</span>
    </div>
  )
}
