import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Clock, User, FolderOpen, TrendingUp, Shield } from 'lucide-react';
import { api } from '../api/client';
import type { DocumentResponse } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import mammoth from 'mammoth/mammoth.browser';

export const Dashboard = () => {
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Create Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newUser, setNewUser] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        try {
            setError(null);
            const docs = await api.getDocuments();
            setDocuments(docs);
        } catch (err) {
            setError('Unable to reach the backend. Is the server running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim() || !newUser.trim()) return;
        setCreating(true);
        try {
            await api.createDocument({ title: newTitle, content: newContent, created_by: newUser });
            setIsModalOpen(false);
            setNewTitle(''); setNewContent(''); setNewUser('');
            fetchDocuments();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error creating document');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const user = prompt('Enter your name to confirm deletion:');
        if (!user) return;
        if (confirm('Soft-delete this document? History will be preserved.')) {
            try {
                await api.deleteDocument(id, user);
                fetchDocuments();
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Error deleting document');
            }
        }
    };

    const stats = [
        { label: 'Total Documents', value: documents.length, icon: <FolderOpen size={20} />, color: 'var(--navy-500)' },
        { label: 'Active Today', value: documents.filter(d => new Date(d.updated_at).toDateString() === new Date().toDateString()).length, icon: <TrendingUp size={20} />, color: 'var(--gold-500)' },
        { label: 'Version Controlled', value: documents.length, icon: <Shield size={20} />, color: '#059669' },
    ];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── Page Header ──────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--gold-500)' }}>
                            Document Workspace
                        </span>
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--navy-900)', letterSpacing: '-0.03em', fontFamily: 'var(--font-display)' }}>
                        Matter Repository
                    </h1>
                    <p style={{ color: 'var(--text-muted)', marginTop: '6px', fontSize: '0.9rem' }}>
                        Manage all legal documents with immutable version history and full traceability.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} size="md">
                    <Plus size={16} strokeWidth={2.5} />
                    New Document
                </Button>
            </div>

            {/* ── Stats Bar ────────────────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                {stats.map((s) => (
                    <div key={s.label} style={{
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        borderRadius: 'var(--radius-xl)',
                        padding: '20px 22px',
                        display: 'flex', alignItems: 'center', gap: '16px',
                        boxShadow: 'var(--shadow-sm)',
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '44px', height: '44px', borderRadius: '10px',
                            background: `${s.color}15`,
                            color: s.color, flexShrink: 0,
                        }}>
                            {s.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--navy-900)', lineHeight: 1.1 }}>{s.value}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Error / Loading ──────────────────────────────────────── */}
            {error && (
                <div style={{ padding: '16px 20px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 'var(--radius-lg)', color: 'var(--danger-text)', fontSize: '0.875rem' }}>
                    ⚠️ {error}
                </div>
            )}

            {loading ? (
                <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚖️</div>
                    Loading documents...
                </div>
            ) : documents.length === 0 ? (
                /* ── Empty State ── */
                <div style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    padding: '64px 24px', textAlign: 'center',
                    background: '#ffffff', border: '2px dashed var(--border-light)',
                    borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-sm)',
                }}>
                    <div style={{
                        width: '64px', height: '64px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, var(--navy-800), var(--navy-600))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '20px', boxShadow: 'var(--shadow-md)',
                    }}>
                        <FileText size={28} color="var(--gold-400)" />
                    </div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-800)', marginBottom: '8px' }}>
                        No documents yet
                    </h3>
                    <p style={{ color: 'var(--text-muted)', maxWidth: '360px', marginBottom: '28px', fontSize: '0.9rem' }}>
                        Create your first document to begin tracking versions with full legal traceability.
                    </p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus size={16} /> Create First Document
                    </Button>
                </div>
            ) : (
                /* ── Document Grid ── */
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            {documents.length} document{documents.length !== 1 ? 's' : ''} on record
                        </h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {documents.map((doc) => (
                            <DocumentCard key={doc.id} doc={doc} onDelete={handleDelete} />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Create Modal ─────────────────────────────────────────── */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Legal Document" subtitle="A version 1 will be created automatically.">
                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px' }}>Document Title</label>
                        <input
                            required
                            placeholder="e.g., Non-Disclosure Agreement — Q4 2025"
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px' }}>Authored By</label>
                        <input
                            required
                            placeholder="Full name or department"
                            value={newUser}
                            onChange={e => setNewUser(e.target.value)}
                        />
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ margin: 0 }}>Initial Content</label>
                            <label style={{ fontSize: '0.75rem', color: 'var(--navy-500)', cursor: 'pointer', fontWeight: 600 }}>
                                <input type="file" accept=".txt,.docx" style={{ display: 'none' }} onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;

                                    if (file.name.endsWith('.docx')) {
                                        const r = new FileReader();
                                        r.onload = async (ev) => {
                                            try {
                                                const res = await mammoth.extractRawText({ arrayBuffer: ev.target?.result as ArrayBuffer });
                                                setNewContent(res.value);
                                            } catch (err) {
                                                alert("Error extracting text from DOCX");
                                            }
                                        };
                                        r.readAsArrayBuffer(file);
                                    } else {
                                        const r = new FileReader();
                                        r.onload = ev => setNewContent(ev.target?.result as string);
                                        r.readAsText(file);
                                    }
                                }} />
                                📎 Upload .txt or .docx file
                            </label>
                        </div>
                        <textarea
                            required
                            rows={7}
                            placeholder="Paste the document text here or upload a .txt file..."
                            value={newContent}
                            onChange={e => setNewContent(e.target.value)}
                            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? 'Creating...' : <><Plus size={15} /> Create Document</>}
                        </Button>
                    </div>
                </form>
            </Modal>

        </div>
    );
};

