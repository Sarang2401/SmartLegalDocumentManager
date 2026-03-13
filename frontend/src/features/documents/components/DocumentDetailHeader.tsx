import type { ReactNode } from 'react';
import { ArrowLeft, Clock, Edit2, FileText, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import type { DocumentResponse } from '../../../types';

function StatChip({ label, value }: { label: string; value: ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>{value}</div>
        </div>
    );
}

interface DocumentDetailHeaderProps {
    doc: DocumentResponse;
    versionsCount: number;
    highestVersion: number;
    onOpenTitle: () => void;
    onOpenTimeline: () => void;
    onOpenUpload: () => void;
}

export function DocumentDetailHeader({
    doc,
    versionsCount,
    highestVersion,
    onOpenTitle,
    onOpenTimeline,
    onOpenUpload,
}: DocumentDetailHeaderProps) {
    return (
        <div style={{ background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', boxShadow: 'var(--shadow-lg)', color: '#fff' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', marginBottom: '16px', textDecoration: 'none' }}>
                <ArrowLeft size={14} /> Back to Matter Repository
            </Link>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{doc.title}</h1>
                        <button
                            onClick={onOpenTitle}
                            title="Edit title"
                            style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-navy)', borderRadius: '6px', padding: '4px 6px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
                            onMouseEnter={event => { event.currentTarget.style.background = 'var(--bg-glass-hover)'; event.currentTarget.style.color = '#fff'; }}
                            onMouseLeave={event => { event.currentTarget.style.background = 'var(--bg-glass)'; event.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
                        >
                            <Edit2 size={13} />
                        </button>
                    </div>
                    <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={13} /> {doc.id.split('-')[0]}...</span>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={13} /> {new Date(doc.updated_at).toLocaleString()}</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <Button variant="ghost" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-navy)', color: '#fff' }} onClick={onOpenTimeline}>
                        <Clock size={15} /> Timeline
                    </Button>
                    <Button onClick={onOpenUpload}>
                        <Upload size={15} /> Upload Version
                    </Button>
                </div>
            </div>
            <div style={{ height: '1px', background: 'var(--border-navy)', margin: '20px 0' }} />
            <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                <StatChip label="Total Versions" value={versionsCount} />
                <StatChip label="Latest Version" value={`v${highestVersion}`} />
                <StatChip label="Status" value={<Badge variant="success">Active</Badge>} />
            </div>
        </div>
    );
}
