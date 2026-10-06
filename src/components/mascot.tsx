import Image from 'next/image';
import { cn } from '@/components/ui';

/** PocketMATE's original bill mascot, shared across the app. */
export function Mascot({ className }: { className?: string }) {
  return (
    <Image
      src="/images/mascot-bill-pistachio.png"
      alt="PocketMATE mascot, a pale-green wallet with muted teal accents holding a bill and waving"
      width={1218}
      height={1292}
      sizes="(max-width: 640px) 175px, 214px"
      className={cn('mascot', className)}
    />
  );
}
