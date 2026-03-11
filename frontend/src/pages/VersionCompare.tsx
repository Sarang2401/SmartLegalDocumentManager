import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
    ArrowLeft,
    CheckCircle,
    AlertTriangle,
    TrendingDown,
    GitCompareArrows,
    Sparkles,
} from 'lucide-react';
import { api } from '../api/client';
import { ApiError } from '../api/client';
import type { CompareResponse, DocumentResponse } from '../types';
import { Badge } from '../components/Badge';

const RISK_WORDS = ['payment', 'liability', 'termination', 'confidentiality', 'indemnity', 'penalty'];

function buildFallbackSummary(data: CompareResponse) {
    const changedLines = data.added.length + data.removed.length;
    const topics = RISK_WORDS
        .filter(word => [...data.added, ...data.removed].join(' ').toLowerCase().includes(word))
        .map(word => word.charAt(0).toUpperCase() + word.slice(1));

    if (changedLines === 0 && data.similarity === 1) {
        return {
            overview: `v${data.version_b} matches v${data.version_a}; no textual changes were detected.`,
            notable_changes: ['No additions or removals were identified in the comparison.'],
            legal_topics: topics,
            review_guidance: 'No additional legal review appears necessary because no textual changes were detected.',
        };
    }

    return {
        overview: `Compared with v${data.version_a}, v${data.version_b} has ${data.added.length} added and ${data.removed.length} removed lines. Overall similarity is ${(data.similarity * 100).toFixed(1)}%.`,
        notable_changes: [
            ...(data.added[0] ? [`Added: ${data.added[0].slice(1)}`] : []),
            ...(data.removed[0] ? [`Removed: ${data.removed[0].slice(1)}`] : []),
        ],
        legal_topics: topics,
        review_guidance: topics.length > 0
            ? `Review the updated ${topics.slice(0, 3).join(', ').toLowerCase()} language before sharing this draft externally.`
            : 'A focused review should be enough because the edits appear limited in scope.',
    };
}

function highlightRisk(text: string) {
    const regex = new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi');
    if (!regex.test(text)) return <>{text}</>;
    return (
        <>
            {text.split(new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi')).map((chunk, index) =>
                RISK_WORDS.includes(chunk.toLowerCase()) ? (
                    <span
                        key={index}
                        style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            fontWeight: 700,
                            padding: '1px 4px',
                            borderRadius: '3px',
                            border: '1px solid #fde68a',
                        }}
                    >
                        {chunk}
                    </span>
                ) : (
                    chunk
                )
            )}
        </>
    );
}

