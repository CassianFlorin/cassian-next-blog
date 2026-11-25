import type { ReactNode } from 'react';
import TextReveal from '@/components/motion/TextReveal';

interface Props {
  children: ReactNode;
}

/** Article title for the legacy post layouts: rises line by line on load. */
export default function PageTitle({ children }: Props) {
  return (
    <TextReveal
      as="h1"
      on="mount"
      className="text-2xl leading-tight font-bold tracking-tight text-gray-800 sm:text-3xl md:text-4xl dark:text-gray-100"
    >
      {children}
    </TextReveal>
  );
}
