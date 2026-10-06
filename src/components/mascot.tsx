import Image from 'next/image';
import { cn } from '@/components/ui';

/** PocketMATE's original bill mascot, shared across the app. */
export function Mascot({ className, pose = 'waving' }: { className?: string; pose?: 'waving' | 'pointing' }) {
  const pointing = pose === 'pointing';
  return (
    <>
    <Image
      src={pointing ? "/images/pointing-pistachio.png" : "/images/mascot-bill-pistachio.png"}
      alt={pointing ? "Sikka, a pistachio wallet pointing toward your next step" : "PocketMATE mascot, a pale-green wallet holding a bill and waving"}
      width={pointing ? 1230 : 1218}
      height={pointing ? 1278 : 1292}
      sizes="(max-width: 640px) 175px, 214px"
      className={cn('mascot mascot-light', className)}
    />
    <Image
      src={pointing ? "/images/pointing-beige.png" : "/images/mascot-bill-beige.png"}
      alt={pointing ? "Sikka, a soft beige wallet pointing toward your next step" : "PocketMATE mascot, a soft beige wallet holding a bill and waving"}
      width={pointing ? 1230 : 1218}
      height={pointing ? 1278 : 1292}
      sizes="(max-width: 640px) 175px, 214px"
      className={cn('mascot mascot-dark', className)}
    />
    </>
  );
}
