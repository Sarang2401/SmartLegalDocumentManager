import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, Trash2, Clock, User } from 'lucide-react';
import { api } from '../api/client';
import type { DocumentResponse } from '../types';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';

export const Dashboard = () => {
    const [documents, setDocuments] = useState<DocumentResponse[]>([]);
    const [loading, setLoading] = useState(true);

    // Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newUser, setNewUser] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        try {
            const docs = await api.getDocuments();
            setDocuments(docs);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newContent.trim() || !newUser.trim()) return;

        setCreating(true);
        try {
            await api.createDocument({
                title: newTitle,
                content: newContent,
                created_by: newUser
            });
            setIsModalOpen(false);
            setNewTitle('');
            setNewContent('');
            setNewUser('');
            fetchDocuments();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error creating document');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const user = prompt('Enter your username to confirm deletion:');
        if (!user) return;

        if (confirm('Are you sure you want to delete this document?')) {
            try {
                await api.deleteDocument(id, user);
                fetchDocuments();
            } catch (err) {
                alert(err instanceof Error ? err.message : 'Error deleting document');
            }
        }
    };

    if (loading) {
        return <div className="py-12 text-center text-gray-500">Loading documents...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">Document Workspace</h1>
                    <p className="text-gray-500 mt-1">Manage all your legal documents and their versions.</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                    <Plus size={16} /> New Document
                </Button>
            </div>

            {documents.length === 0 ? (
                <div className="rounded-xl border border-gray-200 border-dashed p-12 text-center bg-gray-50">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600 mb-4">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">No documents</h3>
                    <p className="mt-1 text-gray-500 max-w-sm mx-auto">Get started by creating a new document to track its versions.</p>
                    <Button onClick={() => setIsModalOpen(true)} className="mt-6">Create Document</Button>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {documents.map((doc) => (
                        <Link
                            key={doc.id}
                            to={`/documents/${doc.id}`}
                            className="group relative flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:border-gray-300 hover:shadow-md"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                    <FileText size={20} />
                                </div>
                                <button
                                    onClick={(e) => handleDelete(doc.id, e)}
                                    className="rounded p-1 text-gray-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 focus:opacity-100"
                                    aria-label="Delete document"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            <div className="mt-4 flex-1">
                                <h3 className="font-semibold text-gray-900 line-clamp-1">{doc.title}</h3>
                                <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                                    <User size={14} />
                                    <span>{doc.created_by}</span>
                                </div>
                                <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                                    <Clock size={14} />
                                    <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="mt-5 border-t border-gray-100 pt-4 flex space-x-2">
                                <Badge variant="neutral">Active Docs</Badge>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Document">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                            required
                            className="w-full"
                            placeholder="e.g., Non-Disclosure Agreement - Q4"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                        <input
                            required
                            className="w-full"
                            placeholder="Your name or department"
                            value={newUser}
                            onChange={(e) => setNewUser(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Initial Content</label>
                        <textarea
                            required
                            className="w-full"
                            rows={6}
                            placeholder="Paste the document text here..."
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={creating}>
                            {creating ? 'Creating...' : 'Create Document'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
