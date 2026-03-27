'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAttendee } from '@/hooks/useAttendee';
import { useEvent } from '@/hooks/useEvent';
import { Header } from '@/components/layout/Header';
import { Navbar } from '@/components/layout/Navbar';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { AdminViewSwitcher } from '@/components/views/AdminViewSwitcher';
import { useViewMode } from '@/hooks/useViewMode';
import { createSupabaseBrowser } from '@/lib/supabase';

const MAX_LOADING_MS = 12000; // Maximum time to show loading spinner

export default function EventoLayout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { attendee, loading: attendeeLoading } = useAttendee();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Safety timeout to prevent infinite loading
  useEffect(() => {
    if (authLoading || attendeeLoading) {
      timeoutRef.current = setTimeout(() => {
        console.warn('Layout loading timeout reached');
        setLoadingTimeout(true);
      }, MAX_LOADING_MS);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [authLoading, attendeeLoading]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    // Se o usuário está logado mas não tem registro de participante, redirecionar para completar perfil
    if (!authLoading && !attendeeLoading && user && !attendee) {
      setRedirecting(true);
      router.push('/completar-perfil');
    }
  }, [user, authLoading, attendee, attendeeLoading, router]);

  // Show error state if loading took too long
  if (loadingTimeout && (authLoading || attendeeLoading)) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-white text-lg font-semibold mb-2">Erro de conexão</h2>
          <p className="text-silver/60 text-sm mb-6">
            Não foi possível carregar seus dados. Verifique sua conexão e tente novamente.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-accent-500 text-navy font-semibold rounded-xl hover:bg-accent-400 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (authLoading || attendeeLoading || redirecting) return <PageLoading />;
  if (!user || !attendee) return null;

  return (
    <div className="min-h-screen bg-navy">
      <Header />
      <main className="pb-20">{children}</main>
      <Navbar />
      {/* Admin View Switcher — only for admin/organizer/staff */}
      {['admin', 'organizer', 'staff'].includes(attendee.ticket_type) && (
        <AdminViewSwitcherWrapper attendeeTicketType={attendee.ticket_type} />
      )}
    </div>
  );
}

function AdminViewSwitcherWrapper({ attendeeTicketType }: { attendeeTicketType: string }) {
  const { event } = useEvent();
  const router = useRouter();
  const [sponsors, setSponsors] = useState<{ id: string; name: string; logo_url: string | null }[]>([]);
  const { viewMode, switchTo } = useViewMode('admin');

  useEffect(() => {
    if (!event) return;
    const supabase = createSupabaseBrowser();
    supabase
      .from('event_sponsors')
      .select('id, name, logo_url')
      .eq('event_id', event.id)
      .eq('active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setSponsors(data);
      });
  }, [event]);

  const handleSwitch = (mode: 'participante' | 'patrocinador' | 'admin', sponsorId?: string) => {
    switchTo(mode, sponsorId);
    if (mode === 'admin') {
      router.push('/admin');
    } else if (mode === 'patrocinador' && sponsorId) {
      router.push(`/evento/view?mode=patrocinador&sponsorId=${sponsorId}`);
    } else if (mode === 'participante') {
      router.push('/evento/view?mode=participante');
    }
  };

  return (
    <AdminViewSwitcher
      currentMode={viewMode}
      sponsors={sponsors}
      onSwitch={handleSwitch}
    />
  );
}
