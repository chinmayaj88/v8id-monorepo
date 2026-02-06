'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  HiOutlinePlus,
  HiOutlineMail,
  HiOutlineUser,
  HiOutlineDatabase,
  HiOutlineTrash,
  HiOutlineSearch,
} from 'react-icons/hi';
import { apiClient } from '@/lib/api';
import { ENDPOINTS } from '@/lib/constants';
import { useAppSelector } from '@/store/hooks';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PremiumLoader from '@/components/ui/PremiumLoader';
import Link from 'next/link';
import { HiChevronRight } from 'react-icons/hi';
import AddUserModal from '@/components/dashboard/AddUserModal';

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

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

      <div className="flex items-center gap-3">
        <div className="w-full max-w-xs">
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            icon={<HiOutlineSearch />}
            className="bg-card-bg/50 border-zinc-200 dark:border-zinc-800"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center">
          <PremiumLoader />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredUsers.map(userItem => (
            <Card
              key={userItem.id}
              className="group hover:-translate-y-1 transition-all duration-300 relative overflow-hidden p-5"
            >
              <div className="absolute top-0 right-0 h-32 w-32 bg-v8-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-v8-primary/10 transition-colors"></div>

              <div className="flex items-start gap-4">
                <div className="h-11 w-11 rounded-2xl bg-v8-primary/10 flex items-center justify-center text-v8-primary font-black text-lg shrink-0">
                  {userItem.firstName?.[0] || userItem.email[0].toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3
                      className="font-black text-sm truncate pr-2"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {userItem.firstName} {userItem.lastName}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${
                        userItem.role === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}
                    >
                      {userItem.role}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500 mb-4">
                    <HiOutlineMail className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-bold truncate">{userItem.email}</span>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-zinc-400">
                      <span>Storage Allocation</span>
                      <span style={{ color: 'var(--text-primary)' }}>
                        {formatSize(parseInt(userItem.storageUsed))} /{' '}
                        {formatSize(parseInt(userItem.storageQuota))}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-v8-primary transition-all duration-1000"
                        style={{
                          width: `${Math.min(100, (parseInt(userItem.storageUsed) / parseInt(userItem.storageQuota)) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div
                    className="mt-5 pt-4 border-t border-dashed flex items-center justify-between"
                    style={{ borderColor: 'var(--border-primary)' }}
                  >
                    <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest opacity-60">
                      Since {new Date(userItem.createdAt).toLocaleDateString()}
                    </div>
                    <button className="text-zinc-400 hover:text-red-500 transition-colors">
                      <HiOutlineTrash className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {filteredUsers.length === 0 && !loading && (
            <div className="col-span-full py-20 text-center">
              <p className="font-black text-xl opacity-30 uppercase tracking-widest">
                No users found
              </p>
            </div>
          )}
        </div>
      )}

      <AddUserModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
