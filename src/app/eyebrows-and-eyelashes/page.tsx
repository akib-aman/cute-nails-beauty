// app/eyebrows-and-eyelashes/page.tsx
import Head from 'next/head';
import { FeaturesData } from '@/app/api/data';

export default function BrowsPage() {
  const feature = FeaturesData.find(f => f.heading.includes('Eyebrows'));

  return (
    <>
      <Head>
        <title>Eyebrows & Lashes Edinburgh | Cute Threading Nails & Beauty</title>
        <meta
          name="description"
          content="Tinting, shaping, threading & lash extensions in Clermiston, Edinburgh. Visit Cute Threading Nails & Beauty to elevate your natural look."
        />
        <link rel="canonical" href="https://cute-nails-beauty.vercel.app/eyebrows-and-eyelashes" />
        <meta property="og:title" content="Brow & Lash Treatments in Edinburgh | Cute Threading" />
        <meta property="og:description" content="Enhance your brows and lashes with our expert tinting and extensions." />
        <meta property="og:image" content={feature?.imgSrc || '/images/meta/brows.jpg'} />
      </Head>
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">Eyebrows & Eyelashes</h1>
        <p className="mb-6">
          Whether you're after fuller brows, defined lashes, or a bold new look, our beauty experts are here to help.
        </p>
        {/* Inject Brows & Lashes UI Here */}
      </main>
    </>
  );
}
