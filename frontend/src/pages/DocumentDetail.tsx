import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { VersionResponse, AuditLogResponse, DocumentResponse, CompareResponse } from '../types';
import { ArrowLeft, Upload, Edit2, FileText, Clock, FileWarning, RotateCcw, Eye, GitCompareArrows, AlertTriangle } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

const RISK_WORDS = ['payment', 'liability', 'termination', 'confidentiality', 'indemnity', 'penalty'];

function highlightRisk(text: string) {
    const regex = new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi');
    if (!regex.test(text)) return text;
    return text.split(new RegExp(`(\\b(?:${RISK_WORDS.join('|')})\\b)`, 'gi')).map((c, i) =>
        RISK_WORDS.includes(c.toLowerCase())
            ? <span key={i} style={{ background: '#fef3c7', color: '#92400e', fontWeight: 700, padding: '0 3px', borderRadius: '3px', border: '1px solid #fde68a' }}>{c}</span>
            : c
    );
}

function StatChip({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '3px' }}>{label}</div>
            <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff' }}>{value}</div>
        </div>
    );
}

function actionColor(a: string) {
    if (a.includes('DELETE')) return '#ef4444';
    if (a.includes('CREATE')) return '#10b981';
    if (a.includes('RESTORE')) return '#8b5cf6';
    return '#3b82f6';
}

