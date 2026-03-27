'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useAttendee } from '@/hooks/useAttendee';
import { PageLoading } from '@/components/shared/LoadingSpinner';

const adminNavItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/sessoes', label: 'Sessoes', icon: '📅' },
  { href: '/admin/participantes', label: 'Participantes', icon: '👥' },
  { href: '/admin/patrocinadores', label: 'Patrocinadores', icon: '🏢' },
  { href: '/admin/checkin', label: 'Check-in', icon: '📷' },
  { href: '/admin/push', label: 'Push', icon: '🔔' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { attendee, loading: attendeeLoading } = useAttendee();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!attendeeLoading && attendee && attendee.ticket_type !== 'admin' && attendee.ticket_type !== 'organizer') {
      router.push('/evento');
    }
  }, [attendee, attendeeLoading, router]);

  if (authLoading || attendeeLoading) return <PageLoading />;
  if (!user || !attendee) return null;
  if (attendee.ticket_type !== 'admin' && attendee.ticket_type !== 'organizer') return null;

  return (
    <div className="min-h-screen bg-navy">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-navy-light border-b border-white/10 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
              <span className="text-xs font-bold text-navy-dark">CV</span>
            </div>
            <span className="font-bold text-sm text-white">Admin</span>
          </div>
          <Link
            href="/evento"
            className="text-xs text-accent-500 font-medium"
          >
            Voltar ao app
          </Link>
        </div>
      </header>

      {/* Nav Tabs */}
      <nav className="bg-navy-light border-b border-white/10 px-4 overflow-x-auto">
        <div className="flex gap-1 max-w-4xl mx-auto py-2 scrollbar-hide">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-accent-500 text-navy-dark'
                    : 'text-silver/60 hover:bg-white/10'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto">
        {children}
      </main>
    </div>
  );
}
