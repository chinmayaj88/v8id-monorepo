import React from 'react';
import { Metadata } from 'next';
import TwoFactorForm from '@/components/auth/TwoFactorForm';

export const metadata: Metadata = {
  title: 'Two-Factor Authentication',
  description: 'Verify your identity with V8id Cloud 2FA',
};

export default function TwoFactorPage() {
  return <TwoFactorForm />;
}
