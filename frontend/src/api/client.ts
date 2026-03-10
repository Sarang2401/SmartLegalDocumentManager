import type {
    DocumentResponse,
    VersionResponse,
    CompareResponse,
    AuditLogResponse,
    DocumentCreatePayload,
    VersionCreatePayload,
    DocumentTitleUpdatePayload,
    RestoreRequestPayload,
    PreviewRequestPayload,
} from '../types';

const API_BASE = 'https://legal-doc-api-u6pb.onrender.com/documents';

export class ApiError extends Error {
    public status?: number;

    constructor(message: string, status?: number) {
        super(message);
        this.status = status;
    }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        let errorMsg = 'An error occurred';
        try {
            const errorData = await response.json();
            errorMsg = errorData.detail || errorMsg;
        } catch {
            // Ignored
        }
        throw new ApiError(errorMsg, response.status);
    }

    if (response.status === 204) {
        return {} as T;
    }

    return response.json();
}

export const api = {
    // Documents
    getDocuments: () => request<DocumentResponse[]>(''),
    createDocument: (data: DocumentCreatePayload) =>
        request<DocumentResponse>('', { method: 'POST', body: JSON.stringify(data) }),
    updateTitle: (id: string, data: DocumentTitleUpdatePayload) =>
        request<DocumentResponse>(`/${id}/title`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteDocument: (id: string, user: string) =>
        request<void>(`/${id}?modified_by=${encodeURIComponent(user)}`, { method: 'DELETE' }),

    // Versions
    getVersions: (docId: string) => request<VersionResponse[]>(`/${docId}/versions`),
    uploadVersion: (docId: string, data: VersionCreatePayload) =>
        request<VersionResponse>(`/${docId}/versions`, { method: 'POST', body: JSON.stringify(data) }),
    deleteVersion: (docId: string, versionNumber: number, user: string) =>
        request<void>(`/${docId}/versions/${versionNumber}?modified_by=${encodeURIComponent(user)}`, { method: 'DELETE' }),
    restoreVersion: (docId: string, versionNumber: number, data: RestoreRequestPayload) =>
        request<VersionResponse>(`/${docId}/restore/${versionNumber}`, { method: 'POST', body: JSON.stringify(data) }),

    // Logs & Diff
    getTimeline: (docId: string) => request<AuditLogResponse[]>(`/${docId}/timeline`),
    compareVersions: (docId: string, v1: number, v2: number) =>
        request<CompareResponse>(`/${docId}/compare?v1=${v1}&v2=${v2}`),
    previewDiff: (docId: string, data: PreviewRequestPayload) =>
        request<CompareResponse>(`/${docId}/preview`, { method: 'POST', body: JSON.stringify(data) }),
};
