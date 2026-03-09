import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle, AlertTriangle, FileWarning, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import type { CompareResponse, DocumentResponse } from '../types';

export const VersionCompare = () => {
    const { id, v1, v2 } = useParams<{ id: string; v1: string; v2: string }>();
    const [doc, setDoc] = useState<DocumentResponse | null>(null);
    const [compareData, setCompareData] = useState<CompareResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id && v1 && v2) {
            loadData();
        }
    }, [id, v1, v2]);

    const loadData = async () => {
        try {
            setLoading(true);
            const docs = await api.getDocuments();
            const currentDoc = docs.find(d => d.id === id);
            if (currentDoc) setDoc(currentDoc);

            const data = await api.compareVersions(id!, parseInt(v1!), parseInt(v2!));
            setCompareData(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="py-12 text-center text-[color:var(--text-muted)] animate-pulse">Computing differences...</div>;
    if (!compareData || !doc) return <div className="py-12 text-center text-red-500">Comparison data not found</div>;

    const simRatio = (compareData.similarity * 100).toFixed(1);
    const isIdentical = compareData.similarity === 1;

    // Risk keywords highlight (Helper)
    const highlightRiskyKeywords = (text: string) => {
        const riskyWords = ['payment', 'liability', 'termination', 'confidentiality'];
        const regex = new RegExp(`\\b(${riskyWords.join('|')})\\b`, 'gi');

        // If there is no risky word, just return text
        if (!regex.test(text)) return text;

        // Split by regex
        const chunks = text.split(new RegExp(`(\\b(?:${riskyWords.join('|')})\\b)`, 'gi'));
        return chunks.map((chunk, i) =>
            riskyWords.includes(chunk.toLowerCase()) ? (
                <span key={i} className="bg-red-200 text-red-900 font-bold px-1 rounded">{chunk}</span>
            ) : chunk
        );
    };

    // Render Diff Lines
    const renderDiffLines = () => {
        return compareData.diff.map((line, idx) => {
            // Handle unified diff headers
            if (line.startsWith('---') || line.startsWith('+++') || line.startsWith('@@')) {
                return (
                    <div key={idx} className="bg-[color:var(--bg-hover)] px-4 py-2 text-xs font-mono text-[color:var(--text-lighter)] border-b border-[color:var(--border-light)]">
                        {line}
                    </div>
                );
            }

            let bgColor = '';
            let textColor = 'text-[color:var(--text-main)]';
            let icon = null;
            let isModified = false;

            if (line.startsWith('+')) {
                bgColor = 'bg-[color:var(--diff-add-bg)]';
                textColor = 'text-[color:var(--diff-add-text)]';
                icon = '+';
                isModified = true;
            } else if (line.startsWith('-')) {
                bgColor = 'bg-[color:var(--diff-del-bg)]';
                textColor = 'text-[color:var(--diff-del-text)]';
                icon = '-';
                isModified = true;
            }

            const rawText = line.substring(1);

            return (
                <div key={idx} className={`flex px-4 py-1.5 font-mono text-sm ${bgColor} ${textColor} hover:bg-black/5 transition-colors`}>
                    <div className="w-8 select-none text-opacity-50 text-[color:var(--text-lighter)]">{icon || '\u00A0'}</div>
                    <div className="flex-1 whitespace-pre-wrap">
                        {isModified ? highlightRiskyKeywords(rawText) : rawText}
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-[color:var(--border-light)] pb-6">
                <Link to={`/documents/${id}`} className="rounded-full p-2 hover:bg-[color:var(--bg-hover)] transition-colors">
                    <ArrowLeft size={20} className="text-[color:var(--text-muted)]" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[color:var(--text-main)]">Document Comparison</h1>
                    <p className="text-[color:var(--text-muted)] mt-1 flex items-center gap-2">
                        {doc.title}
                    </p>
                </div>
            </div>

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-4 rounded-xl border border-[color:var(--border-light)] bg-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <ArrowRight size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[color:var(--text-muted)]">Versions Comparing</p>
                        <p className="text-lg font-bold text-[color:var(--text-main)]">v{compareData.version_a} ➔ v{compareData.version_b}</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-[color:var(--border-light)] bg-white p-5 shadow-sm">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isIdentical ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                        {isIdentical ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[color:var(--text-muted)]">Similarity Score</p>
                        <p className="text-lg font-bold text-[color:var(--text-main)]">{simRatio}% Match</p>
                    </div>
                </div>

                <div className="flex items-center gap-4 rounded-xl border border-[color:var(--border-light)] bg-white p-5 shadow-sm">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 text-purple-600">
                        <FileWarning size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-[color:var(--text-muted)]">Lines Edited</p>
                        <p className="text-lg font-bold text-[color:var(--text-main)]">
                            <span className="text-[color:var(--diff-add-text)] w-8 inline-block">+{compareData.added.length}</span>
                            <span className="text-[color:var(--diff-del-text)] w-8 inline-block">-{compareData.removed.length}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Diff Viewer Shell */}
            <div className="rounded-xl border border-[color:var(--border-light)] bg-white shadow-sm overflow-hidden animate-slide-up">
                <div className="border-b border-[color:var(--border-light)] bg-[color:var(--bg-subtle)] px-4 py-3 font-semibold text-[color:var(--text-main)]">
                    Diff Viewer
                </div>
                <div className="overflow-x-auto">
                    {compareData.diff.length === 0 ? (
                        <div className="p-12 text-center text-[color:var(--text-muted)]">
                            <CheckCircle size={48} className="mx-auto mb-4 text-green-500 opacity-50" />
                            <p>These two versions are completely identical.</p>
                        </div>
                    ) : (
                        <div className="min-w-fit divide-y divide-[color:var(--border-light)]">
                            {renderDiffLines()}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
