import type { FormEvent } from 'react';
import { AlertTriangle, Eye, Upload } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';
import type { CompareResponse } from '../../../types';
import { readLegalDocumentFile } from '../utils/fileParsing';
import { highlightRisk } from '../utils/documentAnnotations';

interface UploadVersionModalProps {
    isOpen: boolean;
    content: string;
    user: string;
    previewDiff: CompareResponse | null;
    isPreviewLoading: boolean;
    onClose: () => void;
    onContentChange: (value: string) => void;
    onUserChange: (value: string) => void;
    onPreview: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onResetPreview: () => void;
}

export function UploadVersionModal({
    isOpen,
    content,
    user,
    previewDiff,
    isPreviewLoading,
    onClose,
    onContentChange,
    onUserChange,
    onPreview,
    onSubmit,
    onResetPreview,
}: UploadVersionModalProps) {
    const subtitle = previewDiff
        ? `${previewDiff.added.length} additions - ${previewDiff.removed.length} removals - ${(previewDiff.similarity * 100).toFixed(1)}% similarity`
        : 'Content stored as an immutable version.';

    const handleFileSelect = async (file?: File) => {
        if (!file) return;

        try {
            onContentChange(await readLegalDocumentFile(file));
        } catch (error) {
            alert(error instanceof Error ? error.message : 'Error extracting text from uploaded file');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={previewDiff ? 'Review Changes Before Upload' : 'Upload New Version'}
            subtitle={subtitle}
            width="660px"
        >
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {!previewDiff ? (
                    <>
                        <div>
                            <label style={{ display: 'block', marginBottom: '6px' }}>Modified By</label>
                            <input required placeholder="Name or department" value={user} onChange={event => onUserChange(event.target.value)} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <label style={{ margin: 0 }}>Document Content</label>
                                <label style={{ fontSize: '0.75rem', color: 'var(--navy-500)', cursor: 'pointer', fontWeight: 600 }}>
                                    <input
                                        type="file"
                                        accept=".txt,.docx"
                                        style={{ display: 'none' }}
                                        onChange={event => handleFileSelect(event.target.files?.[0])}
                                    />
                                    Upload .txt or .docx file
                                </label>
                            </div>
                            <textarea
                                required
                                rows={10}
                                placeholder="Paste document content or upload a .txt / .docx file..."
                                value={content}
                                onChange={event => onContentChange(event.target.value)}
                                style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}
                            />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="button" variant="secondary" onClick={onPreview} disabled={isPreviewLoading || !content.trim()}>
                                {isPreviewLoading ? 'Loading...' : <><Eye size={14} /> Preview Diff</>}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div style={{ padding: '12px 14px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', color: '#1e40af', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                            <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
                            <span><strong>Change Summary:</strong> {previewDiff.added.length} lines added, {previewDiff.removed.length} lines removed. Risk keywords highlighted.</span>
                        </div>
                        <div style={{ border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', overflow: 'hidden', maxHeight: '40vh', overflowY: 'auto' }}>
                            <div style={{ background: '#1e293b', padding: '8px 14px', fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>Latest - Preview</div>
                            <div style={{ background: '#1e293b' }}>
                                {previewDiff.diff.length === 0 ? (
                                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontStyle: 'italic' }}>No differences detected.</div>
                                ) : (
                                    previewDiff.diff.map((line, index) => {
                                        if (line.startsWith('---') || line.startsWith('+++')) return null;
                                        if (line.startsWith('@@')) {
                                            return <div key={index} style={{ color: '#60a5fa', padding: '4px 14px', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{line}</div>;
                                        }

                                        const isAdded = line.startsWith('+');
                                        const isRemoved = line.startsWith('-');

                                        return (
                                            <div
                                                key={index}
                                                style={{
                                                    display: 'flex',
                                                    fontFamily: 'var(--font-mono)',
                                                    fontSize: '0.8rem',
                                                    padding: '2px 14px',
                                                    background: isAdded ? 'rgba(74,222,128,0.1)' : isRemoved ? 'rgba(248,113,113,0.12)' : 'transparent',
                                                    color: isAdded ? '#4ade80' : isRemoved ? '#f87171' : '#94a3b8',
                                                }}
                                            >
                                                <span style={{ width: '14px', flexShrink: 0 }}>{isAdded ? '+' : isRemoved ? '-' : ' '}</span>
                                                <span style={{ whiteSpace: 'pre-wrap' }}>{(isAdded || isRemoved) ? highlightRisk(line.slice(1)) : line}</span>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                        {!user && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '6px' }}>Modified By</label>
                                <input required placeholder="Your name" value={user} onChange={event => onUserChange(event.target.value)} />
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <Button type="button" variant="ghost" onClick={onResetPreview}>Back to Edit</Button>
                            <Button type="submit"><Upload size={14} /> Confirm Upload</Button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
}
