'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock de dados para o visual funcionar
const MOCK_PARTICIPANTES = [
  { id: 'p1', nome: 'Carlos Souza', cargo: 'CEO', empresa: 'TechNova', status: 'disponivel' },
  { id: 'p2', nome: 'Marina Silva', cargo: 'Diretora de Inovação', empresa: 'Grupo Alpha', status: 'conectado' },
  { id: 'p3', nome: 'Roberto Alves', cargo: 'Investidor Anjo', empresa: 'Capital Ventures', status: 'disponivel' },
  { id: 'p4', nome: 'Amanda Costa', cargo: 'CTO', empresa: 'StartCloud', status: 'disponivel' },
];

const MOCK_LEADS_STAND = [
  { id: 'l1', nome: 'João Pedro', cargo: 'Gerente de TI', empresa: 'Logística BR', hora: '10:45' },
  { id: 'l2', nome: 'Fernanda Lima', cargo: 'Fundadora', empresa: 'EcoTech', hora: '14:20' },
];

export default function PatrocinadorDashboard() {
  const [abaAtiva, setAbaAtiva] = useState<'explorar' | 'meus-leads'>('explorar');
  const [participantes, setParticipantes] = useState(MOCK_PARTICIPANTES);

  const handleConectar = (id: string) => {
    setParticipantes(prev => prev.map(p => 
      p.id === id ? { ...p, status: 'conectado' } : p
    ));
  };

  return (
    <div className="min-h-screen bg-[#030816] text-white font-sans pb-20">
      
      {/* HEADER DO PATROCINADOR */}
      <div className="bg-[#050B14] border-b border-white/10 pt-10 pb-10 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#F2C94C] to-yellow-600 flex items-center justify-center shadow-[0_0_30px_rgba(242,201,76,0.2)]">
              <span className="text-[#030816] font-display font-black text-2xl">GV</span>
            </div>
            <div>
              <span className="inline-block px-3 py-1 rounded-md bg-[#F2C94C]/10 border border-[#F2C94C]/30 text-[10px] uppercase tracking-widest font-bold text-[#F2C94C] mb-2">
                Patrocinador Ouro
              </span>
              <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tight">
                Galt's Valley
              </h1>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <span className="block text-3xl font-black text-white font-display">24</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Leads Gerados</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center min-w-[120px]">
              <span className="block text-3xl font-black text-[#F2C94C] font-display">Stand 05</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Sua Localização</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 mt-10">
        
        {/* TABS DE NAVEGAÇÃO */}
        <div className="flex gap-6 border-b border-white/10 mb-10">
          <button 
            onClick={() => setAbaAtiva('explorar')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
              abaAtiva === 'explorar' 
              ? 'text-[#F2C94C] border-b-2 border-[#F2C94C]' 
              : 'text-gray-500 hover:text-white'
            }`}
          >
            Explorar Participantes
          </button>
          <button 
            onClick={() => setAbaAtiva('meus-leads')}
            className={`pb-4 text-sm font-bold uppercase tracking-widest transition-all ${
              abaAtiva === 'meus-leads' 
              ? 'text-[#F2C94C] border-b-2 border-[#F2C94C]' 
              : 'text-gray-500 hover:text-white'
            }`}
          >
            Leads do Stand
          </button>
        </div>

        {/* CONTEÚDO DAS TABS */}
        {abaAtiva === 'explorar' ? (
          <div>
            <h2 className="text-2xl font-display font-black uppercase mb-6">Conexões Estratégicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {participantes.map(p => (
                <div key={p.id} className="bg-[#050B14] border border-white/5 rounded-3xl p-6 flex flex-col items-center text-center hover:border-white/20 transition-all group">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">👤</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{p.nome}</h3>
                  <p className="text-xs text-[#0055FF] font-bold uppercase tracking-widest mb-1">{p.cargo}</p>
                  <p className="text-sm text-gray-500 mb-6">{p.empresa}</p>
                  
                  <button 
                    onClick={() => handleConectar(p.id)}
                    disabled={p.status === 'conectado'}
                    className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                      p.status === 'conectado'
                      ? 'bg-green-500/10 text-green-500 border border-green-500/30 cursor-not-allowed'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-[#F2C94C] hover:text-[#030816] hover:border-[#F2C94C]'
                    }`}
                  >
                    {p.status === 'conectado' ? '✓ Conectado' : 'Conectar'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-display font-black uppercase">Visitantes do Stand</h2>
              <button className="px-6 py-2 bg-white/5 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest text-white hover:bg-white hover:text-black transition-colors">
                Exportar CSV
              </button>
            </div>
            <div className="bg-[#050B14] border border-white/10 rounded-3xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10">
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Contato</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Empresa</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Horário da Visita</th>
                    <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_LEADS_STAND.map(lead => (
                    <tr key={lead.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-white">{lead.nome}</div>
                        <div className="text-xs text-gray-500">{lead.cargo}</div>
                      </td>
                      <td className="p-4 text-sm text-gray-300">{lead.empresa}</td>
                      <td className="p-4 text-sm text-gray-300">{lead.hora}</td>
                      <td className="p-4 text-right">
                        <button className="text-[#F2C94C] text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                          Ver Perfil
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}