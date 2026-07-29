import { serializeJsonLd } from '@/lib/structuredData';

/** Renders a schema.org payload as a JSON-LD script tag. */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
