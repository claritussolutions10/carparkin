import type { SVGProps } from 'react'

const BARS = [
  { x: 0, w: 26, h: 70 }, { x: 28, w: 16, h: 100 }, { x: 46, w: 22, h: 55 },
  { x: 70, w: 18, h: 120 }, { x: 90, w: 26, h: 80 }, { x: 118, w: 14, h: 140 },
  { x: 134, w: 24, h: 60 }, { x: 160, w: 18, h: 95 }, { x: 180, w: 26, h: 130 },
  { x: 208, w: 16, h: 65 }, { x: 226, w: 22, h: 105 }, { x: 250, w: 18, h: 85 },
  { x: 270, w: 26, h: 145 }, { x: 298, w: 16, h: 60 }, { x: 316, w: 24, h: 100 },
]

export default function CitySkyline(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 340 150" preserveAspectRatio="none" {...props}>
      {BARS.map((b) => (
        <rect key={b.x} x={b.x} y={150 - b.h} width={b.w} height={b.h} fill="currentColor" />
      ))}
    </svg>
  )
}
