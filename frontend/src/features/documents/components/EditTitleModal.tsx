import type { FormEvent } from 'react';
import { Button } from '../../../components/Button';
import { Modal } from '../../../components/Modal';

interface EditTitleModalProps {
    isOpen: boolean;
    title: string;
    user: string;
    onClose: () => void;
    onTitleChange: (value: string) => void;
    onUserChange: (value: string) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

export function EditTitleModal({
    isOpen,
    title,
    user,
    onClose,
    onTitleChange,
    onUserChange,
    onSubmit,
}: EditTitleModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Update Document Title">
            <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px' }}>New Title</label>
                    <input required value={title} onChange={event => onTitleChange(event.target.value)} />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '6px' }}>Modified By</label>
                    <input required placeholder="Your name" value={user} onChange={event => onUserChange(event.target.value)} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save Title</Button>
                </div>
            </form>
        </Modal>
    );
}
