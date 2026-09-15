import { Link } from 'react-router-dom';

/** The link from a card to the section behind it. Lives in the card header, every time. */
export function SectionLink({ to, children }: { to: string; children: string }) {
  return (
    <Link
      to={to}
      className="shrink-0 text-xs font-semibold whitespace-nowrap text-brand underline-offset-4 hover:underline"
    >
      {children} →
    </Link>
  );
}
