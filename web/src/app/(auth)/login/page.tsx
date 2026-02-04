import React from 'react';
import { Metadata } from 'next';
import LoginForm from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Securely sign in to your V8id Cloud account',
};

export default function LoginPage() {
  return <LoginForm />;
}
