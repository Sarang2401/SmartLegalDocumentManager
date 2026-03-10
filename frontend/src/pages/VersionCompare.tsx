import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingDown, GitCompareArrows } from 'lucide-react';
import { api } from '../api/client';
import type { CompareResponse, DocumentResponse } from '../types';
import { Badge } from '../components/Badge';

const RISK_WORDS = ['payment', 'liability', 'termination', 'confidentiality', 'indemnity', 'penalty'];

function highlightRisk(text: string) {
    const regex = new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi');
    if (!regex.test(text)) return <>{text}</>;
    return <>{text.split(new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi')).map((c, i) =>
        RISK_WORDS.includes(c.toLowerCase())
            ? <span key={i} style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '1px 4px', borderRadius: '3px', border: '1px solid #fde68a' }}>{c}</span>
            : c
    )}</>;
}

export const VersionCompare = () => {
    const { id, v1, v2 } = useParams<{ id: string; v1: string; v2: string }>();
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [data, setData] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => { if (id && v1 && v2) loadData(); }, [id, v1, v2]);

    const loadData = async () => {
        try {
            setLoading(true);
            const docs = await api.getDocuments();
            setDoc(docs.find(d => d.id === id) || null);
            setData(await api.compareVersions(id!, parseInt(v1!), parseInt(v2!)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    if (loading) return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }} className="animate-pulse">Computing legal diff…</div>;
    if (!data || !doc) return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--danger-text)' }}>Comparison data not found.</div>;

    const simPct = (data.similarity * 100).toFixed(1);
    const isIdentical = data.similarity === 1;
    const changeLevel = data.similarity >= 0.98 ? 'minor' : data.similarity >= 0.8 ? 'moderate' : 'significant';
    const changeBadgeVariant = changeLevel === 'minor' ? 'success' : changeLevel === 'moderate' ? 'warning' : 'danger';

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── Hero Header ─────────────────────────────────────────── */}
            <div style={{ background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', boxShadow: 'var(--shadow-lg)', color: '#fff' }}>
                <Link to={`/documents/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', marginBottom: '16px', textDecoration: 'none' }}>
                    <ArrowLeft size={14} /> Back to Document
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <GitCompareArrows size={22} color="var(--gold-400)" />
                            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                                Version Comparison
                            </h1>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>{doc.title}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-glass)', border: '1px solid var(--border-navy)', borderRadius: '10px', padding: '10px 16px' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '2px' }}>Comparing</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-400)', fontFamily: 'var(--font-mono)' }}>v{v1} → v{v2}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Metric Cards ─────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                {/* Similarity */}
                <MetricCard
                    title="Similarity Score"
                    value={`${simPct}%`}
                    icon={isIdentical ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
                    iconBg={isIdentical ? '#d1fae5' : data.similarity >= 0.8 ? '#fef9c3' : '#fee2e2'}
                    iconColor={isIdentical ? '#059669' : data.similarity >= 0.8 ? '#d97706' : '#dc2626'}
                    sub={<Badge variant={changeBadgeVariant}>{changeLevel} change</Badge>}
                />
                {/* Added */}
                <MetricCard
                    title="Lines Added"
                    value={`+${data.added.length}`}
                    icon={<span style={{ fontSize: '1.1rem' }}>+</span>}
                    iconBg="rgb(220,252,231)"
                    iconColor="var(--diff-add-text)"
                    sub="insertions"
                />
                {/* Removed */}
                <MetricCard
                    title="Lines Removed"
                    value={`−${data.removed.length}`}
                    icon={<TrendingDown size={22} />}
                    iconBg="#fee2e2"
                    iconColor="var(--diff-del-text)"
                    sub="deletions"
                />
            </div>

            {/* ── Diff Viewer ──────────────────────────────────────────── */}
            <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                {/* Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-light)', background: '#fafbff' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        <span style={{ marginLeft: '10px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--navy-700)', fontFamily: 'var(--font-mono)' }}>
                            diff — v{v1} → v{v2}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--diff-add-text)', fontWeight: 600 }}>+{data.added.length} added</span>
                        <span style={{ color: 'var(--diff-del-text)', fontWeight: 600 }}>−{data.removed.length} removed</span>
                    </div>
                </div>

                {/* Diff Lines */}
                <div style={{ overflowX: 'auto' }}>
                    {data.diff.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center' }}>
                            <CheckCircle size={44} color="#10b981" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>These two versions are completely identical.</p>
                        </div>
                    ) : (
                        <div style={{ minWidth: 'fit-content' }}>
                            {data.diff.map((line, idx) => {
                                if (line.startsWith('---') || line.startsWith('+++')) return null;
                                if (line.startsWith('@@')) return (
                                    <div key={idx} style={{ background: '#eff6ff', color: '#1d4ed8', padding: '6px 20px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', borderTop: '1px solid #dbeafe', borderBottom: '1px solid #dbeafe' }}>
                                        {line}
                                    </div>
                                );
                                const isA = line.startsWith('+'), isR = line.startsWith('-');
                                return (
                                    <div key={idx} style={{
                                        display: 'flex', alignItems: 'flex-start',
                                        padding: '3px 0',
                                        background: isA ? 'var(--diff-add-bg)' : isR ? 'var(--diff-del-bg)' : 'transparent',
                                        borderLeft: isA ? '3px solid var(--diff-add-text)' : isR ? '3px solid var(--diff-del-text)' : '3px solid transparent',
                                        transition: 'background 0.1s',
                                    }}
                                        onMouseEnter={e => !isA && !isR && (e.currentTarget.style.background = 'var(--bg-hover)')}
                                        onMouseLeave={e => !isA && !isR && (e.currentTarget.style.background = 'transparent')}
                                    >
                                        <div style={{ width: '40px', padding: '0 12px', textAlign: 'center', flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: isA ? 'var(--diff-add-text)' : isR ? 'var(--diff-del-text)' : 'var(--text-lighter)', userSelect: 'none', fontWeight: 600 }}>
                                            {isA ? '+' : isR ? '−' : ' '}
                                        </div>
                                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: isA ? 'var(--diff-add-text)' : isR ? 'var(--diff-del-text)' : 'var(--text-main)', whiteSpace: 'pre-wrap', flex: 1, padding: '0 16px 0 0', lineHeight: 1.7 }}>
                                            {(isA || isR) ? highlightRisk(line.slice(1)) : line}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Risk Summary ─────────────────────────────────────────── */}
            {(data.added.length > 0 || data.removed.length > 0) && (() => {
                const allChangedLines = [...data.added, ...data.removed].join(' ').toLowerCase();
                const foundRisks = RISK_WORDS.filter(w => allChangedLines.includes(w));
                if (foundRisks.length === 0) return null;
                return (
                    <div style={{ padding: '16px 20px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e', marginBottom: '4px' }}>⚖️ Legal Risk Keywords Detected</div>
                            <div style={{ fontSize: '0.8125rem', color: '#78350f' }}>
                                The following high-risk terms appear in the changed sections: {' '}
                                {foundRisks.map((w, i) => <span key={i}><Badge variant="warning" style={{ marginRight: '4px' }}>{w}</Badge></span>)}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

function MetricCard({ title, value, icon, iconBg, iconColor, sub }: { title: string; value: string; icon: React.ReactNode; iconBg: string; iconColor: string; sub: React.ReactNode }) {
    return (
        <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', padding: '20px 22px', boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: 800, fontSize: '1.25rem' }}>
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1, marginBottom: '6px' }}>{value}</div>
                <div>{sub}</div>
            </div>
        </div>
    );
}
