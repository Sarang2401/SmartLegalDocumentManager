import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Scale, FileText, BookOpen } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const location = useLocation();

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg-subtle)' }}>
            {/* ── Topbar ─────────────────────────────────────────────────── */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 40,
                background: 'linear-gradient(135deg, var(--navy-950) 0%, var(--navy-800) 100%)',
                borderBottom: '1px solid var(--border-navy)',
                boxShadow: '0 2px 20px rgba(6,16,31,0.4)',
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', height: '64px' }}>
                    {/* Logo */}
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '36px', height: '36px',
                            background: 'linear-gradient(135deg, var(--gold-500), var(--gold-400))',
                            borderRadius: '8px',
                            boxShadow: 'var(--shadow-gold)',
                            flexShrink: 0,
                        }}>
                            <Scale size={18} color="#0a1628" strokeWidth={2.5} />
                        </div>
                        <div>
                            <div style={{
                                fontFamily: 'var(--font-display)',
                                fontSize: '1.05rem',
                                fontWeight: 700,
                                color: '#ffffff',
                                letterSpacing: '-0.01em',
                                lineHeight: 1,
                            }}>
                                LexVault
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--gold-500)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>
                                Document Intelligence
                            </div>
                        </div>
                    </Link>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '24px', background: 'var(--border-navy)', margin: '0 28px' }} />

                    {/* Nav */}
                    <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <NavLink to="/" icon={<FileText size={15} />} label="Documents" active={location.pathname === '/'} />
                        <NavLink to="/" icon={<BookOpen size={15} />} label="Audit Logs" active={false} />
                    </nav>

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 14px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-navy)',
                            borderRadius: '20px',
                        }}>
                            <div style={{
                                width: '7px', height: '7px',
                                borderRadius: '50%',
                                background: '#4ade80',
                                boxShadow: '0 0 6px rgba(74,222,128,0.6)',
                            }} />
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-nav)', fontWeight: 500 }}>System Operational</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Gold accent line ───────────────────────────────────────── */}
            <div style={{
                height: '2px',
                background: 'linear-gradient(90deg, var(--gold-500) 0%, var(--gold-400) 50%, transparent 100%)',
            }} />

            {/* ── Main content ───────────────────────────────────────────── */}
            <main className="container" style={{ paddingTop: '2rem', paddingBottom: '3rem' }}>
                {children}
            </main>

            {/* ── Footer ─────────────────────────────────────────────────── */}
            <footer style={{
                borderTop: '1px solid var(--border-light)',
                padding: '1.25rem 0',
                background: '#ffffff',
            }}>
                <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>
                        © 2025 LexVault · Smart Legal Document Manager
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-lighter)' }}>
                        Powered by FastAPI · PostgreSQL · React
                    </span>
                </div>
            </footer>
        </div>
    );
};

function NavLink({ to, icon, label, active }: { to: string; icon: React.ReactNode; label: string; active: boolean }) {
    return (
        <Link
            to={to}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8125rem',
                fontWeight: active ? 600 : 400,
                color: active ? '#ffffff' : 'var(--text-nav)',
                background: active ? 'var(--bg-glass)' : 'transparent',
                border: active ? '1px solid var(--border-navy)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
            }}
        >
            {icon}
            {label}
        </Link>
    );
}
