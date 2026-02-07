'use client';

import React, { useState } from 'react';
import { HiOutlineDocumentText, HiOutlinePencilAlt } from 'react-icons/hi';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { useModal } from '@/components/ui/ModalProvider';
import { useAppDispatch } from '@/store/hooks';
import { fetchSyncData } from '@/store/slices/fileSlice';

interface CreateNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  folderId: string | null;
}

export default function CreateNoteModal({ isOpen, onClose, folderId }: CreateNoteModalProps) {
  const { showNotification } = useModal();
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setIsSubmitting(true);
    try {
      await apiClient.post(ENDPOINTS.FILE.BASE + '/notes', {
        name,
        content,
        folderId,
      });

      showNotification({
        title: 'Success',
        message: 'Note created successfully',
        type: 'success',
      });
      dispatch(fetchSyncData());
      handleClose();
    } catch (error: any) {
      showNotification({
        title: 'Error',
        message: error.response?.data?.message || 'Failed to create note',
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setContent('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Note"
      maxWidth="md"
      footer={
        <div className="flex gap-3 w-full">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="flex-1 rounded-2xl h-12 font-bold"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={!name.trim() || !content.trim()}
            className="flex-1 rounded-2xl h-12 font-bold"
            style={{ backgroundColor: '#8b5cf6', color: 'white' }}
          >
            Save Note
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Note Title"
          placeholder="e.g. Meeting Minutes"
          value={name}
          onChange={e => setName(e.target.value)}
          icon={<HiOutlineDocumentText />}
          autoFocus
        />

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1 opacity-70">
            Content
          </label>
          <div className="relative group">
            <textarea
              className="w-full min-h-[300px] p-5 rounded-3xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 focus:border-v8-primary focus:ring-4 focus:ring-v8-primary/5 transition-all outline-none font-medium resize-none text-sm leading-relaxed"
              placeholder="Start typing your note here..."
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div className="absolute top-5 right-5 opacity-20 group-focus-within:opacity-100 transition-opacity">
              <HiOutlinePencilAlt className="w-5 h-5 text-v8-primary" />
            </div>
          </div>
        </div>
      </form>
    </Modal>
  );
}
