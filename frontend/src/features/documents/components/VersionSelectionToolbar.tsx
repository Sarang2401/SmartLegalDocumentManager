import { FileWarning, GitCompareArrows } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/Button';

interface VersionSelectionToolbarProps {
    documentId: string;
    selectedVersions: number[];
    onClear: () => void;
}

export function VersionSelectionToolbar({
    documentId,
    selectedVersions,
    onClear,
}: VersionSelectionToolbarProps) {
    if (selectedVersions.length === 0) return null;

    const compareReady = selectedVersions.length === 2;
    const comparePath = compareReady
        ? `/documents/${documentId}/compare/${Math.min(...selectedVersions)}/${Math.max(...selectedVersions)}`
        : '#';

    return (
        <div className="document-detail-compare-toolbar" style={{ background: compareReady ? '#eff6ff' : '#fffbeb', borderColor: compareReady ? '#93c5fd' : '#fde68a' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', color: compareReady ? '#1d4ed8' : '#854d0e', fontWeight: 500 }}>
                <FileWarning size={17} />
                {compareReady ? `Compare v${selectedVersions[0]} and v${selectedVersions[1]}` : `v${selectedVersions[0]} selected - pick one more`}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
                <Button variant="ghost" size="sm" onClick={onClear}>Cancel</Button>
                <Link to={comparePath} style={{ pointerEvents: compareReady ? 'auto' : 'none', opacity: compareReady ? 1 : 0.5, textDecoration: 'none' }}>
                    <Button size="sm"><GitCompareArrows size={14} /> Compare</Button>
                </Link>
            </div>
        </div>
    );
}
