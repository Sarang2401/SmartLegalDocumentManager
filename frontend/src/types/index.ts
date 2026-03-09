export interface DocumentResponse {
    id: string;
    title: string;
    created_by: string;
    created_at: string;
    updated_at: string;
    is_deleted: boolean;
}

export interface VersionResponse {
    id: string;
    document_id: string;
    version_number: number;
    content: string;
    created_by: string;
    created_at: string;
}

export interface CompareResponse {
    document_id: string;
    version_a: number;
    version_b: number;
    similarity: number;
    diff: string[];
    added: string[];
    removed: string[];
}

export interface AuditLogResponse {
    id: string;
    document_id: string;
    version_id?: string;
    action: string;
    user: string;
    timestamp: string;
}

export interface DocumentCreatePayload {
    title: string;
    content: string;
    created_by: string;
}

export interface VersionCreatePayload {
    content: string;
    modified_by: string;
}

export interface DocumentTitleUpdatePayload {
    title: string;
    modified_by: string;
}