export const DocumentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [versions, setVersions] = useState<VersionResponse[]>([]);
    const [timeline, setTimeline] = useState<AuditLogResponse[]>([]);
    const [loading, setLoading] = useState(true);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isTitleOpen, setIsTitleOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    const [content, setContent] = useState('');
    const [user, setUser] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [previewDiff, setPreviewDiff] = useState<CompareResponse | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

    useEffect(() => { if (id) loadData(); }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const docs = await api.getDocuments();
            const cur = docs.find(d => d.id === id);
            if (cur) { setDoc(cur); setNewTitle(cur.title); }
            const [vData, tData] = await Promise.all([api.getVersions(id!), api.getTimeline(id!)]);
            setVersions(vData); setTimeline(tData);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handlePreview = async () => {
        if (!content.trim()) return;
        setIsPreviewLoading(true);
        try { setPreviewDiff(await api.previewDiff(id!, { content })); }
        catch (e) { alert(e instanceof Error ? e.message : 'Preview failed'); }
        finally { setIsPreviewLoading(false); }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user.trim()) return;
        try {
            await api.uploadVersion(id!, { content, modified_by: user });
            setIsUploadOpen(false); setContent(''); setUser(''); setPreviewDiff(null);
            loadData();
        } catch (e) { alert(e instanceof Error ? e.message : 'Upload failed'); }
    };

    const handleRestore = async (vNum: number) => {
        const r = prompt('Enter your name to confirm restoration:');
        if (!r?.trim()) return;
        try { await api.restoreVersion(id!, vNum, { restored_by: r }); loadData(); }
        catch (e) { alert(e instanceof Error ? e.message : 'Restore failed'); }
    };

    const handleUpdateTitle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !user.trim()) return;
        try {
            await api.updateTitle(id!, { title: newTitle, modified_by: user });
            setIsTitleOpen(false); setUser(''); loadData();
        } catch (e) { alert(e instanceof Error ? e.message : 'Update failed'); }
    };

    const toggleCompare = (n: number) => {
        if (selectedVersions.includes(n)) setSelectedVersions(sv => sv.filter(v => v !== n));
        else if (selectedVersions.length < 2) setSelectedVersions(sv => [...sv, n]);
    };

    if (loading) return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading document…</div>;
    if (!doc) return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--danger-text)' }}>Document not found.</div>;

    const highestVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) : 1;
    const compareReady = selectedVersions.length === 2;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg, var(--navy-900) 0%, var(--navy-700) 100%)', borderRadius: 'var(--radius-xl)', padding: '28px 32px', boxShadow: 'var(--shadow-lg)', color: '#fff' }}>
                <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', marginBottom: '16px', textDecoration: 'none' }}>
                    <ArrowLeft size={14} /> Back to Matter Repository
                </Link>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>{doc.title}</h1>
                            <button onClick={() => setIsTitleOpen(true)} title="Edit title"
                                style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-navy)', borderRadius: '6px', padding: '4px 6px', color: 'rgba(255,255,255,0.55)', cursor: 'pointer' }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-glass-hover)'; e.currentTarget.style.color = '#fff'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}>
                                <Edit2 size={13} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', gap: '20px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px' }}><FileText size={13} /> {doc.id.split('-')[0]}…</span>
                            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '5px' }}><Clock size={13} /> {new Date(doc.updated_at).toLocaleString()}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <Button variant="ghost" style={{ background: 'var(--bg-glass)', border: '1px solid var(--border-navy)', color: '#fff' }} onClick={() => setIsTimelineOpen(true)}>
                            <Clock size={15} /> Timeline
                        </Button>
                        <Button onClick={() => { setPreviewDiff(null); setIsUploadOpen(true); }}>
                            <Upload size={15} /> Upload Version
                        </Button>
                    </div>
                </div>
                <div style={{ height: '1px', background: 'var(--border-navy)', margin: '20px 0' }} />
                <div style={{ display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
                    <StatChip label="Total Versions" value={versions.length} />
                    <StatChip label="Latest Version" value={`v${highestVersion}`} />
                    <StatChip label="Status" value={<Badge variant="success">Active</Badge>} />
                </div>
            </div>

            {/* Compare Toolbar */}
            {selectedVersions.length > 0 && (
                <div className="animate-slide-down" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: compareReady ? '#eff6ff' : '#fffbeb', border: `1.5px solid ${compareReady ? '#93c5fd' : '#fde68a'}`, borderRadius: 'var(--radius-lg)', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: compareReady ? '#1d4ed8' : '#854d0e', fontWeight: 500 }}>
                        <FileWarning size={17} />
                        {compareReady ? `Compare v${selectedVersions[0]} and v${selectedVersions[1]}` : `v${selectedVersions[0]} selected — pick one more`}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedVersions([])}>Cancel</Button>
                        <Link to={compareReady ? `/documents/${id}/compare/${Math.min(...selectedVersions)}/${Math.max(...selectedVersions)}` : '#'} style={{ pointerEvents: compareReady ? 'auto' : 'none', opacity: compareReady ? 1 : 0.5, textDecoration: 'none' }}>
                            <Button size="sm"><GitCompareArrows size={14} /> Compare</Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Version History */}
            <div>
                <h2 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    Version History — {versions.length} version{versions.length !== 1 ? 's' : ''}
                </h2>
                <div style={{ background: '#fff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
                    <ul style={{ listStyle: 'none' }}>
                        {[...versions].reverse().map((v, i) => {
                            const isLatest = v.version_number === highestVersion;
                            const isSelected = selectedVersions.includes(v.version_number);
                            return (
                                <li key={v.id} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '20px 24px', borderBottom: i < versions.length - 1 ? '1px solid var(--border-light)' : 'none', background: isSelected ? '#eff6ff' : '#fff', transition: 'background 0.15s' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                        <input type="checkbox" checked={isSelected} onChange={() => toggleCompare(v.version_number)} disabled={!isSelected && selectedVersions.length >= 2}
                                            style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--navy-500)', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy-800)' }}>Version {v.version_number}</span>
                                                {isLatest && <Badge variant="gold">Latest</Badge>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                                Uploaded by <strong style={{ color: 'var(--navy-700)' }}>{v.created_by}</strong> on {new Date(v.created_at).toLocaleString()}
                                            </div>
                                            <div style={{ marginTop: '10px', padding: '12px 14px', background: '#fafbff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', maxHeight: '120px', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                {v.content}
                                            </div>
                                        </div>
                                        {!isLatest && (
                                            <div style={{ flexShrink: 0 }}>
                                                <Button variant="secondary" size="sm" onClick={() => handleRestore(v.version_number)}><RotateCcw size={13} /> Restore</Button>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Upload Modal */}
            <Modal isOpen={isUploadOpen} onClose={() => { setIsUploadOpen(false); setPreviewDiff(null); }}
                title={previewDiff ? 'Review Changes Before Upload' : 'Upload New Version'}
                subtitle={previewDiff ? `${previewDiff.added.length} additions · ${previewDiff.removed.length} removals · ${(previewDiff.similarity * 100).toFixed(1)}% similarity` : 'Content stored as an immutable version.'}
                width="660px">
                <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    {!previewDiff ? (
                        <>
                            <div><label style={{ display: 'block', marginBottom: '6px' }}>Modified By</label><input required placeholder="Name or department" value={user} onChange={e => setUser(e.target.value)} /></div>
                            <div><label style={{ display: 'block', marginBottom: '6px' }}>Document Content</label><textarea required rows={10} value={content} onChange={e => setContent(e.target.value)} style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }} /></div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                                <Button type="button" variant="secondary" onClick={handlePreview} disabled={isPreviewLoading || !content.trim()}>{isPreviewLoading ? 'Loading…' : <><Eye size={14} /> Preview Diff</>}</Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div style={{ padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#1e40af', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                                <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span><strong>Change Summary:</strong> {previewDiff.added.length} lines added, {previewDiff.removed.length} lines removed. Risk keywords highlighted.</span>
                            </div>
                            <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '40vh', overflowY: 'auto' }}>
                                <div style={{ background: '#1e293b', padding: '8px 14px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Latest → Preview</div>
                                <div style={{ background: '#1e293b' }}>
                                    {previewDiff.diff.length === 0
                                        ? <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No differences detected.</div>
                                        : previewDiff.diff.map((line, i) => {
                                            if (line.startsWith('---') || line.startsWith('+++')) return null;
                                            if (line.startsWith('@@')) return <div key={i} style={{ color: '#60a5fa', padding: '4px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{line}</div>;
                                            const isA = line.startsWith('+'), isR = line.startsWith('-');
                                            return <div key={i} style={{ display: 'flex', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', padding: '2px 14px', background: isA ? 'rgba(74,222,128,0.1)' : isR ? 'rgba(248,113,113,0.12)' : 'transparent', color: isA ? '#4ade80' : isR ? '#f87171' : '#94a3b8' }}>
                                                <span style={{ width: '14px', flexShrink: 0 }}>{isA ? '+' : isR ? '−' : ' '}</span>
                                                <span style={{ whiteSpace: 'pre-wrap' }}>{(isA || isR) ? highlightRisk(line.slice(1)) : line}</span>
                                            </div>;
                                        })}
                                </div>
                            </div>
                            {!user && <div><label style={{ display: 'block', marginBottom: '6px' }}>Modified By</label><input required placeholder="Your name" value={user} onChange={e => setUser(e.target.value)} /></div>}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <Button type="button" variant="ghost" onClick={() => setPreviewDiff(null)}>← Edit Content</Button>
                                <Button type="submit"><Upload size={14} /> Confirm Upload</Button>
                            </div>
                        </>
                    )}
                </form>
            </Modal>

            {/* Edit Title Modal */}
            <Modal isOpen={isTitleOpen} onClose={() => setIsTitleOpen(false)} title="Update Document Title">
                <form onSubmit={handleUpdateTitle} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div><label style={{ display: 'block', marginBottom: '6px' }}>New Title</label><input required value={newTitle} onChange={e => setNewTitle(e.target.value)} /></div>
                    <div><label style={{ display: 'block', marginBottom: '6px' }}>Modified By</label><input required placeholder="Your name" value={user} onChange={e => setUser(e.target.value)} /></div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsTitleOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Title</Button>
                    </div>
                </form>
            </Modal>

            {/* Timeline Modal */}
            <Modal isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} title="Activity Timeline" subtitle="Chronological audit trail for this document." width="520px">
                <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                    {timeline.length === 0
                        ? <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No activity yet.</p>
                        : <div style={{ position: 'relative', paddingLeft: '28px' }}>
                            <div style={{ position: 'absolute', left: '8px', top: '8px', bottom: '8px', width: '2px', background: 'var(--border-light)' }} />
                            {timeline.map(log => (
                                <div key={log.id} style={{ position: 'relative', marginBottom: '16px' }}>
                                    <div style={{ position: 'absolute', left: '-24px', top: '4px', width: '14px', height: '14px', borderRadius: '50%', background: actionColor(log.action), border: '2px solid #fff', boxShadow: `0 0 0 2px ${actionColor(log.action)}40` }} />
                                    <div style={{ background: '#fafbff', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '10px 14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--navy-800)', textTransform: 'capitalize' }}>{log.action.replace(/_/g, ' ').toLowerCase()}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-lighter)', fontFamily: 'var(--font-mono)' }}>{new Date(log.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
                                        </div>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>by <strong style={{ color: 'var(--navy-700)' }}>{log.user}</strong></span>
                                        {log.version_id && <div style={{ marginTop: '6px' }}><Badge variant="navy">Version attached</Badge></div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            </Modal>
        </div>
    );
};
