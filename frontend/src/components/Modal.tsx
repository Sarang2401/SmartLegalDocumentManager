import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    width?: string;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children, width = '560px' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 50,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '1rem',
            }}
        >
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0,
                    background: 'rgba(6,16,31,0.72)',
                    backdropFilter: 'blur(6px)',
                    WebkitBackdropFilter: 'blur(6px)',
                }}
                className="animate-fade-in"
            />

            {/* Dialog */}
            <div
                style={{
                    position: 'relative', zIndex: 51,
                    width: '100%', maxWidth: width,
                    background: '#ffffff',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-xl)',
                    overflow: 'hidden',
                }}
                className="animate-slide-up"
            >
                {/* Header stripe */}
                <div style={{ height: '3px', background: 'linear-gradient(90deg, var(--navy-800), var(--navy-500), var(--gold-500))' }} />

                {/* Header content */}
                <div style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '1.5rem 1.5rem 1rem',
                    borderBottom: '1px solid var(--border-light)',
                }}>
                    <div>
                        <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--navy-800)', letterSpacing: '-0.02em' }}>
                            {title}
                        </h2>
                        {subtitle && (
                            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '3px' }}>{subtitle}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            width: '28px', height: '28px',
                            borderRadius: '50%',
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            flexShrink: 0,
                            marginLeft: '12px',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.5rem' }}>
                    {children}
                </div>
            </div>
        </div>
    );
};
