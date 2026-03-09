import React from 'react';
import { cn } from '../utils/classnames';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'success' | 'warning' | 'danger' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ className, variant = 'neutral', ...props }) => {
    return (
        <div
            className={cn(
                'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold max-w-max',
                {
                    'bg-[color:var(--success-bg)] text-[color:var(--success-text)] border border-[color:var(--success-border)]': variant === 'success',
                    'bg-[color:var(--warning-bg)] text-[color:var(--warning-text)] border border-[color:var(--warning-border)]': variant === 'warning',
                    'bg-[color:var(--danger-bg)] text-[color:var(--danger-text)] border border-[color:var(--danger-border)]': variant === 'danger',
                    'bg-[color:var(--bg-hover)] text-[color:var(--text-muted)] border border-[color:var(--border-light)]': variant === 'neutral',
                },
                className
            )}
            {...props}
        />
    );
};
