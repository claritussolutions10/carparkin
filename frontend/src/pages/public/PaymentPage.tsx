import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock } from 'lucide-react'
import { createPaymentOrder, verifyPayment } from '../../api/bookings.api'
import { loadRazorpayCheckout } from '../../lib/razorpay'
import { useAuthStore } from '../../store/authStore'
import Button from '../../components/common/Button'
import Navbar from '../../components/layout/Navbar'

function fmt(n: number) { return `₹${Number(n).toLocaleString('en-IN')}` }

export default function PaymentPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const bookingId = params.get('bookingId') ?? ''
  const amount = Number(params.get('amount') ?? 0)

  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!bookingId || !amount) navigate('/search')
  }, [bookingId, amount, navigate])

  const handlePay = async () => {
    setError('')
    setProcessing(true)
    try {
      const [order] = await Promise.all([createPaymentOrder(bookingId), loadRazorpayCheckout()])

      const razorpay = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: 'Carparkin.in',
        description: 'Monthly parking booking',
        prefill: {
          name: user?.full_name,
          email: user?.email,
          contact: user?.phone_number,
        },
        theme: { color: '#22c55e' },
        handler: async (response) => {
          try {
            await verifyPayment(bookingId, response)
            navigate(`/booking/confirmation?bookingId=${bookingId}`)
          } catch (err: any) {
            setError(err?.response?.data?.error ?? 'Payment verification failed. Please contact support before trying again.')
          } finally {
            setProcessing(false)
          }
        },
        modal: {
          ondismiss: () => setProcessing(false),
        },
      })
      razorpay.open()
    } catch (err: any) {
      setError(err?.response?.data?.error ?? 'Could not start payment. Please try again.')
      setProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-concrete">
      <Navbar />

      <div className="max-w-lg mx-auto px-4 py-10">
        <Link to="#" onClick={() => navigate(-1)} className="text-sm text-ink/50 hover:text-ink inline-flex items-center gap-1 mb-6">
          ← Back
        </Link>

        <h1 className="font-display text-2xl font-semibold text-ink mb-6">Complete Payment</h1>

        {/* Order summary */}
        <div className="bg-surface rounded-xl border border-line p-5 mb-4">
          <h2 className="font-display font-semibold text-ink mb-4">Order Summary</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-ink/60">
              <span>Booking ID</span>
              <span className="font-mono text-xs">{bookingId.slice(0, 20)}…</span>
            </div>
            <div className="flex justify-between text-ink/60">
              <span>Platform fee</span>
              <span className="text-green-600">Free</span>
            </div>
          </div>
          <div className="border-t border-line mt-4 pt-4 flex justify-between font-display font-semibold text-lg">
            <span className="text-ink">Total</span>
            <span className="text-ink">{fmt(amount)}</span>
          </div>
        </div>

        {/* Payment CTA */}
        <div className="bg-surface rounded-xl border border-line p-5 mb-4 space-y-4">
          <div className="flex items-center gap-2 text-sm text-ink/50">
            <Lock size={14} className="text-green-600" />
            <span>Secure payment via Razorpay · SSL encrypted</span>
          </div>
        </div>

        {error && <p className="text-sm text-danger mb-4">{error}</p>}

        <Button className="w-full" onClick={handlePay} loading={processing}>
          {processing ? 'Processing payment…' : `Pay Now · ${fmt(amount)}`}
        </Button>

        <p className="text-center text-xs text-ink/40 mt-4">
          By continuing, you agree to our{' '}
          <span className="underline cursor-pointer">Terms of Service</span> and{' '}
          <span className="underline cursor-pointer">Cancellation Policy</span>.
        </p>
      </div>
    </div>
  )
}
