import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);

  const pwStrength = password.length === 0 ? 0
    : password.length < 6  ? 1
    : password.length < 10 ? 2
    : 3;

  const strengthLabel = ['', 'Weak', 'Good', 'Strong'][pwStrength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#22c55e'][pwStrength];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      setShake(true);
      setTimeout(() => setShake(false), 650);
      return;
    }
    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch {
      setError('Registration failed. This email may already be in use.');
      setShake(true);
      setTimeout(() => setShake(false), 650);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .rp-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 55% 45%;
          background: hsl(224, 71%, 4%);
        }

        @media (max-width: 800px) {
          .rp-root { grid-template-columns: 1fr; }
          .rp-left { display: none; }
        }

        /* ── LEFT PANEL ── */
        .rp-left {
          position: relative;
          overflow: hidden;
          background: linear-gradient(145deg, hsl(224, 75%, 5%) 0%, hsl(224, 71%, 3%) 100%);
          border-right: 1px solid hsla(216, 34%, 91%, 0.06);
          display: flex;
          flex-direction: column;
          padding: 3rem 3.5rem;
        }

        .rp-left::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(ellipse 80% 50% at 70% 40%, hsla(210, 90%, 60%, 0.06) 0%, transparent 65%),
            radial-gradient(ellipse 70% 55% at 20% 75%, hsla(38, 95%, 55%, 0.05) 0%, transparent 65%);
          pointer-events: none;
        }

        .rp-grid-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(hsla(213, 31%, 91%, 0.025) 1px, transparent 1px),
            linear-gradient(90deg, hsla(213, 31%, 91%, 0.025) 1px, transparent 1px);
          background-size: 44px 44px;
          pointer-events: none;
        }

        .rp-brand { position: relative; z-index: 1; flex-shrink: 0; }

        .rp-icon {
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

        .rp-headline {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2.6rem, 3.8vw, 3.6rem);
          font-weight: 200;
          line-height: 1.08;
          color: hsl(213, 31%, 91%);
          letter-spacing: -0.025em;
          margin: 0 0 1rem 0;
        }

        .rp-headline em {
          font-style: italic;
          color: hsl(38, 95%, 62%);
          font-weight: 200;
        }

        .rp-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: hsl(215, 16%, 42%);
        }

        /* Feature list */
        .rp-features {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 1rem;
          padding: 3rem 0;
        }

        .rp-feature {
          display: flex;
          align-items: flex-start;
          gap: 0.875rem;
          animation: rp-fade-up 0.5s ease forwards;
          opacity: 0;
        }

        .rp-feature:nth-child(1) { animation-delay: 0.2s; }
        .rp-feature:nth-child(2) { animation-delay: 0.35s; }
        .rp-feature:nth-child(3) { animation-delay: 0.5s; }

        @keyframes rp-fade-up {
          from { transform: translateY(8px); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }

        .rp-feature-dot {
          width: 28px;
          height: 28px;
          border-radius: 7px;
          background: hsla(38, 95%, 52%, 0.12);
          border: 1px solid hsla(38, 95%, 52%, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .rp-feature-text strong {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(213, 31%, 82%);
          margin-bottom: 0.2rem;
        }

        .rp-feature-text span {
          font-size: 0.8rem;
          color: hsl(215, 16%, 44%);
          line-height: 1.4;
        }

        .rp-stats {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 0;
          padding-top: 2rem;
          border-top: 1px solid hsla(213, 31%, 91%, 0.07);
          flex-shrink: 0;
        }

        .rp-stat {
          flex: 1;
          padding: 0 1.25rem 0 0;
          animation: rp-fade-up 0.5s ease forwards;
          opacity: 0;
        }

        .rp-stat:not(:first-child) {
          padding-left: 1.25rem;
          border-left: 1px solid hsla(213, 31%, 91%, 0.07);
        }

        .rp-stat:nth-child(1) { animation-delay: 0.7s; }
        .rp-stat:nth-child(2) { animation-delay: 0.85s; }
        .rp-stat:nth-child(3) { animation-delay: 1s; }

        .rp-stat-val {
          font-family: 'DM Mono', 'Courier New', monospace;
          font-size: 1.45rem;
          color: hsl(38, 95%, 60%);
          letter-spacing: -0.02em;
          display: block;
          line-height: 1;
          margin-bottom: 0.35rem;
        }

        .rp-stat-lbl {
          font-size: 0.65rem;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(215, 16%, 40%);
        }

        /* ── RIGHT PANEL ── */
        .rp-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 2rem;
          animation: rp-slide-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }

        @keyframes rp-slide-in {
          from { transform: translateX(20px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }

        .rp-form-wrap { width: 100%; max-width: 348px; }

        .rp-mobile-brand {
          display: none;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2.25rem;
        }

        @media (max-width: 800px) {
          .rp-mobile-brand { display: flex; }
        }

        .rp-mobile-icon {
          width: 38px;
          height: 38px;
          background: hsl(38, 95%, 52%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 16px hsla(38, 95%, 52%, 0.25);
        }

        .rp-mobile-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.05rem;
          font-weight: 400;
          color: hsl(213, 31%, 88%);
          letter-spacing: -0.01em;
        }

        .rp-form-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.9rem;
          font-weight: 400;
          color: hsl(213, 31%, 91%);
          margin: 0 0 0.4rem 0;
          letter-spacing: -0.02em;
        }

        .rp-form-sub {
          font-size: 0.875rem;
          color: hsl(215, 16%, 48%);
          margin: 0 0 2.25rem 0;
        }

        .rp-field { margin-bottom: 1.125rem; }

        .rp-label {
          display: block;
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: hsl(215, 16%, 60%);
          margin-bottom: 0.45rem;
        }

        .rp-input-wrap { position: relative; }

        .rp-input {
          width: 100%;
          background: hsl(224, 65%, 6%);
          border: 1px solid hsl(216, 34%, 16%);
          border-radius: 8px;
          padding: 0.75rem 1rem;
          font-size: 0.9375rem;
          color: hsl(213, 31%, 91%);
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }

        .rp-input::placeholder { color: hsl(215, 16%, 30%); }

        .rp-input:focus {
          border-color: hsl(38, 95%, 52%);
          box-shadow: 0 0 0 3px hsla(38, 95%, 52%, 0.13);
        }

        .rp-input-pw { padding-right: 3rem; }

        .rp-eye-btn {
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
          padding: 0;
          transition: color 0.15s;
          line-height: 0;
        }

        .rp-eye-btn:hover { color: hsl(213, 31%, 75%); }

        /* Password strength */
        .rp-pw-strength {
          margin-top: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.625rem;
        }

        .rp-strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }

        .rp-strength-bar {
          flex: 1;
          height: 3px;
          border-radius: 2px;
          background: hsl(216, 34%, 14%);
          transition: background 0.3s;
        }

        .rp-strength-label {
          font-size: 0.7rem;
          font-weight: 500;
          letter-spacing: 0.05em;
          min-width: 40px;
          text-align: right;
          transition: color 0.3s;
        }

        .rp-error {
          font-size: 0.8125rem;
          color: hsl(0, 72%, 68%);
          background: hsla(0, 63%, 31%, 0.14);
          border: 1px solid hsla(0, 63%, 40%, 0.28);
          border-radius: 8px;
          padding: 0.625rem 0.875rem;
          margin-bottom: 1.125rem;
        }

        @keyframes rp-shake {
          0%,  100% { transform: translateX(0);   }
          15%        { transform: translateX(-7px); }
          30%        { transform: translateX(7px);  }
          45%        { transform: translateX(-5px); }
          60%        { transform: translateX(5px);  }
          75%        { transform: translateX(-2px); }
          90%        { transform: translateX(2px);  }
        }

        .rp-form-shaking { animation: rp-shake 0.65s cubic-bezier(0.36, 0.07, 0.19, 0.97) both; }

        .rp-submit {
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

        .rp-submit:hover:not(:disabled) {
          background: hsl(38, 95%, 58%);
          box-shadow: 0 4px 22px hsla(38, 95%, 52%, 0.38);
          transform: translateY(-1px);
        }

        .rp-submit:active:not(:disabled) { transform: translateY(0); }
        .rp-submit:disabled { opacity: 0.6; cursor: not-allowed; }

        .rp-spinner {
          width: 15px;
          height: 15px;
          border: 2px solid hsla(224, 71%, 7%, 0.3);
          border-top-color: hsl(224, 71%, 7%);
          border-radius: 50%;
          animation: rp-spin 0.65s linear infinite;
          flex-shrink: 0;
        }

        @keyframes rp-spin { to { transform: rotate(360deg); } }

        .rp-footer {
          text-align: center;
          font-size: 0.875rem;
          color: hsl(215, 16%, 46%);
        }

        .rp-footer a {
          color: hsl(38, 95%, 62%);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.15s;
        }

        .rp-footer a:hover { color: hsl(38, 95%, 72%); }
      `}</style>

      <div className="rp-root">
        {/* ── LEFT PANEL ── */}
        <div className="rp-left">
          <div className="rp-grid-bg" />

          <div className="rp-brand">
            <div className="rp-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(224,71%,8%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4"  />
                <line x1="6"  y1="20" x2="6"  y2="14" />
                <line x1="2"  y1="20" x2="22" y2="20" />
              </svg>
            </div>
            <h1 className="rp-headline">
              Toronto<br />
              <em>Housing</em><br />
              Insights
            </h1>
            <p className="rp-eyebrow">CMHC Data Dashboard · 2024</p>
          </div>

          <div className="rp-features">
            {[
              {
                title: 'Live CMHC Data',
                desc: 'Vacancy rates, rental prices, and housing starts updated from official Statistics Canada sources.',
              },
              {
                title: 'Interactive Charts',
                desc: 'Visualize trends across the Toronto CMA with filterable time-series charts.',
              },
              {
                title: 'AI-Powered Chat',
                desc: 'Ask natural language questions about the data and get instant, cited answers.',
              },
            ].map((feat, i) => (
              <div key={i} className="rp-feature">
                <div className="rp-feature-dot">
                  <Check size={13} color="hsl(38,95%,60%)" strokeWidth={2.5} />
                </div>
                <div className="rp-feature-text">
                  <strong>{feat.title}</strong>
                  <span>{feat.desc}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="rp-stats">
            <div className="rp-stat">
              <span className="rp-stat-val">2.4%</span>
              <span className="rp-stat-lbl">Vacancy Rate</span>
            </div>
            <div className="rp-stat">
              <span className="rp-stat-val">$2,847</span>
              <span className="rp-stat-lbl">Avg Rent / mo</span>
            </div>
            <div className="rp-stat">
              <span className="rp-stat-val">38.2k</span>
              <span className="rp-stat-lbl">Housing Starts</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="rp-right">
          <div className="rp-form-wrap">
            <div className="rp-mobile-brand">
              <div className="rp-mobile-icon">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="hsl(224,71%,8%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="20" x2="18" y2="10" />
                  <line x1="12" y1="20" x2="12" y2="4"  />
                  <line x1="6"  y1="20" x2="6"  y2="14" />
                  <line x1="2"  y1="20" x2="22" y2="20" />
                </svg>
              </div>
              <span className="rp-mobile-name">Toronto Housing Insights</span>
            </div>

            <h2 className="rp-form-title">Create account</h2>
            <p className="rp-form-sub">Start exploring Toronto's housing data</p>

            <form
              onSubmit={handleSubmit}
              className={shake ? 'rp-form-shaking' : ''}
            >
              <div className="rp-field">
                <label className="rp-label" htmlFor="name">Full name</label>
                <div className="rp-input-wrap">
                  <input
                    id="name"
                    type="text"
                    className="rp-input"
                    placeholder="Jane Smith"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label" htmlFor="email">Email</label>
                <div className="rp-input-wrap">
                  <input
                    id="email"
                    type="email"
                    className="rp-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="rp-field">
                <label className="rp-label" htmlFor="password">Password</label>
                <div className="rp-input-wrap">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="rp-input rp-input-pw"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="rp-eye-btn"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="rp-pw-strength">
                    <div className="rp-strength-bars">
                      {[1, 2, 3].map((level) => (
                        <div
                          key={level}
                          className="rp-strength-bar"
                          style={{
                            background: pwStrength >= level ? strengthColor : undefined,
                          }}
                        />
                      ))}
                    </div>
                    <span
                      className="rp-strength-label"
                      style={{ color: strengthColor }}
                    >
                      {strengthLabel}
                    </span>
                  </div>
                )}
              </div>

              {error && (
                <div className="rp-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="rp-submit"
                disabled={isLoading}
              >
                {isLoading && <span className="rp-spinner" />}
                {isLoading ? 'Creating account…' : 'Create account'}
              </button>
            </form>

            <p className="rp-footer">
              Already have an account?{' '}
              <Link to="/login">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
