import React from 'react';
import { Scale, FileText } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="min-h-screen bg-[color:var(--bg-subtle)]">
            <header className="sticky top-0 z-30 flex h-16 w-full items-center border-b border-[color:var(--border-light)] bg-white/80 px-6 backdrop-blur-md">
                <div className="container flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[color:var(--primary)] text-white shadow-sm">
                        <Scale size={18} />
                    </div>
                    <span className="text-lg font-bold tracking-tight text-[color:var(--primary)]">
                        Smart Legal Doc Manager
                    </span>

                    <nav className="ml-10 hidden md:flex items-center gap-6">
                        <a href="/" className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-main)] hover:text-[color:var(--primary)]">
                            <FileText size={16} /> Documents
                        </a>
                    </nav>
                </div>
            </header>

            <main className="container py-8">
                {children}
            </main>
        </div>
    );
};
