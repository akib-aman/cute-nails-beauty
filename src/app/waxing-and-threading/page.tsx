// app/waxing-and-threading/page.tsx
import Head from 'next/head';
import { FeaturesData } from '@/app/api/data';

export default function WaxingPage() {
  const feature = FeaturesData.find(f => f.heading.includes('Waxing'));

  return (
    <>
      <Head>
        <title>Waxing & Threading Edinburgh | Cute Threading Nails & Beauty</title>
        <meta
          name="description"
          content="Silky-smooth skin with expert waxing & threading for face, arms, and legs in Clermiston, Edinburgh. Book your treatment online today."
        />
        <link rel="canonical" href="https://cute-nails-beauty.vercel.app/waxing-and-threading" />
        <meta property="og:title" content="Waxing & Threading | Cute Threading Nails & Beauty" />
        <meta property="og:description" content="Professional facial and body waxing services in Edinburgh. Book online." />
        <meta property="og:image" content={feature?.imgSrc || '/images/meta/waxing.jpg'} />
      </Head>
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">Waxing & Threading</h1>
        <p className="mb-6">
          Enjoy smooth, hair-free results with precise waxing and threading, performed by our experienced team in Edinburgh.
        </p>
        {/* Inject Waxing UI Here */}
      </main>
    </>
  );
}
