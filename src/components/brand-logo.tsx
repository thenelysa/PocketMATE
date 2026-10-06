import Link from 'next/link';
import { cn } from '@/components/ui';

export function BrandLogo({ inverse = false, className }: { inverse?: boolean; className?: string }) {
  return (
    <Link href="/" aria-label="PocketMATE home" className={cn('brand-logo', inverse && 'brand-logo-inverse', className)}>
      <span className="brand-logo-image" aria-hidden="true" />
      <span className="brand-logo-name">Pocket<span>MATE</span></span>
    </Link>
  );
}
