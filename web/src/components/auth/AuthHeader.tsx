import React from 'react';

interface AuthHeaderProps {
  title: string;
  subtitle: string;
}

export default function AuthHeader({ title, subtitle }: AuthHeaderProps) {
  return (
    <div className="animate-item mb-10 text-center lg:text-left">
      <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-3">{title}</h2>
      <p className="text-slate-500 text-lg font-medium leading-relaxed">{subtitle}</p>
    </div>
  );
}
