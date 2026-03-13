import { useState } from 'react';
import type { FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { CompareResponse, VersionResponse } from '../types';
import { useDocumentDetail } from '../features/documents/hooks/useDocumentDetail';
import { DocumentDetailHeader } from '../features/documents/components/DocumentDetailHeader';
import { VersionSelectionToolbar } from '../features/documents/components/VersionSelectionToolbar';
import { VersionHistoryList } from '../features/documents/components/VersionHistoryList';
import { UploadVersionModal } from '../features/documents/components/UploadVersionModal';
import { EditTitleModal } from '../features/documents/components/EditTitleModal';
import { TimelineModal } from '../features/documents/components/TimelineModal';
import '../features/documents/documentDetail.css';

export const DocumentDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { doc, versions, timeline, loading, error, loadData } = useDocumentDetail(id);

    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [isTitleOpen, setIsTitleOpen] = useState(false);
    const [isTimelineOpen, setIsTimelineOpen] = useState(false);

    const [uploadContent, setUploadContent] = useState('');
    const [uploadUser, setUploadUser] = useState('');
    const [previewDiff, setPreviewDiff] = useState<CompareResponse | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);

    const [titleDraft, setTitleDraft] = useState('');
    const [titleUser, setTitleUser] = useState('');
    const [selectedVersions, setSelectedVersions] = useState<number[]>([]);

    const handlePreview = async () => {
        if (!uploadContent.trim()) return;

        setIsPreviewLoading(true);
        try {
            setPreviewDiff(await api.previewDiff(id!, { content: uploadContent }));
        } catch (previewError) {
            alert(previewError instanceof Error ? previewError.message : 'Preview failed');
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!uploadContent.trim() || !uploadUser.trim()) return;

        try {
            await api.uploadVersion(id!, { content: uploadContent, modified_by: uploadUser });
            closeUploadModal();
            await loadData();
        } catch (uploadError) {
            alert(uploadError instanceof Error ? uploadError.message : 'Upload failed');
        }
    };

    const handleRestore = async (versionNumber: number) => {
        const restoredBy = prompt('Enter your name to confirm restoration:');
        if (!restoredBy?.trim()) return;

        try {
            await api.restoreVersion(id!, versionNumber, { restored_by: restoredBy });
            await loadData();
        } catch (restoreError) {
            alert(restoreError instanceof Error ? restoreError.message : 'Restore failed');
        }
    };

    const handleUpdateTitle = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!titleDraft.trim() || !titleUser.trim()) return;

        try {
            await api.updateTitle(id!, { title: titleDraft, modified_by: titleUser });
            setIsTitleOpen(false);
            setTitleUser('');
            await loadData();
        } catch (updateError) {
            alert(updateError instanceof Error ? updateError.message : 'Update failed');
        }
    };

    const toggleCompare = (versionNumber: number) => {
        if (selectedVersions.includes(versionNumber)) {
            setSelectedVersions(current => current.filter(value => value !== versionNumber));
            return;
        }

        if (selectedVersions.length < 2) {
            setSelectedVersions(current => [...current, versionNumber]);
        }
    };

    const handleDownload = (version: VersionResponse) => {
        if (!doc) return;

        const blob = new Blob([version.content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        const safeTitle = doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        anchor.download = `${safeTitle}_v${version.version_number}.txt`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
    };

    const openUploadModal = () => {
        setPreviewDiff(null);
        setIsUploadOpen(true);
    };

    const closeUploadModal = () => {
        setIsUploadOpen(false);
        setUploadContent('');
        setUploadUser('');
        setPreviewDiff(null);
    };

    const openTitleModal = () => {
        if (doc) {
            setTitleDraft(doc.title);
        }
        setIsTitleOpen(true);
    };

    if (loading) {
        return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading document...</div>;
    }

    if (!doc) {
        return <div style={{ padding: '64px', textAlign: 'center', color: 'var(--danger-text)' }}>{error || 'Document not found.'}</div>;
    }

    const highestVersion = versions.length > 0 ? Math.max(...versions.map(version => version.version_number)) : 1;

    return (
        <div className="document-detail-page animate-fade-in">
            <DocumentDetailHeader
                doc={doc}
                versionsCount={versions.length}
                highestVersion={highestVersion}
                onOpenTitle={openTitleModal}
                onOpenTimeline={() => setIsTimelineOpen(true)}
                onOpenUpload={openUploadModal}
            />

            <VersionSelectionToolbar
                documentId={id!}
                selectedVersions={selectedVersions}
                onClear={() => setSelectedVersions([])}
            />

            <VersionHistoryList
                versions={versions}
                highestVersion={highestVersion}
                selectedVersions={selectedVersions}
                onToggleCompare={toggleCompare}
                onRestore={handleRestore}
                onDownload={handleDownload}
            />

            <UploadVersionModal
                isOpen={isUploadOpen}
                content={uploadContent}
                user={uploadUser}
                previewDiff={previewDiff}
                isPreviewLoading={isPreviewLoading}
                onClose={closeUploadModal}
                onContentChange={setUploadContent}
                onUserChange={setUploadUser}
                onPreview={handlePreview}
                onSubmit={handleUpload}
                onResetPreview={() => setPreviewDiff(null)}
            />

            <EditTitleModal
                isOpen={isTitleOpen}
                title={titleDraft}
                user={titleUser}
                onClose={() => setIsTitleOpen(false)}
                onTitleChange={setTitleDraft}
                onUserChange={setTitleUser}
                onSubmit={handleUpdateTitle}
            />

            <TimelineModal
                isOpen={isTimelineOpen}
                timeline={timeline}
                onClose={() => setIsTimelineOpen(false)}
            />
        </div>
    );
};
