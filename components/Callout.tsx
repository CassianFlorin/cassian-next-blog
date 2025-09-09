import React from 'react';

export default function Callout({
  emoji,
  children,
}: {
  emoji?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="my-4 flex w-full max-w-full items-center rounded border-l-4 border-yellow-400 bg-yellow-50 p-3 sm:p-4 dark:bg-yellow-900/20">
      {emoji && <span className="mr-2 text-xl sm:text-2xl">{emoji}</span>}
      <div className="w-full text-sm break-words sm:text-base">{children}</div>
    </div>
  );
}
