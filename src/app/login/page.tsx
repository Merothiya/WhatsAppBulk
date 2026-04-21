'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [retryMinutes, setRetryMinutes] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Countdown timer when locked out
  useEffect(() => {
    if (!isLocked || retryMinutes <= 0) return;
    const interval = setInterval(() => {
      setRetryMinutes((prev) => {
        if (prev <= 1) {
          setIsLocked(false);
          setError('');
          setRemainingAttempts(null);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [isLocked, retryMinutes]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked || isLoading || !password.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push('/');
        router.refresh();
        return;
      }

      // Rate limited
      if (res.status === 429) {
        setIsLocked(true);
        setRetryMinutes(data.retryAfterMinutes || 15);
        setError(data.error);
        setRemainingAttempts(0);
        triggerShake();
        return;
      }

      // Wrong password
      setError(data.error || 'Incorrect password');
      setRemainingAttempts(data.remainingAttempts ?? null);
      setPassword('');
      triggerShake();
      inputRef.current?.focus();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  const attemptsLow = remainingAttempts !== null && remainingAttempts <= 5;
  const attemptsCritical = remainingAttempts !== null && remainingAttempts <= 2;

  return (
    <div className="login-page">
      {/* Animated background orbs */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      <div className="login-bg-orb login-bg-orb-3" />

      <div className={`login-card ${shake ? 'login-shake' : ''}`}>
        {/* Logo / Icon */}
        <div className="login-icon-wrapper">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="login-icon"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347z"
              fill="currentColor"
            />
            <path
              d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.832-1.438A9.955 9.955 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.11-1.14l-.29-.174-3.01.79.81-2.95-.19-.3A7.96 7.96 0 014 12c0-4.42 3.58-8 8-8s8 3.58 8 8-3.58 8-8 8z"
              fill="currentColor"
            />
          </svg>
        </div>

        <h1 className="login-title">WhatsApp Bulk</h1>
        <p className="login-subtitle">Enter your admin password to continue</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-input-wrapper">
            <input
              ref={inputRef}
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin Password"
              className={`login-input ${error ? 'login-input-error' : ''}`}
              disabled={isLocked}
              autoComplete="current-password"
              required
            />
            <div className="login-input-glow" />
          </div>

          {error && (
            <div
              className={`login-error ${attemptsCritical ? 'login-error-critical' : ''}`}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="login-error-icon">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {remainingAttempts !== null && !isLocked && (
            <p
              className={`login-attempts ${attemptsLow ? 'login-attempts-warn' : ''} ${attemptsCritical ? 'login-attempts-critical' : ''}`}
            >
              {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''}{' '}
              remaining
            </p>
          )}

          {isLocked && (
            <p className="login-locked-msg">
              🔒 Locked out — try again in ~{retryMinutes} minute{retryMinutes !== 1 ? 's' : ''}
            </p>
          )}

          <button
            type="submit"
            className="login-button"
            disabled={isLocked || isLoading || !password.trim()}
          >
            {isLoading ? (
              <span className="login-spinner" />
            ) : (
              'Unlock'
            )}
          </button>
        </form>

        <p className="login-footer">
          Protected access · Rate limited
        </p>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0b0f19;
          position: relative;
          overflow: hidden;
          font-family: var(--font-geist-sans, 'Inter', system-ui, sans-serif);
        }

        /* Animated background orbs */
        .login-bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.35;
          animation: floatOrb 20s ease-in-out infinite;
          pointer-events: none;
        }
        .login-bg-orb-1 {
          width: 500px; height: 500px;
          background: #25d366;
          top: -120px; left: -100px;
          animation-delay: 0s;
        }
        .login-bg-orb-2 {
          width: 400px; height: 400px;
          background: #128c7e;
          bottom: -80px; right: -60px;
          animation-delay: -7s;
        }
        .login-bg-orb-3 {
          width: 300px; height: 300px;
          background: #075e54;
          top: 50%; left: 60%;
          animation-delay: -14s;
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(40px, -30px) scale(1.05); }
          50% { transform: translate(-20px, 40px) scale(0.95); }
          75% { transform: translate(30px, 20px) scale(1.02); }
        }

        /* Card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 420px;
          margin: 1rem;
          padding: 2.5rem 2rem 2rem;
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(40px);
          -webkit-backdrop-filter: blur(40px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.05),
            0 8px 40px rgba(0,0,0,0.4);
          text-align: center;
          transition: transform 0.3s ease;
        }
        .login-card:hover {
          transform: translateY(-2px);
        }

        /* Shake animation */
        .login-shake {
          animation: shakeCard 0.6s ease;
        }
        @keyframes shakeCard {
          0%, 100% { transform: translateX(0); }
          15% { transform: translateX(-12px); }
          30% { transform: translateX(10px); }
          45% { transform: translateX(-8px); }
          60% { transform: translateX(6px); }
          75% { transform: translateX(-4px); }
          90% { transform: translateX(2px); }
        }

        /* Icon */
        .login-icon-wrapper {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px; height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, #25d366, #128c7e);
          margin-bottom: 1.25rem;
          box-shadow: 0 4px 24px rgba(37, 211, 102, 0.3);
        }
        .login-icon {
          width: 36px; height: 36px;
          color: #fff;
        }

        /* Typography */
        .login-title {
          font-size: 1.625rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.375rem;
          letter-spacing: -0.02em;
        }
        .login-subtitle {
          font-size: 0.875rem;
          color: rgba(255,255,255,0.5);
          margin: 0 0 1.75rem;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .login-input-wrapper {
          position: relative;
        }
        .login-input {
          width: 100%;
          padding: 0.875rem 1rem;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: #fff;
          font-size: 0.95rem;
          outline: none;
          transition: all 0.3s ease;
          box-sizing: border-box;
        }
        .login-input::placeholder {
          color: rgba(255,255,255,0.3);
        }
        .login-input:focus {
          border-color: #25d366;
          background: rgba(37, 211, 102, 0.06);
          box-shadow: 0 0 0 3px rgba(37, 211, 102, 0.15);
        }
        .login-input-error {
          border-color: #ef4444 !important;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.15) !important;
        }
        .login-input:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .login-input-glow {
          position: absolute;
          inset: -1px;
          border-radius: 15px;
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.2), transparent, rgba(18, 140, 126, 0.2));
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
          z-index: -1;
        }
        .login-input:focus ~ .login-input-glow {
          opacity: 1;
        }

        /* Error */
        .login-error {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.625rem 0.875rem;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: 12px;
          color: #fca5a5;
          font-size: 0.825rem;
          text-align: left;
        }
        .login-error-critical {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.4);
          color: #fecaca;
        }
        .login-error-icon {
          width: 16px; height: 16px;
          flex-shrink: 0;
        }

        /* Attempts counter */
        .login-attempts {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          margin: -0.25rem 0 0;
        }
        .login-attempts-warn {
          color: #fbbf24;
        }
        .login-attempts-critical {
          color: #f87171;
          font-weight: 600;
        }

        /* Locked message */
        .login-locked-msg {
          font-size: 0.825rem;
          color: #f87171;
          font-weight: 500;
          padding: 0.5rem 0.75rem;
          background: rgba(239, 68, 68, 0.08);
          border-radius: 10px;
          margin: 0;
        }

        /* Button */
        .login-button {
          position: relative;
          width: 100%;
          padding: 0.875rem;
          background: linear-gradient(135deg, #25d366, #128c7e);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          letter-spacing: 0.01em;
          overflow: hidden;
          min-height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .login-button:hover:not(:disabled)::before {
          opacity: 1;
        }
        .login-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 30px rgba(37, 211, 102, 0.35);
        }
        .login-button:active:not(:disabled) {
          transform: translateY(0);
        }
        .login-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        /* Spinner */
        .login-spinner {
          display: inline-block;
          width: 20px; height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .login-footer {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.2);
          margin: 1.75rem 0 0;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
