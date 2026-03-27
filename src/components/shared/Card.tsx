import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'hover' | 'gold' | 'dark';
  className?: string;
  onClick?: () => void;
}

export function Card({ children, variant = 'default', className, onClick }: CardProps) {
  const base = 'rounded-2xl border p-4';
  const variants = {
    default: 'bg-white/5 border-white/5 backdrop-blur-sm',
    hover: 'bg-white/5 border-white/5 backdrop-blur-sm hover:bg-white/10 hover:border-gold/20 transition-all duration-300 cursor-pointer',
    gold: 'bg-white/5 border-gold/30 backdrop-blur-sm',
    dark: 'bg-[#0a1930] border-white/5',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(base, variants[variant], className)}
      onClick={onClick}
      {...(onClick ? { type: 'button' as const } : {})}
    >
      {children}
    </Component>
  );
}
