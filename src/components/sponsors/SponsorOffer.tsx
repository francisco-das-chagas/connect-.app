'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowser } from '@/lib/supabase';
import { awardPoints } from '@/lib/gamification';
import { useEvent } from '@/hooks/useEvent';
import type { EventAttendee, EventSponsorOffer } from '@/types';

interface SponsorOfferProps {
  sponsorId: string;
  attendee: EventAttendee | null;
}

export function SponsorOffer({ sponsorId, attendee }: SponsorOfferProps) {
  const { event } = useEvent();
  const [offers, setOffers] = useState<EventSponsorOffer[]>([]);
  const [claimedOffers, setClaimedOffers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();

    const fetchOffers = async () => {
      const { data, error: offersError } = await supabase
        .from('event_sponsor_offers')
        .select('id, sponsor_id, title, description, offer_type, code, valid_until, max_claims, claims_count, active, created_at')
        .eq('sponsor_id', sponsorId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (offersError) console.error('Error fetching offers:', offersError);
      else if (data) setOffers(data as EventSponsorOffer[]);

      // Check which offers user already claimed
      if (attendee) {
        const { data: claims, error: claimsError } = await supabase
          .from('event_offer_claims')
          .select('offer_id')
          .eq('attendee_id', attendee.id);

        if (claimsError) console.error('Error fetching claims:', claimsError);
        else if (claims) {
          setClaimedOffers(new Set(claims.map((c) => c.offer_id)));
        }
      }

      setLoading(false);
    };

    fetchOffers();
  }, [sponsorId, attendee]);

  const handleClaim = async (offer: EventSponsorOffer) => {
    if (!attendee || !event || claimedOffers.has(offer.id)) return;
    setClaiming(offer.id);

    try {
      const supabase = createSupabaseBrowser();

      // Use atomic server-side function to prevent race conditions
      const { data: result, error } = await supabase.rpc('claim_offer', {
        p_offer_id: offer.id,
        p_attendee_id: attendee.id,
      });

      if (error) {
        console.error('Claim RPC error:', error);
        return;
      }

      if (result?.success) {
        // Award gamification points via secure server function
        await supabase.rpc('award_gamification_points', {
          p_event_id: event.id,
          p_attendee_id: attendee.id,
          p_action: 'offer_claim',
        });

        // Create interaction record
        await supabase.from('event_interactions').insert({
          event_id: event.id,
          attendee_id: attendee.id,
          sponsor_id: sponsorId,
          interaction_type: 'offer_claim',
          metadata: { offer_id: offer.id, offer_title: offer.title },
        });

        setClaimedOffers((prev) => new Set([...prev, offer.id]));
        if (offer.code) setRevealedCode(offer.code);
      } else {
        console.warn('Claim failed:', result?.error);
      }
    } catch (err) {
      console.error('Claim error:', err);
    } finally {
      setClaiming(null);
    }
  };

  if (loading || offers.length === 0) return null;

  const offerTypeIcons: Record<string, string> = {
    coupon: '🏷️',
    download: '📥',
    demo: '🖥️',
    raffle: '🎰',
  };

  const offerTypeLabels: Record<string, string> = {
    coupon: 'Cupom',
    download: 'Download',
    demo: 'Demo',
    raffle: 'Sorteio',
  };

  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
        🎁 Ofertas exclusivas
      </h2>
      <div className="space-y-3">
        {offers.map((offer) => {
          const isClaimed = claimedOffers.has(offer.id);
          const isFull = offer.max_claims !== null && offer.claims_count >= offer.max_claims;

          return (
            <div
              key={offer.id}
              className="rounded-2xl border border-accent-500/30 bg-accent-500/5 p-4"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{offerTypeIcons[offer.offer_type] || '🎁'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-accent-500 bg-accent-500/20 px-2 py-0.5 rounded-full">
                      {offerTypeLabels[offer.offer_type] || offer.offer_type}
                    </span>
                    {offer.max_claims && (
                      <span className="text-[10px] text-silver/60">
                        {offer.claims_count}/{offer.max_claims} resgatados
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-white text-sm">{offer.title}</h3>
                  {offer.description && (
                    <p className="text-xs text-silver/60 mt-1">{offer.description}</p>
                  )}

                  {/* Revealed code */}
                  {isClaimed && offer.code && (
                    <div className="mt-3 p-2 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-[10px] text-green-400 font-medium mb-0.5">Seu codigo:</p>
                      <p className="text-lg font-mono font-bold text-green-400 tracking-wider">{offer.code}</p>
                    </div>
                  )}

                  {revealedCode && claiming === null && revealedCode === offer.code && (
                    <p className="text-xs text-green-400 mt-2">+10 pontos! 🎉</p>
                  )}
                </div>
              </div>

              {!isClaimed && (
                <button
                  onClick={() => handleClaim(offer)}
                  disabled={claiming === offer.id || !attendee || isFull}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent-500 text-navy-dark font-semibold text-sm hover:bg-accent-400 transition-colors disabled:opacity-50"
                >
                  {claiming === offer.id ? (
                    <div className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                  ) : (
                    <span>🎁</span>
                  )}
                  {claiming === offer.id ? 'Resgatando...' : isFull ? 'Esgotado' : 'Resgatar oferta'}
                </button>
              )}

              {isClaimed && (
                <div className="mt-3 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 font-semibold text-sm">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Resgatado!
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
