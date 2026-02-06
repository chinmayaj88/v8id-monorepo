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
import Modal from '@/components/ui/Modal';
import PremiumLoader from '@/components/ui/PremiumLoader';
import Link from 'next/link';
import { HiChevronRight } from 'react-icons/hi';

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
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'USER' as 'USER' | 'ADMIN',
    storageQuota: 5368709120, // 5GB default
  });

  const [creationResult, setCreationResult] = useState<{
    email: string;
    tempPassword?: string;
    totpSetup: {
      qrCodeUrl: string;
      secret: string;
      backupCodes: string[];
    };
  } | null>(null);

  useEffect(() => {
    if (searchParams.get('add') === 'true') {
      setShowAddModal(true);
      router.replace('/dashboard/users');
    }
  }, [searchParams, router]);

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
    if (currentUser?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [currentUser]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creationResult) {
      setShowAddModal(false);
      setCreationResult(null);
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiClient.post(ENDPOINTS.USER.CREATE, formData);
      const data = response.data?.data;

      setCreationResult({
        email: data.email,
        tempPassword: formData.password,
        totpSetup: data.totpSetup,
      });

      setFormData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'USER',
        storageQuota: 5368709120,
      });
      fetchUsers();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

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
          onClick={() => {
            setCreationResult(null);
            setShowAddModal(true);
          }}
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

      {/* Add User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setCreationResult(null);
        }}
        title={creationResult ? 'Account Created' : 'Add New User'}
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              className="font-bold text-xs"
              onClick={() => {
                setShowAddModal(false);
                setCreationResult(null);
              }}
            >
              {creationResult ? 'Close' : 'Cancel'}
            </Button>
            {!creationResult && (
              <Button
                variant="primary"
                size="sm"
                className="font-bold text-xs rounded-lg px-6"
                onClick={handleAddUser}
                isLoading={submitting}
              >
                Create Account
              </Button>
            )}
          </>
        }
      >
        {creationResult ? (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 shrink-0">
                <HiOutlineMail className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-600">Email sent!</p>
                <p className="text-[11px] font-medium text-emerald-600/70">
                  Credentials sent to {creationResult.email}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                  Authenticator Setup
                </p>
                <div className="flex flex-col items-center bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl p-4 border border-zinc-100 dark:border-zinc-800">
                  <img
                    src={creationResult.totpSetup.qrCodeUrl}
                    alt="QR Code"
                    className="w-40 h-40 rounded-xl shadow-lg mb-3 bg-white p-2"
                  />
                  <code className="text-[11px] font-black text-v8-primary tracking-widest bg-v8-primary/5 px-2.5 py-1 rounded-md">
                    {creationResult.totpSetup.secret}
                  </code>
                </div>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-2 ml-1">
                  Backup Codes
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {creationResult.totpSetup.backupCodes.slice(0, 6).map((code, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-lg text-center text-[10px] font-mono font-bold text-zinc-500 border border-zinc-100 dark:border-zinc-800"
                    >
                      {code}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleAddUser}>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
              <Input
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <Input
              label="Email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              required
              icon={<HiOutlineMail />}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={e => setFormData({ ...formData, password: e.target.value })}
              required
            />
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 ml-1 opacity-70">
                User Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border font-bold text-xs transition-all ${
                    formData.role === 'USER'
                      ? 'border-v8-primary bg-v8-primary/5 text-v8-primary'
                      : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'USER' })}
                >
                  User
                </button>
                <button
                  type="button"
                  className={`py-2 px-3 rounded-lg border font-bold text-xs transition-all ${
                    formData.role === 'ADMIN'
                      ? 'border-v8-primary bg-v8-primary/5 text-v8-primary'
                      : 'border-transparent bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'ADMIN' })}
                >
                  Admin
                </button>
              </div>
            </div>
            <Input
              label="Quota"
              type="number"
              value={formData.storageQuota}
              onChange={e => setFormData({ ...formData, storageQuota: parseInt(e.target.value) })}
              icon={<HiOutlineDatabase />}
              suffix={
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest pr-2">
                  {formatSize(formData.storageQuota)}
                </span>
              }
            />
          </form>
        )}
      </Modal>
    </div>
  );
}
