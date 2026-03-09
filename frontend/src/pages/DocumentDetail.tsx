import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import type { VersionResponse, AuditLogResponse, DocumentResponse } from '../types';
import { ArrowLeft, Upload, Edit2, FileText, Clock, FileWarning } from 'lucide-react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export const DocumentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [versions, setVersions] = useState<VersionResponse[]>([]);
    const [timeline, setTimeline] = useState<AuditLogResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isTitleOpen, setIsTitleOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    // Form states
    const [content, setContent] = useState('');
    const [user, setUser] = useState('');
    const [newTitle, setNewTitle] = useState('');

    // Comparison State
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const docs = await api.getDocuments();
            const currentDoc = docs.find(d => d.id === id);
            if (currentDoc) {
                setDoc(currentDoc);
                setNewTitle(currentDoc.title);
            }

            const [vData, tData] = await Promise.all([
                api.getVersions(id!),
                api.getTimeline(id!)
            ]);
            setVersions(vData);
            setTimeline(tData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim() || !user.trim()) return;

        try {
            await api.uploadVersion(id!, { content, modified_by: user });
            setIsUploadOpen(false);
            setContent('');
            setUser('');
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Upload failed');
        }
    };

    const handleUpdateTitle = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !user.trim()) return;

        try {
            await api.updateTitle(id!, { title: newTitle, modified_by: user });
            setIsTitleOpen(false);
            setUser('');
            loadData();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Update failed');
        }
    };

    const toggleCompareSelect = (vNumber: number) => {
        if (selectedVersions.includes(vNumber)) {
            setSelectedVersions(selectedVersions.filter(v => v !== vNumber));
        } else if (selectedVersions.length < 2) {
            setSelectedVersions([...selectedVersions, vNumber]);
        }
    };

    const formatAction = (action: string) => {
        return action.replace(/_/g, ' ').toLowerCase();
    };

    if (loading) return <div className="py-12 text-center text-gray-500">Loading document details...</div>;
    if (!doc) return <div className="py-12 text-center text-red-500">Document not found</div>;

    const compareReady = selectedVersions.length === 2;
    const highestVersion = Math.max(...versions.map(v => v.version_number));

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-[color:var(--border-light)] pb-6 md:flex-row md:items-center md:justify-between">
                <div>
                    <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-[color:var(--text-muted)] hover:text-[color:var(--primary)]">
                        <ArrowLeft size={16} /> Back to Documents
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight text-[color:var(--text-main)]">{doc.title}</h1>
                        <button
                            onClick={() => setIsTitleOpen(true)}
                            className="rounded-md p-1.5 text-[color:var(--text-muted)] hover:bg-[color:var(--bg-hover)] hover:text-[color:var(--text-main)] transition-colors"
                        >
                            <Edit2 size={16} />
                        </button>
                    </div>
                    <div className="mt-2 flex items-center gap-4 text-sm text-[color:var(--text-muted)]">
                        <span className="flex items-center gap-1.5"><FileText size={14} /> ID: {doc.id.split('-')[0]}...</span>
                        <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(doc.updated_at).toLocaleString()}</span>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <Button variant="secondary" onClick={() => setIsTimelineOpen(true)} className="gap-2">
                        <Clock size={16} /> View Timeline
                    </Button>
                    <Button onClick={() => setIsUploadOpen(true)} className="gap-2">
                        <Upload size={16} /> Upload New Version
                    </Button>
                </div>
            </div>

            {/* Comparison Toolbar */}
            {selectedVersions.length > 0 && (
                <div className="flex items-center justify-between rounded-lg border border-[color:var(--border-light)] bg-[color:var(--warning-bg)] p-4 shadow-sm animate-slide-up">
                    <div className="flex items-center gap-2 text-sm text-[color:var(--warning-text)]">
                        <FileWarning size={18} />
                        {compareReady
                            ? `Ready to compare v${selectedVersions[0]} and v${selectedVersions[1]}`
                            : 'Select one more version to compare'}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedVersions([])}>Cancel</Button>
                        <Link
                            to={compareReady ? `/documents/${id}/compare/${Math.min(...selectedVersions)}/${Math.max(...selectedVersions)}` : '#'}
                            className="pointer-events-auto"
                            style={{ pointerEvents: compareReady ? 'auto' : 'none', opacity: compareReady ? 1 : 0.5 }}
                        >
                            <Button size="sm">Compare Selected</Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Version List */}
            <div>
                <h2 className="mb-4 text-lg font-semibold text-[color:var(--text-main)]">Version History</h2>
                <div className="rounded-xl border border-[color:var(--border-light)] bg-white shadow-[color:var(--shadow-sm)] overflow-hidden">
                    <ul className="divide-y divide-[color:var(--border-light)]">
                        {[...versions].reverse().map((v) => {
                            const isSelected = selectedVersions.includes(v.version_number);
                            const isLatest = v.version_number === highestVersion;
                            return (
                                <li
                                    key={v.id}
                                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-5 transition-colors hover:bg-[color:var(--bg-hover)] gap-4 ${isSelected ? 'bg-blue-50/50' : ''}`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="flex mt-0.5">
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleCompareSelect(v.version_number)}
                                                disabled={!isSelected && selectedVersions.length >= 2}
                                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 mt-1 cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-[color:var(--text-main)]">Version {v.version_number}</span>
                                                {isLatest && <Badge variant="success">Latest</Badge>}
                                            </div>
                                            <div className="mt-1 text-sm text-[color:var(--text-muted)]">
                                                Uploaded by <span className="font-medium text-[color:var(--text-main)]">{v.created_by}</span> on {new Date(v.created_at).toLocaleString()}
                                            </div>
                                            <div className="mt-3 rounded bg-[color:var(--bg-subtle)] p-3 text-xs font-mono text-[color:var(--text-main)] max-h-32 overflow-y-auto w-full sm:max-w-xl whitespace-pre-wrap border border-[color:var(--border-light)]">
                                                {v.content}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            </div>

            {/* Modals */}
            <Modal isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} title="Upload New Version">
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-main)] mb-1">Modified By</label>
                        <input required className="w-full" placeholder="Your name or department" value={user} onChange={e => setUser(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-main)] mb-1">Document Content</label>
                        <textarea required className="w-full" rows={8} placeholder="Paste the updated document text here..." value={content} onChange={e => setContent(e.target.value)} />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
                        <Button type="submit">Upload Version</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTitleOpen} onClose={() => setIsTitleOpen(false)} title="Update Document Title">
                <form onSubmit={handleUpdateTitle} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-main)] mb-1">New Title</label>
                        <input required className="w-full" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-[color:var(--text-main)] mb-1">Modified By</label>
                        <input required className="w-full" placeholder="Your name" value={user} onChange={e => setUser(e.target.value)} />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsTitleOpen(false)}>Cancel</Button>
                        <Button type="submit">Save Changes</Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isTimelineOpen} onClose={() => setIsTimelineOpen(false)} title="Document Activity Timeline">
                <div className="max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                    {timeline.length === 0 ? (
                        <p className="text-gray-500">No activity recorded.</p>
                    ) : (
                        <div className="relative border-l border-gray-200 ml-3 space-y-6 pb-4">
                            {timeline.map((log) => (
                                <div key={log.id} className="relative pl-6">
                                    <span className="absolute -left-[5px] top-1.5 h-[9px] w-[9px] rounded-full ring-4 ring-white bg-[color:var(--primary)]" />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-semibold capitalize text-[color:var(--text-main)]">{formatAction(log.action)}</span>
                                        <span className="text-sm text-[color:var(--text-muted)]">by {log.user} on {new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Modal>

        </div>
    );
};
