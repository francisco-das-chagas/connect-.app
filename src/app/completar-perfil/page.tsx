'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAttendee } from '@/hooks/useAttendee';
import { registerAttendeeInCRM } from '@/lib/crm-integration';
import { createSupabaseBrowser } from '@/lib/supabase';
import { INTEREST_OPTIONS } from '@/types';
import { EVENT_CONFIG } from '@/config/event';
import { PageLoading } from '@/components/shared/LoadingSpinner';
import { isValidCPF, maskCPF, cleanCPF } from '@/lib/cpf';
import { sanitizeText, sanitizeUrl, sanitizePhone, MAX_LENGTHS } from '@/lib/sanitize';

export default function CompletarPerfilPage() {
  const { user, loading: authLoading } = useAuth();
  const { attendee, loading: attendeeLoading } = useAttendee();
  const router = useRouter();

  const isEditing = !!attendee;

  const [form, setForm] = useState({
    full_name: '',
    cpf: '',
    company: '',
    job_title: '',
    phone: '',
    linkedin_url: '',
    interests: [] as string[],
    networking_visible: true,
    lgpd_consent: false,
  });
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [cpfError, setCpfError] = useState('');
  const [cpfApproved, setCpfApproved] = useState<boolean | null>(null);
  const [checkingCpf, setCheckingCpf] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (attendee) {
      setForm({
        full_name: attendee.full_name || '',
        cpf: attendee.cpf || '',
        company: attendee.company || '',
        job_title: attendee.job_title || '',
        phone: attendee.phone || '',
        linkedin_url: attendee.linkedin_url || '',
        interests: attendee.interests || [],
        networking_visible: attendee.networking_opt_in ?? true,
        lgpd_consent: true, // Already consented during registration
      });
      if (attendee.cpf) {
        setCpfApproved(true); // Already registered, CPF was validated
      }
    } else if (user) {
      setForm((f) => ({
        ...f,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      }));
    }
  }, [user, authLoading, attendee]);

  const toggleInterest = (interest: string) => {
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(interest)
        ? f.interests.filter((i) => i !== interest)
        : [...f.interests, interest],
    }));
  };

  // Validate CPF against approved list
  const handleCpfChange = (value: string) => {
    const masked = maskCPF(value);
    setForm((f) => ({ ...f, cpf: masked }));
    setCpfError('');
    setCpfApproved(null);
  };

  const validateCpf = async () => {
    const cleaned = cleanCPF(form.cpf);
    if (cleaned.length !== 11) {
      setCpfError('CPF deve ter 11 digitos.');
      return false;
    }
    if (!isValidCPF(cleaned)) {
      setCpfError('CPF invalido. Verifique os digitos.');
      return false;
    }

    setCheckingCpf(true);
    setCpfError('');

    try {
      const supabase = createSupabaseBrowser();

      // Get event ID
      const { data: event } = await supabase
        .from('events')
        .select('id')
        .eq('slug', EVENT_CONFIG.slug)
        .single();

      if (!event) {
        setCpfError('Evento nao encontrado.');
        setCheckingCpf(false);
        return false;
      }

      // Check approved list
      const { data: approved } = await supabase
        .from('event_approved_attendees')
        .select('id, full_name, ticket_type')
        .eq('event_id', event.id)
        .eq('cpf', cleaned)
        .eq('approved', true)
        .maybeSingle();

      if (!approved) {
        setCpfError('CPF nao encontrado na lista de participantes aprovados. Entre em contato com a organizacao do evento.');
        setCpfApproved(false);
        setCheckingCpf(false);
        return false;
      }

      // Auto-fill name if available
      if (approved.full_name && !form.full_name) {
        setForm((f) => ({ ...f, full_name: approved.full_name || f.full_name }));
      }

      setCpfApproved(true);
      setCheckingCpf(false);
      return true;
    } catch {
      setCpfError('Erro ao verificar CPF. Tente novamente.');
      setCheckingCpf(false);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !form.full_name) return;

    // Validate CPF for new registrations
    if (!isEditing) {
      const cleaned = cleanCPF(form.cpf);
      if (!cleaned) {
        setCpfError('CPF e obrigatorio.');
        return;
      }
      if (!isValidCPF(cleaned)) {
        setCpfError('CPF invalido.');
        return;
      }
      // If not yet validated against approved list, do it now
      if (cpfApproved !== true) {
        const isApproved = await validateCpf();
        if (!isApproved) return;
      }
    }

    setSaving(true);
    setError('');

    try {
      const supabase = createSupabaseBrowser();

      if (isEditing && attendee) {
        // Sanitize all inputs before DB update
        const { error: updateError } = await supabase
          .from('event_attendees')
          .update({
            full_name: sanitizeText(form.full_name, MAX_LENGTHS.name),
            cpf: cleanCPF(form.cpf) || null,
            company: form.company ? sanitizeText(form.company, MAX_LENGTHS.company) : null,
            job_title: form.job_title ? sanitizeText(form.job_title, MAX_LENGTHS.jobTitle) : null,
            phone: form.phone ? sanitizePhone(form.phone) : null,
            linkedin_url: form.linkedin_url ? sanitizeUrl(form.linkedin_url) : null,
            interests: form.interests.map(i => sanitizeText(i, 100)).filter(Boolean).slice(0, 20),
            networking_opt_in: form.networking_visible,
          })
          .eq('id', attendee.id);

        if (updateError) {
          setError('Erro ao atualizar perfil. Tente novamente.');
        } else {
          router.push('/evento/meu-perfil');
        }
      } else {
        const { data: event } = await supabase
          .from('events')
          .select('id')
          .eq('slug', EVENT_CONFIG.slug)
          .single();

        if (!event) {
          setError('Evento nao encontrado.');
          setSaving(false);
          return;
        }

        // Sanitize inputs before registration (double-sanitized: also done in CRM lib)
        const { error: regError } = await registerAttendeeInCRM({
          event_id: event.id,
          user_id: user.id,
          full_name: sanitizeText(form.full_name, MAX_LENGTHS.name),
          email: user.email!,
          cpf: cleanCPF(form.cpf),
          phone: form.phone ? sanitizePhone(form.phone) : undefined,
          company: form.company ? sanitizeText(form.company, MAX_LENGTHS.company) : undefined,
          job_title: form.job_title ? sanitizeText(form.job_title, MAX_LENGTHS.jobTitle) : undefined,
          interests: form.interests.map(i => sanitizeText(i, 100)).filter(Boolean),
          linkedin_url: form.linkedin_url ? sanitizeUrl(form.linkedin_url) : undefined,
        });

        if (regError) {
          setError('Erro ao criar perfil. Tente novamente.');
        } else {
          router.push('/evento');
        }
      }
    } catch {
      setError('Erro inesperado. Tente novamente.');
    }
    setSaving(false);
  };

  const validateStep = async (currentStep: number): Promise<boolean> => {
    if (currentStep === 1) {
      if (!form.full_name.trim()) {
        setError('Nome completo e obrigatorio.');
        return false;
      }
      if (!isEditing) {
        const cleaned = cleanCPF(form.cpf);
        if (!cleaned) {
          setCpfError('CPF e obrigatorio.');
          return false;
        }
        if (!isValidCPF(cleaned)) {
          setCpfError('CPF invalido.');
          return false;
        }
        if (cpfApproved !== true) {
          const isApproved = await validateCpf();
          if (!isApproved) return false;
        }
      }
      setError('');
      return true;
    }
    if (currentStep === 2) {
      // No required fields on step 2
      setError('');
      return true;
    }
    if (currentStep === 3) {
      if (!isEditing && !form.lgpd_consent) {
        setError('Voce precisa aceitar a politica de privacidade para continuar.');
        return false;
      }
      setError('');
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    const valid = await validateStep(step);
    if (valid) {
      setStep((s) => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const STEPS = [
    { num: 1, label: 'Dados' },
    { num: 2, label: 'Prof' },
    { num: 3, label: 'Pref' },
  ];

  if (authLoading || attendeeLoading) return <PageLoading />;

  return (
    <div className="min-h-screen bg-hero-gradient">
      <div className="max-w-lg mx-auto px-6 pt-8 pb-12">
        {/* Header */}
        <div className="mb-8">
          {isEditing && (
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-silver/50 text-sm mb-4 hover:text-silver transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Voltar
            </button>
          )}
          <div className="w-3 h-3 rounded-full bg-accent-500 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-1">
            {isEditing ? 'Editar perfil' : 'Complete seu perfil'}
          </h1>
          <p className="text-silver/60 text-sm">
            {isEditing
              ? 'Atualize suas informacoes de perfil.'
              : 'Estas informacoes ajudam no networking e conectam voce com os patrocinadores certos.'}
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-center mb-8">
          {STEPS.map((s, i) => {
            const isActive = step === s.num;
            const isCompleted = step > s.num;
            return (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                      isCompleted
                        ? 'bg-green-400/20 border-green-400 text-green-400'
                        : isActive
                          ? 'bg-accent-500/20 border-accent-500 text-accent-500'
                          : 'bg-white/5 border-white/10 text-silver/40'
                    }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-medium ${
                      isCompleted
                        ? 'text-green-400'
                        : isActive
                          ? 'text-accent-500'
                          : 'text-silver/40'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-16 h-0.5 mx-1 mb-4 transition-colors ${
                      step > s.num ? 'bg-green-400' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Step 1 — Dados Pessoais */}
          {step === 1 && (
            <>
              {/* CPF */}
              <div>
                <label className="block text-sm font-medium text-silver/70 mb-1">
                  CPF {!isEditing && '*'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.cpf}
                    onChange={(e) => handleCpfChange(e.target.value)}
                    onBlur={() => {
                      if (cleanCPF(form.cpf).length === 11 && !isEditing) validateCpf();
                    }}
                    className={`input pr-10 ${cpfError ? 'border-red-500/50' : cpfApproved === true ? 'border-green-500/50' : ''}`}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    required={!isEditing}
                    inputMode="numeric"
                  />
                  {checkingCpf && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="w-4 h-4 border-2 border-accent-500/30 border-t-accent-500 rounded-full animate-spin" />
                    </div>
                  )}
                  {cpfApproved === true && !checkingCpf && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                  )}
                </div>
                {cpfError && <p className="text-xs text-red-400 mt-1">{cpfError}</p>}
                {cpfApproved === true && (
                  <p className="text-xs text-green-400 mt-1">CPF aprovado para o evento</p>
                )}
                {!isEditing && (
                  <p className="text-[10px] text-silver/30 mt-1">
                    Seu CPF sera validado na lista de participantes aprovados.
                  </p>
                )}
              </div>

              {/* Nome completo */}
              <div>
                <label className="block text-sm font-medium text-silver/70 mb-1">Nome completo *</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="input"
                  placeholder="Seu nome"
                  required
                  maxLength={MAX_LENGTHS.name}
                />
              </div>
            </>
          )}

          {/* Step 2 — Profissional */}
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-silver/70 mb-1">Empresa</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm({ ...form, company: e.target.value })}
                  className="input"
                  placeholder="Onde voce trabalha"
                  maxLength={MAX_LENGTHS.company}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-silver/70 mb-1">Cargo</label>
                <input
                  type="text"
                  value={form.job_title}
                  onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                  className="input"
                  placeholder="Sua funcao"
                  maxLength={MAX_LENGTHS.jobTitle}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-silver/70 mb-1">Telefone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input"
                  placeholder="(62) 99999-9999"
                  maxLength={MAX_LENGTHS.phone}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-silver/70 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={form.linkedin_url}
                  onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })}
                  className="input"
                  placeholder="https://linkedin.com/in/seu-perfil"
                  maxLength={MAX_LENGTHS.url}
                />
              </div>
            </>
          )}

          {/* Step 3 — Preferencias */}
          {step === 3 && (
            <>
              <div>
                <label className="block text-sm font-medium text-silver/70 mb-2">Areas de interesse</label>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((interest) => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        form.interests.includes(interest)
                          ? 'bg-accent-500 text-navy-dark'
                          : 'bg-white/5 text-silver/60 hover:bg-white/10 border border-white/10'
                      }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                <div>
                  <p className="font-medium text-white text-sm">Aparecer no networking</p>
                  <p className="text-xs text-silver/50">Outros participantes poderao te encontrar</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, networking_visible: !form.networking_visible })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    form.networking_visible ? 'bg-accent-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      form.networking_visible ? 'left-[26px]' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* LGPD Consent Checkbox - required for new registrations */}
              {!isEditing && (
                <label className="flex items-start gap-3 p-4 bg-white/5 rounded-xl border border-white/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.lgpd_consent}
                    onChange={(e) => setForm({ ...form, lgpd_consent: e.target.checked })}
                    className="mt-0.5 w-4 h-4 rounded border-white/30 bg-white/10 text-accent-500 focus:ring-accent-500 focus:ring-offset-0 flex-shrink-0"
                  />
                  <span className="text-xs text-silver/60 leading-relaxed">
                    Li e concordo com a politica de privacidade e autorizo o compartilhamento dos meus dados pessoais com os patrocinadores do evento, conforme a LGPD (Lei Geral de Protecao de Dados). *
                  </span>
                </label>
              )}
            </>
          )}

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Navigation buttons */}
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 py-3 px-4 rounded-xl text-sm font-medium bg-white/5 text-silver/70 border border-white/10 hover:bg-white/10 transition-colors"
              >
                Voltar
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={checkingCpf}
                className="flex-1 btn-primary text-lg"
              >
                {checkingCpf ? 'Verificando...' : 'Proximo'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={saving || !form.full_name || (!isEditing && (cpfApproved !== true || !form.lgpd_consent))}
                className="flex-1 btn-primary text-lg"
              >
                {saving ? 'Salvando...' : isEditing ? 'Salvar alteracoes' : 'Entrar no evento'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
