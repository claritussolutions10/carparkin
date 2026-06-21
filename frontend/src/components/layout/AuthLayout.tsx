import { useEffect, useState } from 'react'
import BarrierGate from '../common/BarrierGate'

interface AuthLayoutProps {
  children: React.ReactNode
  title: string
  subtitle: string
  gateOpen: boolean
}

export default function AuthLayout({ children, title, subtitle, gateOpen }: AuthLayoutProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-concrete">
      <div className="hidden lg:flex flex-col justify-between bg-navy text-white px-12 py-12">
        <span className="font-display text-xl font-semibold tracking-tight">Carparkin</span>

        <div className="flex justify-start">
          <BarrierGate open={!mounted || gateOpen} />
        </div>

        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight">{title}</h2>
          <p className="mt-2 text-white/60 text-sm max-w-xs">{subtitle}</p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
