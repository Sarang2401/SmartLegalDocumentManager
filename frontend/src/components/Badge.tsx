import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'gold' | 'navy';
}

const variantMap: Record<string, React.CSSProperties> = {
    success: { background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)' },
    warning: { background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)' },
    danger: { background: 'var(--danger-bg)', color: 'var(--danger-text)', border: '1px solid var(--danger-border)' },
    neutral: { background: '#f0f2f7', color: 'var(--text-muted)', border: '1px solid var(--border-light)' },
    gold: { background: 'var(--gold-muted)', color: 'var(--gold-600)', border: '1px solid var(--gold-border)' },
    navy: { background: 'rgba(21,42,84,0.08)', color: 'var(--navy-700)', border: '1px solid rgba(21,42,84,0.15)' },
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'neutral', style, children, ...props }) => {
    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '2px 8px',
                borderRadius: '20px',
                fontSize: '0.7rem',
                fontWeight: 600,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                ...variantMap[variant],
                ...style,
            }}
            {...props}
        >
            {children}
        </span>
    );
};
