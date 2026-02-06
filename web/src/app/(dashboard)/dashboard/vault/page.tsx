import Link from 'next/link';
import { HiOutlineShieldCheck, HiChevronRight, HiOutlineLockClosed } from 'react-icons/hi';

export default function VaultPage() {
  return (
    <div className="space-y-6 pb-8 h-full flex flex-col">
      {/* Breadcrumbs */}
      <div
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-60"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <Link href="/dashboard" className="hover:text-v8-primary transition-colors">
          Home
        </Link>
        <HiChevronRight className="w-2.5 h-2.5" />
        <span className="text-v8-primary">Personal Vault</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-12">
        <div className="relative">
          <div
            className="p-10 rounded-[40px] border relative z-10 shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border-primary)' }}
          >
            <div className="absolute inset-0 bg-linear-to-br from-purple-500/10 to-transparent opacity-50" />
            <HiOutlineShieldCheck className="h-20 w-20 text-v8-primary relative z-10" />
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-white dark:bg-zinc-800 border-4 border-zinc-50 dark:border-zinc-950 flex items-center justify-center shadow-lg z-20">
            <HiOutlineLockClosed className="h-5 w-5 text-v8-primary" />
          </div>
        </div>

        <div className="max-w-md space-y-4">
          <h1
            className="text-2xl font-black tracking-tight"
            style={{ color: 'var(--text-primary)' }}
          >
            Your Digital Safe
          </h1>
          <p
            className="text-sm font-medium leading-relaxed"
            style={{ color: 'var(--text-tertiary)' }}
          >
            The Personal Vault is a protected area in V8id where you can store your most important
            or sensitive documents without compromising on accessibility.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <button className="px-8 py-3 rounded-full bg-v8-primary text-white font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-purple-500/25">
            Unlock with Biometrics
          </button>
          <button
            className="px-8 py-3 rounded-full border font-black uppercase tracking-widest text-[10px] transition-all hover:bg-zinc-50 dark:hover:bg-zinc-800"
            style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
          >
            Use Recovery Key
          </button>
        </div>

        <div className="grid grid-cols-3 gap-8 pt-8">
          {[
            { label: 'AES-256', sub: 'Encryption' },
            { label: '2FA', sub: 'Required' },
            { label: 'Zero', sub: 'Knowledge' },
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-[10px] font-black uppercase tracking-widest text-v8-primary">
                {stat.label}
              </span>
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                {stat.sub}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
