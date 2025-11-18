'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AccessCodePage() {
  const router = useRouter()
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [spotsLeft, setSpotsLeft] = useState(0)
  const totalSpots = 2500
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  })
  const [isDark, setIsDark] = useState(false)
  const [error, setError] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Fetch spots from Redis and calculate deadline
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch('/api/access/spots')
        const data = await response.json()
        setSpotsLeft(data.spotsLeft || 0)
      } catch (error) {
        console.error('Failed to fetch spots:', error)
        setSpotsLeft(0)
      }
    }

    fetchSpots()
  }, [])

  // Calculate time until 2026-01-01 00:00:00 UTC
  useEffect(() => {
    const calculateTimeLeft = () => {
      const deadline = new Date('2026-01-01T00:00:00Z').getTime()
      const now = new Date().getTime()
      const difference = deadline - now

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24))
        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24)
        const minutes = Math.floor((difference / 1000 / 60) % 60)
        const seconds = Math.floor((difference / 1000) % 60)

        setTimeLeft({ days, hours, minutes, seconds })
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
      }
    }

    calculateTimeLeft()
    const timer = setInterval(calculateTimeLeft, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDark])

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1)
    setCode(newCode)

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const newCode = [...code]

    for (let i = 0; i < pastedData.length; i++) {
      newCode[i] = pastedData[i]
    }

    setCode(newCode)

    if (pastedData.length === 6) {
      inputRefs.current[5]?.focus()
    } else {
      inputRefs.current[pastedData.length]?.focus()
    }
  }

  const handleSubmit = async () => {
    const fullCode = code.join('')
    if (fullCode.length !== 6) return

    setIsVerifying(true)
    setError('')

    try {
      const response = await fetch('/api/access/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // Store auth token and redirect to app
        localStorage.setItem('access_token', data.token)
        router.push('/home')
      } else {
        setError(data.message || 'Invalid code')
        setCode(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (err) {
      setError('Error during verification')
      console.error(err)
    } finally {
      setIsVerifying(false)
    }
  }

  const progressPercentage = (spotsLeft / totalSpots) * 100

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 transition-colors duration-300 relative overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }}></div>
        <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
      </div>

      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setIsDark(!isDark)}
          className="w-12 h-12 rounded-full bg-secondary/60 backdrop-blur-xl hover:bg-accent/80 transition-all duration-300 flex items-center justify-center group border border-border/40 shadow-lg"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <svg className="w-5 h-5 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 transition-transform group-hover:-rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <main className="container mx-auto px-6 pt-16 pb-16 relative z-10">
        <div className="max-w-5xl mx-auto space-y-8">

          <div className="animate-fade-in">
            <div className="bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[30px] p-8 md:p-12 shadow-2xl">
              <div className="text-center mb-8">
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Campaign ongoing</p>
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-balance">
                  Ends in
                </h2>
              </div>

              <div className="grid grid-cols-4 gap-4 md:gap-6">
                {[
                  { value: timeLeft.days, label: 'Days' },
                  { value: timeLeft.hours, label: 'Hours' },
                  { value: timeLeft.minutes, label: 'Min' },
                  { value: timeLeft.seconds, label: 'Sec' }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-3">
                    <div className="bg-secondary/60 backdrop-blur-xl text-foreground w-full aspect-square flex items-center justify-center rounded-[30px] shadow-2xl transition-transform hover:scale-105 border border-border/40">
                      <span className="text-4xl md:text-6xl font-bold tabular-nums">
                        {String(item.value).padStart(2, '0')}
                      </span>
                    </div>
                    <p className="text-sm md:text-base text-muted-foreground font-medium">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[30px] p-8 md:p-12 shadow-2xl">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                  <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-balance">
                    Enter your code
                  </h1>
                  <p className="text-lg text-muted-foreground text-balance">
                    Enter the 6-digit code you received
                  </p>
                </div>

                <div className="flex gap-3 md:gap-4 justify-center mb-8" onPaste={handlePaste}>
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={el => { inputRefs.current[index] = el }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-14 h-16 md:w-20 md:h-24 text-3xl md:text-5xl font-bold text-center bg-background/60 backdrop-blur-xl border-2 border-input/60 rounded-[30px] focus:border-ring focus:outline-none focus:ring-4 focus:ring-ring/20 transition-all tabular-nums shadow-xl"
                      aria-label={`Digit ${index + 1}`}
                    />
                  ))}
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-[20px] text-destructive text-sm font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={code.join('').length !== 6 || isVerifying}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold rounded-[30px] shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] bg-primary/90 backdrop-blur-xl"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify code'}
                  </Button>

                  <Link href="https://waitlist.usci.tech" target="_blank" className="block">
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-14 text-lg font-semibold rounded-[30px] transition-all hover:bg-secondary/80 backdrop-blur-xl bg-secondary/60 border-border/40 shadow-lg"
                    >
                      Back to waitlist
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="bg-card/40 backdrop-blur-2xl border border-border/40 rounded-[30px] p-8 md:p-12 shadow-2xl">
              <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">
                    Available spots
                  </p>

                  <div className="inline-flex items-center gap-4 bg-secondary/60 backdrop-blur-xl px-10 py-6 rounded-[30px] border border-border/40 shadow-xl">
                    <div className="flex items-baseline gap-2">
                      <span className="text-6xl md:text-7xl font-bold tabular-nums tracking-tight">
                        {spotsLeft}
                      </span>
                      <span className="text-2xl text-muted-foreground font-medium">
                        / {totalSpots}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="relative h-4 bg-muted/40 backdrop-blur-xl rounded-full overflow-hidden border border-border/20 shadow-inner">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary/90 backdrop-blur-xl rounded-full transition-all duration-1000 ease-out shadow-lg"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {totalSpots - spotsLeft} registered
                    </span>
                    <span className={`font-semibold ${spotsLeft < 100 ? 'text-warning' : 'text-success'}`}>
                      {spotsLeft < 100 ? 'Limited spots!' : 'Spots available'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <footer className="border-t border-border/40 mt-16 relative z-10 bg-background/40 backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-sm text-muted-foreground">
            User collection campaign in progress
          </p>
        </div>
      </footer>
    </div>
  )
}
