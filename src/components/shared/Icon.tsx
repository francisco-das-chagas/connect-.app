import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IconProps {
  icon: LucideIcon;
  size?: number;
  className?: string;
  label?: string;
}

/**
 * Standardized icon wrapper using lucide-react.
 * Always use this instead of inline SVGs or emojis for UI icons.
 */
export function Icon({ icon: LucideIcon, size = 20, className, label }: IconProps) {
  return (
    <LucideIcon
      size={size}
      className={className}
      aria-hidden={!label}
      aria-label={label}
    />
  );
}
