'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineSearch,
  HiOutlineViewList,
  HiOutlineViewGrid,
  HiChevronRight,
} from 'react-icons/hi';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { useAppSelector } from '@/store/hooks';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PremiumLoader from '@/components/ui/PremiumLoader';
import Link from 'next/link';
import AddUserModal from '@/components/dashboard/AddUserModal';
import UniversalUserView from '@/components/dashboard/UniversalUserView';
import { useModal } from '@/components/ui/ModalProvider';
import Modal from '@/components/ui/Modal';

interface UserItem {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  storageQuota: string;
  storageUsed: string;
  isActive: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAppSelector(state => state.auth);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { showNotification } = useModal();

  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    userIds: Set<string>;
  }>({
    isOpen: false,
    userIds: new Set(),
  });
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const targetEmail =
    deleteModalState.userIds.size === 1
      ? users.find(u => u.id === Array.from(deleteModalState.userIds)[0])?.email
      : 'DELETE';

  const handleDeleteUsers = (userIds: Set<string>) => {
    if (userIds.size === 0) return;

    if (currentUser?.id && userIds.has(currentUser.id)) {
      showNotification({
        title: 'Error',
        message: 'You cannot delete yourself',
        type: 'error',
      });
      return;
    }

    setDeleteModalState({ isOpen: true, userIds });
    setDeleteInput('');
  };

  const confirmDelete = async () => {
    const { userIds } = deleteModalState;
    if (userIds.size === 0) return;
    setIsDeleting(true);

    try {
      // Send delete requests in parallel
      const idsArray = Array.from(userIds);
      await Promise.all(idsArray.map(id => apiClient.delete(ENDPOINTS.USER.DELETE(id))));

      showNotification({
        title: 'Success',
        message: `${userIds.size === 1 ? 'User' : 'Users'} deleted successfully`,
        type: 'success',
      });

      setSelectedIds(new Set());
      fetchUsers();
      setDeleteModalState({ isOpen: false, userIds: new Set() });
    } catch (error: any) {
      const errMsg =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        'Failed to delete user(s)';
      showNotification({
        title: 'Error',
        message: errMsg,
        type: 'error',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(ENDPOINTS.USER.LIST);
      setUsers(response.data?.data?.users || []);
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
      router.replace('/dashboard/users');
    }
  }, [searchParams, router]);
  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const filteredUsers = users.filter(
    u =>
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex h-[60vh] items-center justify-center p-6">
        <Card variant="outline" className="p-10 text-center max-w-sm rounded-[24px]">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineTrash className="w-8 h-8 text-red-500 opacity-80" />
          </div>
          <h2 className="text-xl font-black mb-2 tracking-tight">Access Denied</h2>
          <p className="text-zinc-500 text-sm font-bold leading-relaxed">
            Restricted to administrators only. Please contact support if you believe this is an
            error.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-700">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
        <span style={{ color: 'var(--text-secondary)' }}>User Management</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            User Management
          </h1>
          <p
            className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-60"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Control access and storage limits
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          className="rounded-full px-5 font-bold h-10"
          icon={<HiOutlinePlus className="w-4 h-4" />}
          onClick={() => setShowAddModal(true)}
        >
          Add User
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="w-full md:w-96">
          <Input
            placeholder="Search users by name, email or role..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            icon={<HiOutlineSearch className="w-4 h-4" />}
            className="border-0 ring-1 ring-inset ring-black/5 dark:ring-white/10 focus:ring-2 focus:ring-v8-primary/20 py-2.5 rounded-2xl"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
        <div
          className="flex items-center gap-2 p-1 rounded-2xl border bg-zinc-50/50 dark:bg-zinc-800/20 shadow-xs relative"
          style={{ borderColor: 'var(--border-primary)' }}
        >
          {/* Bulk Actions Indicator (Similar to Home) */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-1 pr-2 border-r border-zinc-200 dark:border-zinc-700 mr-2 animate-in fade-in slide-in-from-right-4">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 mx-2">
                {selectedIds.size} selected
              </span>
              <button
                onClick={e => {
                  e.stopPropagation();
                  setSelectedIds(new Set());
                }}
                className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-600 transition-colors mr-1"
                title="Clear Selection"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleDeleteUsers(selectedIds);
                }}
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                title="Delete Selected"
              >
                <HiOutlineTrash className="w-4 h-4" />
              </button>
              <div className="w-px h-4 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
            </div>
          )}

          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-400 hover:text-v8-primary'}`}
          >
            <HiOutlineViewList className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-zinc-700 shadow-sm text-v8-primary' : 'text-zinc-400 hover:text-v8-primary'}`}
          >
            <HiOutlineViewGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <PremiumLoader />
        </div>
      ) : (
        <>
          <UniversalUserView
            users={filteredUsers}
            viewMode={viewMode}
            enableSelection={true}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            onDelete={user => {
              handleDeleteUsers(new Set([user.id]));
            }}
          />

          {filteredUsers.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <p className="font-black text-xl opacity-30 uppercase tracking-widest">
                No users found
              </p>
            </div>
          )}
        </>
      )}

      <AddUserModal
        isOpen={showAddModal}
        handleClose={() => setShowAddModal(false)}
        onSuccess={fetchUsers}
      />

      <Modal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
        title={deleteModalState.userIds.size === 1 ? 'Delete User' : 'Delete Users'}
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setDeleteModalState(prev => ({ ...prev, isOpen: false }))}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ backgroundColor: '#ef4444' }}
              onClick={confirmDelete}
              isLoading={isDeleting}
              disabled={deleteInput !== targetEmail}
            >
              Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl border bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400">
            <h4 className="font-black text-sm mb-1">Warning</h4>
            <p className="text-xs font-medium leading-relaxed opacity-90">
              {deleteModalState.userIds.size === 1
                ? `You are about to delete the user ${targetEmail}. This action cannot be undone.`
                : `You are about to delete ${deleteModalState.userIds.size} users. This action cannot be undone.`}
            </p>
          </div>
          <div>
            <label className="block text-xs font-bold mb-2 tracking-wide text-zinc-500">
              {deleteModalState.userIds.size === 1
                ? `Please type ${targetEmail} to confirm`
                : 'Please type DELETE to confirm'}
            </label>
            <Input
              value={deleteInput}
              onChange={e => setDeleteInput(e.target.value)}
              placeholder={deleteModalState.userIds.size === 1 ? targetEmail : 'DELETE'}
              className="w-full"
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
