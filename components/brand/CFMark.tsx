interface Props {
  className?: string;
}

/**
 * The CF monogram — the site's primary mark. Set in the editorial serif so it
 * echoes the gold CF in the portrait, and kept as live text so it scales with
 * the surrounding type instead of shipping another asset.
 */
export default function CFMark({ className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      className={`type-editorial inline-block leading-none tracking-[-0.06em] ${className}`}
    >
      CF
    </span>
  );
}
