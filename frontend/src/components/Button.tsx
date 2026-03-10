import React from 'react';
import { cn } from '../utils/classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

const styles: Record<string, React.CSSProperties> = {
    base: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        fontFamily: 'var(--font-sans)',
        fontWeight: 600,
        letterSpacing: '0.01em',
        cursor: 'pointer',
        border: 'none',
        borderRadius: 'var(--radius-md)',
        transition: 'all 0.18s ease',
        whiteSpace: 'nowrap' as const,
        userSelect: 'none' as const,
    },
    primary: {
        background: 'linear-gradient(135deg, var(--gold-500) 0%, var(--gold-400) 100%)',
        color: 'var(--primary-text)', // navy text on gold
        boxShadow: '0 2px 8px rgba(201,168,76,0.3)',
    },
    secondary: {
        background: '#ffffff',
        color: 'var(--navy-700)',
        border: '1.5px solid var(--border-dark)',
        boxShadow: 'var(--shadow-xs)',
    },
    danger: {
        background: 'var(--danger-bg)',
        color: 'var(--danger-text)',
        border: '1.5px solid var(--danger-border)',
    },
    ghost: {
        background: 'transparent',
        color: 'var(--text-muted)',
        border: '1px solid transparent',
    },
    sm: { height: '30px', padding: '0 10px', fontSize: '0.75rem' },
    md: { height: '38px', padding: '0 16px', fontSize: '0.875rem' },
    lg: { height: '46px', padding: '0 24px', fontSize: '0.9375rem' },
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', style, ...props }, ref) => {
        const [hovered, setHovered] = React.useState(false);
        const variantStyle = styles[variant] || {};
        const sizeStyle = styles[size] || {};

        const hoverStyle: React.CSSProperties = hovered && !props.disabled
            ? variant === 'primary'
                ? { background: 'linear-gradient(135deg, var(--gold-400) 0%, var(--gold-500) 100%)', transform: 'translateY(-1px)', boxShadow: 'var(--shadow-gold)' }
                : variant === 'secondary'
                    ? { background: 'var(--bg-hover)', borderColor: 'var(--navy-500)', color: 'var(--navy-600)' }
                    : variant === 'ghost'
                        ? { background: 'var(--bg-hover)', color: 'var(--text-main)' }
                        : {}
            : {};

        return (
            <button
                ref={ref}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                style={{
                    ...styles.base,
                    ...variantStyle,
                    ...sizeStyle,
                    ...hoverStyle,
                    ...(props.disabled ? { opacity: 0.5, cursor: 'not-allowed', transform: 'none' } : {}),
                    ...style,
                }}
                className={cn(className)}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
