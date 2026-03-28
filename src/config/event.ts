export const EVENT_CONFIG = {
  slug: (process.env.NEXT_PUBLIC_EVENT_SLUG || 'connect-valley-2026').trim(),
  name: process.env.NEXT_PUBLIC_EVENT_NAME || 'Connect Valley 2026',
  edition: '7a edicao',
  tagline: 'O futuro comeca agora',
  subtitle: 'Conectando pessoas, ideias e negocios',
  manifesto:
    'O Connect Valley e uma manifestacao do espirito empreendedor, inspirado na ideia de que sao os grandes pensadores, inovadores e lideres que sustentam o mundo.',
  dates: {
    start: '2026-10-16T13:00:00-03:00',
    end: '2026-10-17T19:00:00-03:00',
    display: '16 e 17 de Outubro de 2026',
    day1: {
      date: '2026-10-16',
      label: 'Dia 01 - 16/10',
      start: '13:00',
      end: '20:30'
    },
    day2: {
      date: '2026-10-17',
      label: 'Dia 02 - 17/10',
      start: '10:00',
      end: '19:00'
    }
  },
  venue: 'Centro de Convencoes de Sobral',
  address: 'Centro de Convencoes de Sobral, Sobral - CE',
  city: 'Sobral',
  uf: 'CE',
  location: 'Sobral/CE',
  stats: {
    speakers: '+40',
    hours: '48hrs',
    hoursLabel: 'Horas Imersivas',
    participants: '+1000',
    expectedParticipants: '1250',
    spaces: '4',
    spacesLabel: 'Espacos Simultaneos',
    workshops: '4-6',
    workshopsLabel: 'Oficinas por dia'
  },
  growth: [
    { year: '2023', people: '300', revenue: '353k' },
    { year: '2024', people: '600', revenue: '384k' },
    { year: '2025', people: '800', revenue: '528k' },
    { year: '2026', people: '1250', revenue: '825k', highlight: true }
  ],
  theme: {
    primaryColor: '#030816',
    accentColor: '#F2C94C',
    goldColor: '#F2C94C',
    navyColor: '#030816',
    navyLightColor: '#0a1930',
    cyanAccent: '#67e8f9'
  },
  social: {
    instagram: 'https://www.instagram.com/connect.valley',
    linkedin: 'https://linkedin.com/company/connectvalley',
    website: 'https://www.connectvaley.com.br'
  },
  images: {
    logo: 'https://www.connectvaley.com.br/assets/connect-2026.svg',
    icon: 'https://www.connectvaley.com.br/assets/icone.svg',
    hero: 'https://www.connectvaley.com.br/assets/backgroundd.JPG',
    palco: 'https://www.connectvaley.com.br/assets/foto-dr-roneely.jpg',
    networking: 'https://www.connectvaley.com.br/assets/foto-5.JPG',
    galeria: [
      'https://www.connectvaley.com.br/assets/foto-2.JPG',
      'https://www.connectvaley.com.br/assets/foto-3.webp',
      'https://www.connectvaley.com.br/assets/foto-4.JPG',
      'https://www.connectvaley.com.br/assets/foto-5.JPG',
      'https://www.connectvaley.com.br/assets/foto-7-novo.JPG',
      'https://www.connectvaley.com.br/assets/foto-8.JPG',
      'https://www.connectvaley.com.br/assets/foto-9.JPG',
      'https://www.connectvaley.com.br/assets/foto-17.JPG'
    ]
  },
  tracks: [
    { name: 'IA & Tecnologia', color: '#F2C94C', slug: 'tech' },
    { name: 'Financas & Tributario', color: '#67e8f9', slug: 'financas' },
    { name: 'Marketing Digital', color: '#f472b6', slug: 'marketing' },
    { name: 'Gestao & Lideranca', color: '#a78bfa', slug: 'gestao' },
    { name: 'Empreendedorismo', color: '#34d399', slug: 'empreendedorismo' },
    { name: 'Reforma Tributaria', color: '#fb923c', slug: 'reforma' }
  ],
  keywords: [
    'Networking',
    'Inovacao',
    'Conteudo Pratico',
    'Negocios Reais',
    'Ecossistema Forte',
    'Transformacao Digital'
  ],
  sponsorTiers: {
    diamond: {
      label: 'Diamante',
      color: '#67e8f9',
      borderColor: 'rgba(103, 232, 249, 0.5)',
      bgColor: 'rgba(103, 232, 249, 0.05)',
      description: 'Palco principal - Palestra no palco Valley (15min)',
      benefits: [
        'Exclusividade por segmento',
        'Stand 3m x 3m x 3m',
        'Palestra no palco Valley (15min)',
        'Logo em destaque maior no site e materiais',
        'Exposicao da marca no telao nos intervalos',
        'Insercao de flyers',
        '8 vouchers para participar',
        '2 vagas Area VIP',
        '2 vagas lancamento oficial'
      ]
    },
    gold: {
      label: 'Ouro',
      color: '#F2C94C',
      borderColor: 'rgba(242, 201, 76, 0.5)',
      bgColor: 'rgba(242, 201, 76, 0.05)',
      description: 'Oficina - Ministra oficina no palco Valley (20min)',
      benefits: [
        'Stand 3m x 3m x 3m',
        'Logo em destaque no site e materiais',
        'Oficina no palco Valley (20min)',
        'Insercao de flyers',
        '5 vouchers para participar',
        '2 vagas Area VIP',
        '2 vagas lancamento oficial'
      ]
    },
    silver: {
      label: 'Prata',
      color: '#d1d5db',
      borderColor: 'rgba(209, 213, 219, 0.3)',
      bgColor: 'rgba(209, 213, 219, 0.05)',
      description: 'Exposicao - Balcao totem para divulgacao',
      benefits: [
        'Balcao totem para divulgacao',
        'Logo na area de patrocinadores do site',
        'Divulgacao no Instagram do evento',
        '2 vouchers para participar',
        '1 vaga Area VIP',
        '1 vaga lancamento oficial'
      ]
    }
  }
}
