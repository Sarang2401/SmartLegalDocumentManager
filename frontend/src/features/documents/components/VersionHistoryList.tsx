import { Download, RotateCcw } from 'lucide-react';
import { Button } from '../../../components/Button';
import { Badge } from '../../../components/Badge';
import type { VersionResponse } from '../../../types';

interface VersionHistoryListProps {
    versions: VersionResponse[];
    highestVersion: number;
    selectedVersions: number[];
    onToggleCompare: (versionNumber: number) => void;
    onRestore: (versionNumber: number) => void;
    onDownload: (version: VersionResponse) => void;
}

export function VersionHistoryList({
    versions,
    highestVersion,
    selectedVersions,
    onToggleCompare,
    onRestore,
    onDownload,
}: VersionHistoryListProps) {
    return (
        <div>
            <h2 style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                Version History - {versions.length} version{versions.length !== 1 ? 's' : ''}
            </h2>
            <div className="document-detail-surface">
                <ul style={{ listStyle: 'none' }}>
                    {[...versions].reverse().map((version, index) => {
                        const isLatest = version.version_number === highestVersion;
                        const isSelected = selectedVersions.includes(version.version_number);
                        const compareLimitReached = !isSelected && selectedVersions.length >= 2;

                        return (
                            <li
                                key={version.id}
                                className="document-detail-version-row"
                                style={{
                                    borderBottom: index < versions.length - 1 ? '1px solid var(--border-light)' : 'none',
                                    background: isSelected ? '#eff6ff' : '#fff',
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => onToggleCompare(version.version_number)}
                                        disabled={compareLimitReached}
                                        style={{ marginTop: '3px', width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--navy-500)', flexShrink: 0 }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--navy-800)' }}>Version {version.version_number}</span>
                                            {isLatest && <Badge variant="gold">Latest</Badge>}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                            Uploaded by <strong style={{ color: 'var(--navy-700)' }}>{version.created_by}</strong> on {new Date(version.created_at).toLocaleString()}
                                        </div>
                                        <div className="document-detail-content-preview">
                                            {version.content}
                                        </div>
                                    </div>
                                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <Button variant="ghost" size="sm" onClick={() => onDownload(version)} style={{ background: '#fafbff', border: '1px solid var(--border-light)' }}>
                                            <Download size={13} /> Download
                                        </Button>
                                        {!isLatest && (
                                            <Button variant="secondary" size="sm" onClick={() => onRestore(version.version_number)}>
                                                <RotateCcw size={13} /> Restore
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
