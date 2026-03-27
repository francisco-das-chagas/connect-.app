import { createSupabaseBrowser } from './supabase';
import { sanitizeText, sanitizeUrl, sanitizePhone, MAX_LENGTHS } from './sanitize';

/**
 * Registra participante e cria/linka party no CRM.
 * Chamado apos completar perfil.
 *
 * SECURITY: CRM operations (parties, deals) are handled server-side
 * via SECURITY DEFINER RPCs to prevent unauthorized client-side access.
 * The attendee insert uses the user's own RLS policy.
 */
export async function registerAttendeeInCRM(attendeeData: {
  event_id: string;
  user_id: string;
  full_name: string;
  email: string;
  cpf?: string;
  phone?: string;
  company?: string;
  job_title?: string;
  interests: string[];
  linkedin_url?: string;
}) {
  const supabase = createSupabaseBrowser();

  // Sanitize all user inputs before sending to server
  const sanitizedName = sanitizeText(attendeeData.full_name, MAX_LENGTHS.name);
  const sanitizedCompany = attendeeData.company ? sanitizeText(attendeeData.company, MAX_LENGTHS.company) : null;
  const sanitizedJobTitle = attendeeData.job_title ? sanitizeText(attendeeData.job_title, MAX_LENGTHS.jobTitle) : null;
  const sanitizedPhone = attendeeData.phone ? sanitizePhone(attendeeData.phone) : null;
  const sanitizedLinkedin = attendeeData.linkedin_url ? sanitizeUrl(attendeeData.linkedin_url) : null;
  const sanitizedInterests = attendeeData.interests
    .map((i) => sanitizeText(i, 100))
    .filter(Boolean)
    .slice(0, 20);

  // Call server-side RPC that handles CRM party creation + attendee registration atomically
  const { data: result, error } = await supabase.rpc('register_attendee_with_crm', {
    p_event_id: attendeeData.event_id,
    p_user_id: attendeeData.user_id,
    p_full_name: sanitizedName,
    p_email: attendeeData.email,
    p_cpf: attendeeData.cpf || null,
    p_phone: sanitizedPhone,
    p_company: sanitizedCompany,
    p_job_title: sanitizedJobTitle,
    p_linkedin_url: sanitizedLinkedin,
    p_interests: sanitizedInterests,
  });

  if (error) {
    console.error('Registration RPC error:', error);
    return { attendee: null, partyId: null, error };
  }

  return {
    attendee: result?.attendee || null,
    partyId: result?.party_id || null,
    error: result?.error ? { message: result.error } : null,
  };
}

/**
 * Registra interacao com patrocinador e cria deal no CRM.
 *
 * SECURITY: CRM deal creation handled server-side via SECURITY DEFINER RPC.
 * Interaction insert uses the user's own RLS policy.
 */
export async function handleSponsorInteraction(data: {
  event_id: string;
  attendee_id: string;
  sponsor_id: string;
  interaction_type: string;
  message?: string;
}) {
  const supabase = createSupabaseBrowser();

  // Sanitize message before sending
  const sanitizedMessage = data.message ? sanitizeText(data.message, MAX_LENGTHS.mediumText) : null;

  // Call server-side RPC that handles interaction + CRM deal creation atomically
  const { data: result, error } = await supabase.rpc('handle_sponsor_interaction_with_crm', {
    p_event_id: data.event_id,
    p_attendee_id: data.attendee_id,
    p_sponsor_id: data.sponsor_id,
    p_interaction_type: data.interaction_type,
    p_message: sanitizedMessage,
  });

  if (error) {
    console.error('Interaction RPC error:', error);
    return { error: error.message };
  }

  return { success: result?.success || false, error: result?.error || null };
}
