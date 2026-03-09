import React from 'react';
import { cn } from '../utils/classnames';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
        return (
            <button
                ref={ref}
                className={cn(
                    'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
                    {
                        'bg-[color:var(--primary)] text-[color:var(--primary-text)] hover:bg-[color:var(--primary-hover)]': variant === 'primary',
                        'bg-white text-[color:var(--text-main)] border border-[color:var(--border-dark)] hover:bg-[color:var(--bg-hover)]': variant === 'secondary',
                        'bg-[color:var(--danger-bg)] text-[color:var(--danger-text)] border border-[color:var(--danger-border)] hover:bg-[#fee2e2]': variant === 'danger',
                        'bg-transparent hover:bg-[color:var(--bg-hover)] text-[color:var(--text-main)]': variant === 'ghost',
                        'h-8 px-3 text-xs': size === 'sm',
                        'h-10 px-4 py-2 text-sm': size === 'md',
                        'h-12 px-8 text-base': size === 'lg',
                    },
                    className
                )}
                {...props}
            />
        );
    }
);
Button.displayName = 'Button';