/* ══════════════════════════════════════════════════════════════════════════
   Document Card
   ══════════════════════════════════════════════════════════════════════════ */
function DocumentCard({ doc, onDelete }: { doc: DocumentResponse; onDelete: (id: string, e: React.MouseEvent) => void }) {
    const [hovered, setHovered] = useState(false);

    return (
        <Link
            to={`/documents/${doc.id}`}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                display: 'flex', flexDirection: 'column',
                background: '#ffffff',
                border: `1.5px solid ${hovered ? 'var(--navy-400)' : 'var(--border-light)'}`,
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                transform: hovered ? 'translateY(-2px)' : 'none',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Top accent line on hover */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, var(--navy-700), var(--gold-500))',
                opacity: hovered ? 1 : 0,
                transition: 'opacity 0.2s ease',
            }} />

            {/* Card header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0,
                    background: hovered ? 'linear-gradient(135deg, var(--navy-800), var(--navy-600))' : '#f4f6fa',
                    transition: 'background 0.2s',
                }}>
                    <FileText size={18} color={hovered ? 'var(--gold-400)' : 'var(--navy-500)'} />
                </div>
                <button
                    onClick={e => onDelete(doc.id, e)}
                    style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '6px',
                        background: 'transparent', border: 'none',
                        color: 'var(--text-lighter)',
                        cursor: 'pointer',
                        opacity: hovered ? 1 : 0,
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                        e.currentTarget.style.background = 'var(--danger-bg)';
                        e.currentTarget.style.color = 'var(--danger-text)';
                    }}
                    onMouseLeave={e => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = 'var(--text-lighter)';
                    }}
                    title="Soft-delete document"
                >
                    <Trash2 size={14} />
                </button>
            </div>

            {/* Title */}
            <h3 style={{
                fontSize: '0.9375rem', fontWeight: 600,
                color: 'var(--navy-800)', lineHeight: 1.35,
                marginBottom: '12px',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
            }}>
                {doc.title}
            </h3>

            {/* Meta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <User size={12} />
                    <span>{doc.created_by}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    <Clock size={12} />
                    <span>{new Date(doc.updated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </div>
            </div>

            {/* Footer */}
            <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Badge variant="navy">Active</Badge>
                <span style={{ fontSize: '0.75rem', color: hovered ? 'var(--navy-500)' : 'var(--text-lighter)', fontWeight: 500, transition: 'color 0.15s' }}>
                    View →
                </span>
            </div>
        </Link>
    );
}
