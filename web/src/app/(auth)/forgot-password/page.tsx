import React from 'react';
import { Metadata } from 'next';
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password',
  description: 'Reset your V8id Cloud account password',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
