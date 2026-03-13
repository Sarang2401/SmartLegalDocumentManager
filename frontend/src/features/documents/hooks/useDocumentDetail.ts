import { useEffect, useState } from 'react';
import { api } from '../../../api/client';
import type { AuditLogResponse, DocumentResponse, VersionResponse } from '../../../types';

export function useDocumentDetail(documentId?: string) {
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [versions, setVersions] = useState<VersionResponse[]>([]);
    const [timeline, setTimeline] = useState<AuditLogResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        if (!documentId) return;

        try {
            setLoading(true);
            setError(null);

            const docs = await api.getDocuments();
            const currentDoc = docs.find(document => document.id === documentId) || null;
            setDoc(currentDoc);

            const [versionData, timelineData] = await Promise.all([
                api.getVersions(documentId),
                api.getTimeline(documentId),
            ]);

            setVersions(versionData);
            setTimeline(timelineData);
        } catch (loadError) {
            console.error(loadError);
            setError(loadError instanceof Error ? loadError.message : 'Unable to load document details.');
            setDoc(null);
            setVersions([]);
            setTimeline([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (documentId) {
            loadData();
        }
    }, [documentId]);

    return {
        doc,
        versions,
        timeline,
        loading,
        error,
        loadData,
    };
}
