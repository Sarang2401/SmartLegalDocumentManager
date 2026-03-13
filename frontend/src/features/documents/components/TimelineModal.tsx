import { Badge } from '../../../components/Badge';
import { Modal } from '../../../components/Modal';
import type { AuditLogResponse } from '../../../types';
import { actionColor } from '../utils/documentAnnotations';

interface TimelineModalProps {
    isOpen: boolean;
    timeline: AuditLogResponse[];
    onClose: () => void;
}

export function TimelineModal({ isOpen, timeline, onClose }: TimelineModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Activity Timeline" subtitle="Chronological audit trail for this document." width="520px">
            <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '4px' }}>
                {timeline.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px' }}>No activity yet.</p>
                ) : (
                    <div style={{ position: 'relative', paddingLeft: '28px' }}>
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
                )}
            </div>
        </Modal>
    );
}