export const VersionCompare = () => {
    const { id, v1, v2 } = useParams<{ id: string; v1: string; v2: string }>();
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [data, setData] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (id && v1 && v2) loadData();
    }, [id, v1, v2]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            const compareResult = await api.compareVersions(id!, parseInt(v1!, 10), parseInt(v2!, 10));
            setData(compareResult);

            try {
                const docs = await api.getDocuments();
                setDoc(docs.find(document => document.id === id) || null);
            } catch (lookupError) {
                console.error(lookupError);
                setDoc(null);
            }
        } catch (error) {
            console.error(error);
            setData(null);
            setDoc(null);
            if (error instanceof ApiError) {
                setError(error.message);
            } else if (error instanceof Error) {
                setError(error.message);
            } else {
                setError('Unable to load comparison data.');
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }} className="animate-pulse">
                Computing legal diff...
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: '64px', textAlign: 'center', color: 'var(--danger-text)' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Comparison data not found.</div>
                <div style={{ color: 'var(--text-muted)' }}>
                    {error || 'The selected document or versions could not be loaded from the current API.'}
                </div>
            </div>
        );
    }

    const simPct = (data.similarity * 100).toFixed(1);
    const isIdentical = data.similarity === 1;
    const changeLevel = data.similarity >= 0.98 ? 'minor' : data.similarity >= 0.8 ? 'moderate' : 'significant';
    const changeBadgeVariant = changeLevel === 'minor' ? 'success' : changeLevel === 'moderate' ? 'warning' : 'danger';
    const summary = data.summary ?? buildFallbackSummary(data);
    const docTitle = doc?.title || `Document ${id?.slice(0, 8) || ''}`;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            <div
                style={{
                    background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)',
                    borderRadius: 'var(--radius-xl)',
                    padding: '28px 32px',
                    boxShadow: 'var(--shadow-lg)',
                    color: '#fff',
                }}
            >
                <Link
                    to={`/documents/${id}`}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8125rem',
                        color: 'rgba(255,255,255,0.55)',
                        marginBottom: '16px',
                        textDecoration: 'none',
                    }}
                >
                    <ArrowLeft size={14} /> Back to Document
                </Link>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                            <GitCompareArrows size={22} color="var(--gold-400)" />
                            <h1
                                style={{
                                    fontSize: '1.6rem',
                                    fontWeight: 700,
                                    color: '#fff',
                                    fontFamily: 'var(--font-display)',
                                    letterSpacing: '-0.02em',
                                }}
                            >
                                Version Comparison
                            </h1>
                        </div>
                        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem' }}>{docTitle}</p>
                    </div>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'var(--bg-glass)',
                            border: '1px solid var(--border-navy)',
                            borderRadius: '10px',
                            padding: '10px 16px',
                        }}
                    >
                        <div style={{ textAlign: 'center' }}>
                            <div
                                style={{
                                    fontSize: '0.65rem',
                                    color: 'rgba(255,255,255,0.4)',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.1em',
                                    marginBottom: '2px',
                                }}
                            >
                                Comparing
                            </div>
                            <div
                                style={{
                                    fontSize: '1.1rem',
                                    fontWeight: 700,
                                    color: 'var(--gold-400)',
                                    fontFamily: 'var(--font-mono)',
                                }}
                            >
                                v{v1} to v{v2}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <MetricCard
                    title="Similarity Score"
                    value={`${simPct}%`}
                    icon={isIdentical ? <CheckCircle size={22} /> : <AlertTriangle size={22} />}
                    iconBg={isIdentical ? '#d1fae5' : data.similarity >= 0.8 ? '#fef9c3' : '#fee2e2'}
                    iconColor={isIdentical ? '#059669' : data.similarity >= 0.8 ? '#d97706' : '#dc2626'}
                    sub={<Badge variant={changeBadgeVariant}>{changeLevel} change</Badge>}
                />
                <MetricCard
                    title="Lines Added"
                    value={`+${data.added.length}`}
                    icon={<span style={{ fontSize: '1.1rem' }}>+</span>}
                    iconBg="rgb(220,252,231)"
                    iconColor="var(--diff-add-text)"
                    sub="insertions"
                />
                <MetricCard
                    title="Lines Removed"
                    value={`-${data.removed.length}`}
                    icon={<TrendingDown size={22} />}
                    iconBg="#fee2e2"
                    iconColor="var(--diff-del-text)"
                    sub="deletions"
                />
            </div>

            <div
                style={{
                    background: '#fffdf7',
                    border: '1px solid #f3e3b1',
                    borderRadius: 'var(--radius-xl)',
                    padding: '22px 24px',
                    boxShadow: 'var(--shadow-sm)',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div
                        style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: '#fff3cd',
                            color: '#9a6700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Sparkles size={18} />
                    </div>
                    <div>
                        <div
                            style={{
                                fontSize: '0.75rem',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                color: '#9a6700',
                                fontWeight: 700,
                            }}
                        >
                            AI-Assisted Summary
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#8a6d1f' }}>
                            Generated from diff patterns and legal clause keywords.
                        </div>
                    </div>
                </div>

                <p style={{ margin: '0 0 16px', color: '#3b2f14', fontSize: '0.95rem', lineHeight: 1.7 }}>
                    {summary.overview}
                </p>

                {summary.legal_topics.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                        {summary.legal_topics.map(topic => (
                            <Badge key={topic} variant="warning">
                                {topic}
                            </Badge>
                        ))}
                    </div>
                )}

                {summary.notable_changes.length > 0 && (
                    <div style={{ marginBottom: '14px' }}>
                        <div
                            style={{
                                fontSize: '0.78rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.08em',
                                color: '#8a6d1f',
                                fontWeight: 700,
                                marginBottom: '8px',
                            }}
                        >
                            Notable Changes
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {summary.notable_changes.map((item, index) => (
                                <div key={index} style={{ fontSize: '0.875rem', color: '#4b3b16', lineHeight: 1.6 }}>
                                    {item}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div
                    style={{
                        padding: '12px 14px',
                        borderRadius: '12px',
                        background: 'rgba(154,103,0,0.08)',
                        color: '#5c4711',
                        fontSize: '0.875rem',
                        lineHeight: 1.6,
                    }}
                >
                    {summary.review_guidance}
                </div>
            </div>

            <div
                style={{
                    background: '#fff',
                    border: '1px solid var(--border-light)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                }}
            >
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '14px 20px',
                        borderBottom: '1px solid var(--border-light)',
                        background: '#fafbff',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981' }} />
                        <span
                            style={{
                                marginLeft: '10px',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                color: 'var(--navy-700)',
                                fontFamily: 'var(--font-mono)',
                            }}
                        >
                            diff - v{v1} to v{v2}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                        <span style={{ color: 'var(--diff-add-text)', fontWeight: 600 }}>+{data.added.length} added</span>
                        <span style={{ color: 'var(--diff-del-text)', fontWeight: 600 }}>-{data.removed.length} removed</span>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    {data.diff.length === 0 ? (
                        <div style={{ padding: '48px', textAlign: 'center' }}>
                            <CheckCircle size={44} color="#10b981" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>These two versions are completely identical.</p>
                        </div>
                    ) : (
                        <div style={{ minWidth: 'fit-content' }}>
                            {data.diff.map((line, index) => {
                                if (line.startsWith('---') || line.startsWith('+++')) return null;
                                if (line.startsWith('@@')) {
                                    return (
                                        <div
                                            key={index}
                                            style={{
                                                background: '#eff6ff',
                                                color: '#1d4ed8',
                                                padding: '6px 20px',
                                                fontSize: '0.75rem',
                                                fontFamily: 'var(--font-mono)',
                                                borderTop: '1px solid #dbeafe',
                                                borderBottom: '1px solid #dbeafe',
                                            }}
                                        >
                                            {line}
                                        </div>
                                    );
                                }

                                const isAdded = line.startsWith('+');
                                const isRemoved = line.startsWith('-');

                                return (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            padding: '3px 0',
                                            background: isAdded ? 'var(--diff-add-bg)' : isRemoved ? 'var(--diff-del-bg)' : 'transparent',
                                            borderLeft: isAdded
                                                ? '3px solid var(--diff-add-text)'
                                                : isRemoved
                                                  ? '3px solid var(--diff-del-text)'
                                                  : '3px solid transparent',
                                            transition: 'background 0.1s',
                                        }}
                                        onMouseEnter={event => {
                                            if (!isAdded && !isRemoved) {
                                                event.currentTarget.style.background = 'var(--bg-hover)';
                                            }
                                        }}
                                        onMouseLeave={event => {
                                            if (!isAdded && !isRemoved) {
                                                event.currentTarget.style.background = 'transparent';
                                            }
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                padding: '0 12px',
                                                textAlign: 'center',
                                                flexShrink: 0,
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.8rem',
                                                color: isAdded ? 'var(--diff-add-text)' : isRemoved ? 'var(--diff-del-text)' : 'var(--text-lighter)',
                                                userSelect: 'none',
                                                fontWeight: 600,
                                            }}
                                        >
                                            {isAdded ? '+' : isRemoved ? '-' : ' '}
                                        </div>
                                        <div
                                            style={{
                                                fontFamily: 'var(--font-mono)',
                                                fontSize: '0.8125rem',
                                                color: isAdded ? 'var(--diff-add-text)' : isRemoved ? 'var(--diff-del-text)' : 'var(--text-main)',
                                                whiteSpace: 'pre-wrap',
                                                flex: 1,
                                                padding: '0 16px 0 0',
                                                lineHeight: 1.7,
                                            }}
                                        >
                                            {isAdded || isRemoved ? highlightRisk(line.slice(1)) : line}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {(data.added.length > 0 || data.removed.length > 0) && (() => {
                const allChangedLines = [...data.added, ...data.removed].join(' ').toLowerCase();
                const foundRisks = RISK_WORDS.filter(word => allChangedLines.includes(word));
                if (foundRisks.length === 0) return null;

                return (
                    <div
                        style={{
                            padding: '16px 20px',
                            background: '#fffbeb',
                            border: '1px solid #fde68a',
                            borderRadius: 'var(--radius-lg)',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                        }}
                    >
                        <AlertTriangle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: '1px' }} />
                        <div>
                            <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#92400e', marginBottom: '4px' }}>
                                Legal Risk Keywords Detected
                            </div>
                            <div style={{ fontSize: '0.8125rem', color: '#78350f' }}>
                                The following high-risk terms appear in the changed sections:{' '}
                                {foundRisks.map(word => (
                                    <Badge key={word} variant="warning" style={{ marginRight: '4px' }}>
                                        {word}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

function MetricCard({
    title,
    value,
    icon,
    iconBg,
    iconColor,
    sub,
}: {
    title: string;
    value: string;
    icon: ReactNode;
    iconBg: string;
    iconColor: string;
    sub: ReactNode;
}) {
    return (
        <div
            style={{
                background: '#fff',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-xl)',
                padding: '20px 22px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
            }}
        >
            <div
                style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '12px',
                    background: iconBg,
                    color: iconColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: '1.25rem',
                }}
            >
                {icon}
            </div>
            <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                    {title}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--navy-900)', lineHeight: 1, marginBottom: '6px' }}>
                    {value}
                </div>
                <div>{sub}</div>
            </div>
        </div>
    );
}
