import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal Dialog */}
            <div className="relative z-50 w-full max-w-lg rounded-[color:var(--radius-xl)] bg-[color:var(--bg-elevated)] p-6 shadow-[color:var(--shadow-float)] animate-slide-up border border-[color:var(--border-light)]">
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-semibold text-[color:var(--text-main)]">{title}</h2>
                    <button
                        onClick={onClose}
                        className="rounded-full p-1 text-[color:var(--text-muted)] hover:bg-[color:var(--bg-hover)] transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div>
                    {children}
                </div>
            </div>
        </div>
    );
};
