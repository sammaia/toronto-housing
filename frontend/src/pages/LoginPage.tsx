import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const BAR_DATA = [
  { h: 42, delay: 0.05 },
  { h: 67, delay: 0.12 },
  { h: 38, delay: 0.19 },
  { h: 81, delay: 0.26 },
  { h: 55, delay: 0.33 },
  { h: 73, delay: 0.40 },
  { h: 46, delay: 0.47 },
  { h: 88, delay: 0.54 },
  { h: 61, delay: 0.61 },
  { h: 79, delay: 0.68 },
  { h: 52, delay: 0.75 },
  { h: 95, delay: 0.82 },
  { h: 64, delay: 0.89 },
  { h: 70, delay: 0.96 },
];

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch {
      setError('Invalid email or password. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 650);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .lp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 55% 45%;
          background: hsl(224, 71%, 4%);
        }

        @media (max-width: 800px) {
          .lp-root { grid-template-columns: 1fr; }
          .lp-left { display: none; }
        }

        /* ── LEFT PANEL ── */
        .lp-left {
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, hsl(224, 75%, 5%) 0%, hsl(224, 71%, 3%) 100%);
          border-right: 1px solid hsla(216, 34%, 91%, 0.06);
          display: flex;
          flex-direction: column;
          padding: 3rem 3.5rem;
        }

        .lp-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 90% 55% at 25% 55%, hsla(38, 95%, 55%, 0.07) 0%, transparent 65%),
            radial-gradient(ellipse 60% 50% at 85% 20%, hsla(210, 90%, 60%, 0.04) 0%, transparent 60%);
          pointer-events: none;
        }

        .lp-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(hsla(213, 31%, 91%, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, hsla(213, 31%, 91%, 0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }

        .lp-brand {
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        .lp-icon {
          width: 44px;
          height: 44px;
          background: hsl(38, 95%, 52%);
          border-radius: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2.25rem;
          box-shadow: 0 4px 24px hsla(38, 95%, 52%, 0.3);
        }

        .lp-headline {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2.6rem, 3.8vw, 3.6rem);
          font-weight: 200;
          line-height: 1.08;
          color: hsl(213, 31%, 91%);
          letter-spacing: -0.025em;
          margin: 0 0 1rem 0;
        }

        .lp-headline em {
          font-style: italic;
          color: hsl(38, 95%, 62%);
          font-weight: 200;
        }

        .lp-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(215, 16%, 42%);
          font-weight: 400;
        }

        /* Chart area */
        .lp-chart-area {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 2.5rem 0 1.5rem;
        }

        .lp-chart-label {
          font-size: 0.68rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(215, 16%, 38%);
          margin-bottom: 1rem;
        }

        .lp-bars {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          height: 130px;
        }

        .lp-bar {
          flex: 1;
          border-radius: 3px 3px 0 0;
          transform-origin: bottom center;
          transform: scaleY(0);
          animation: lp-bar-rise 0.7s cubic-bezier(0.34, 1.4, 0.64, 1) forwards;
        }

        @keyframes lp-bar-rise {
          to { transform: scaleY(1); }
        }

        .lp-baseline {
          height: 1px;
          background: hsla(213, 31%, 91%, 0.08);
          margin-top: 6px;
        }

        /* Stats */
        .lp-stats {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 0;
          padding-top: 2rem;
          border-top: 1px solid hsla(213, 31%, 91%, 0.07);
          flex-shrink: 0;
        }

        .lp-stat {
          flex: 1;
          padding: 0 1.25rem 0 0;
          animation: lp-fade-up 0.5s ease forwards;
          opacity: 0;
        }

        .lp-stat:not(:first-child) {
          padding-left: 1.25rem;
          border-left: 1px solid hsla(213, 31%, 91%, 0.07);
        }

        .lp-stat:nth-child(1) { animation-delay: 1.1s; }
        .lp-stat:nth-child(2) { animation-delay: 1.25s; }
        .lp-stat:nth-child(3) { animation-delay: 1.4s; }

        @keyframes lp-fade-up {
          from { transform: translateY(6px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }

        .lp-stat-val {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 1.45rem;
          font-weight: 400;
          color: hsl(38, 95%, 60%);
          letter-spacing: -0.02em;
          display: block;
          line-height: 1;
          margin-bottom: 0.35rem;
        }

        .lp-stat-lbl {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(215, 16%, 40%);
        }

        /* ── RIGHT PANEL ── */
        .lp-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          animation: lp-slide-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes lp-slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }

        .lp-form-wrap {
          width: 100%;
          max-width: 348px;
        }

        /* Mobile brand */
        .lp-mobile-brand {
          display: none;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.25rem;
        }

        @media (max-width: 800px) {
          .lp-mobile-brand { display: flex; }
        }

        .lp-mobile-icon {
          width: 38px;
          height: 38px;
          background: hsl(38, 95%, 52%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 16px hsla(38, 95%, 52%, 0.25);
        }

        .lp-mobile-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: hsl(213, 31%, 88%);
          letter-spacing: -0.01em;
        }

        .lp-form-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.9rem;
          font-weight: 400;
          color: hsl(213, 31%, 91%);
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.02em;
        }

        .lp-form-sub {
          font-size: 0.875rem;
          color: hsl(215, 16%, 48%);
          margin: 0 0 2.25rem 0;
        }

        .lp-field {
          margin-bottom: 1.125rem;
        }

        .lp-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(215, 16%, 60%);
          margin-bottom: 0.45rem;
        }

        .lp-input-wrap {
          position: relative;
        }

        .lp-input {
          width: 100%;
          background: hsl(224, 65%, 6%);
          border: 1px solid hsl(216, 34%, 16%);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          color: hsl(213, 31%, 91%);
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }

        .lp-input::placeholder {
          color: hsl(215, 16%, 30%);
        }

        .lp-input:focus {
          border-color: hsl(38, 95%, 52%);
          box-shadow: 0 0 0 3px hsla(38, 95%, 52%, 0.13);
        }

        .lp-input-pw {
          padding-right: 3rem;
        }

        .lp-eye-btn {
          position: absolute;
          right: 0.875rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: hsl(215, 16%, 42%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: color 0.15s;
          line-height: 0;
        }

        .lp-eye-btn:hover { color: hsl(213, 31%, 75%); }

        .lp-error {
          font-size: 0.8125rem;
          color: hsl(0, 72%, 68%);
          background: hsla(0, 63%, 31%, 0.14);
          border: 1px solid hsla(0, 63%, 40%, 0.28);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          margin-bottom: 1.125rem;
        }

        @keyframes lp-shake {
          0%,  100% { transform: translateX(0);   }
          15%        { transform: translateX(-7px); }
          30%        { transform: translateX(7px);  }
          45%        { transform: translateX(-5px); }
          60%        { transform: translateX(5px);  }
          75%        { transform: translateX(-2px); }
          90%        { transform: translateX(2px);  }
        }

        .lp-form-shaking { animation: lp-shake 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

        .lp-submit {
          width: 100%;
          background: hsl(38, 95%, 52%);
          color: hsl(224, 71%, 7%);
          border: none;
          border-radius: 8px;
          padding: 0.825rem 1rem;
          font-size: 0.9375rem;
          font-weight: 700;
          cursor: pointer;
          letter-spacing: 0.01em;
          transition: background 0.15s, transform 0.1s, box-shadow 0.15s;
          margin-bottom: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .lp-submit:hover:not(:disabled) {
          background: hsl(38, 95%, 58%);
          box-shadow: 0 4px 22px hsla(38, 95%, 52%, 0.38);
          transform: translateY(-1px);
        }

        .lp-submit:active:not(:disabled) { transform: translateY(0); }

        .lp-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .lp-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid hsla(224, 71%, 7%, 0.3);
          border-top-color: hsl(224, 71%, 7%);
          border-radius: 50%;
          animation: lp-spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes lp-spin { to { transform: rotate(360deg); } }

        .lp-footer {
          text-align: center;
          font-size: 0.875rem;
          color: hsl(215, 16%, 46%);
        }

        .lp-footer a {
          color: hsl(38, 95%, 62%);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .lp-footer a:hover { color: hsl(38, 95%, 72%); }
      `}</style>

      <div className="lp-root">
        {/* ── LEFT PANEL ── */}
        <div className="lp-left">
          <div className="lp-grid-bg" />

          <div className="lp-brand">
            <div className="lp-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(224,71%,8%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4"  />
                <line x1="6"  y1="20" x2="6"  y2="14" />
                <line x1="2"  y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <h1 className="lp-headline">
              Toronto<br />
              <em>Housing</em><br />
              Insights
            </h1>
            <p className="lp-eyebrow">CMHC Data Dashboard · 2024</p>
          </div>

          <div className="lp-chart-area">
            <p className="lp-chart-label">Housing Starts — Toronto CMA</p>
            <div className="lp-bars">
              {BAR_DATA.map((bar, i) => (
                <div
                  key={i}
                  className="lp-bar"
                  style={{
                    height: `${bar.h}%`,
                    animationDelay: `${bar.delay}s`,
                    background:
                      i === BAR_DATA.length - 1
                        ? 'hsl(38, 95%, 55%)'
                        : i % 3 === 0
                        ? 'hsla(38, 95%, 55%, 0.55)'
                        : 'hsla(38, 95%, 55%, 0.22)',
                  }}
                />
              ))}
            </div>
            <div className="lp-baseline" />
          </div>

          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-val">2.4%</span>
              <span className="lp-stat-lbl">Vacancy Rate</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">$2,847</span>
              <span className="lp-stat-lbl">Avg Rent / mo</span>
            </div>
            <div className="lp-stat">
              <span className="lp-stat-val">38.2k</span>
              <span className="lp-stat-lbl">Housing Starts</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lp-right">
          <div className="lp-form-wrap">
            {/* Mobile-only brand */}
            <div className="lp-mobile-brand">
              <div className="lp-mobile-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="hsl(224,71%,8%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4"  />
                  <line x1="6"  y1="20" x2="6"  y2="14" />
                  <line x1="2"  y1="20" x2="22" y2="20" />
                </svg>
              </div>
              <span className="lp-mobile-name">Toronto Housing Insights</span>
            </div>

            <h2 className="lp-form-title">Welcome back</h2>
            <p className="lp-form-sub">Sign in to access your dashboard</p>

            <form
              onSubmit={handleSubmit}
              className={shake ? 'lp-form-shaking' : ''}
            >
              <div className="lp-field">
                <label className="lp-label" htmlFor="email">Email</label>
                <div className="lp-input-wrap">
                  <input
                    id="email"
                    type="email"
                    className="lp-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="lp-field">
                <label className="lp-label" htmlFor="password">Password</label>
                <div className="lp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="lp-input lp-input-pw"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="lp-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="lp-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="lp-submit"
                disabled={isLoading}
              >
                {isLoading && <span className="lp-spinner" />}
                {isLoading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div style={{ position: 'relative', margin: '1.25rem 0' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                <div style={{ width: '100%', height: '1px', background: 'hsla(213, 31%, 91%, 0.08)' }} />
              </div>
              <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                <span style={{ padding: '0 1rem', background: 'hsl(224, 71%, 4%)', fontSize: '0.75rem', color: 'hsl(215, 16%, 42%)' }}>or</span>
              </div>
            </div>

            <button
              type="button"
              className="lp-submit"
              disabled={isDemoLoading}
              style={{ background: 'transparent', border: '1px solid hsl(38, 95%, 52%)', color: 'hsl(38, 95%, 62%)' }}
              onClick={async () => {
                setIsDemoLoading(true);
                setError('');
                try {
                  await login('samantha_maia@icloud.com', 'samisami1');
                  navigate('/');
                } catch {
                  setError('Demo login failed. Please try again.');
                  setShake(true);
                  setTimeout(() => setShake(false), 650);
                } finally {
                  setIsDemoLoading(false);
                }
              }}
            >
              {isDemoLoading && <span className="lp-spinner" />}
              {isDemoLoading ? 'Loading demo…' : 'View Demo'}
            </button>

            <p className="lp-footer">
              Don't have an account?{' '}
              <Link to="/register">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
