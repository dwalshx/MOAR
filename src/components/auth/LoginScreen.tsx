import { useState } from 'react';
import { useAuth } from '../../lib/auth';

/**
 * Two-step OTP login:
 *   1. Enter email → send code
 *   2. Enter 6-digit code → verify + sign in
 */
export default function LoginScreen({ onSkip }: { onSkip?: () => void }) {
  const { sendOTP, verifyOTP } = useAuth();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await sendOTP(email);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await verifyOTP(email, code.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid or expired code');
      setLoading(false);
    }
    // Success: auth state change will auto-dismiss the screen
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl font-black text-3xl mb-4"
            style={{
              background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)',
              color: '#fff',
            }}
          >
            M
          </div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">MOAR</h1>
          <p className="text-text-secondary text-sm mt-1">
            {step === 'email' ? 'Sign in to sync your workouts' : `Enter the code sent to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              autoComplete="email"
              autoFocus
              className="bg-bg-card border border-border rounded-lg px-4 py-3
                         text-text-primary placeholder-text-secondary min-h-[44px]
                         outline-none focus:border-accent transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="bg-accent text-white font-bold py-3 rounded-lg text-base
                         min-h-[44px] disabled:opacity-40 active:bg-accent-hover transition-colors"
            >
              {loading ? 'Sending...' : 'Send sign-in code'}
            </button>
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                className="text-text-secondary text-sm py-2 active:opacity-80"
              >
                Skip — use MOAR without cloud sync
              </button>
            )}
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className="flex flex-col gap-3">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6-digit code"
              required
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              className="bg-bg-card border border-border rounded-lg px-4 py-3
                         text-text-primary placeholder-text-secondary min-h-[44px]
                         outline-none focus:border-accent transition-colors
                         text-2xl tracking-[0.5em] text-center font-bold"
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="bg-accent text-white font-bold py-3 rounded-lg text-base
                         min-h-[44px] disabled:opacity-40 active:bg-accent-hover transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify & sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
              className="text-text-secondary text-sm py-2 active:opacity-80"
            >
              Use a different email
            </button>
          </form>
        )}

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}
      </div>
    </div>
  );
}
