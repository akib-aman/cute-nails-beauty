// app/nails/page.tsx
import Head from 'next/head';
import { FeaturesData } from '@/app/api/data';

export default function NailsPage() {
  const feature = FeaturesData.find(f => f.heading.includes('Vinylux'));

  return (
    <>
      <Head>
        <title>Nail Treatments Edinburgh | Cute Threading Nails & Beauty</title>
        <meta
          name="description"
          content="Explore Vinylux and Shellac manicures, acrylic extensions and more at our Edinburgh beauty salon. Book today for long-lasting, flawless nails."
        />
        <link rel="canonical" href="https://cute-nails-beauty.vercel.app/nails" />
        <meta property="og:title" content="Nail Treatments Edinburgh | Cute Threading Nails & Beauty" />
        <meta property="og:description" content="Shellac, Vinylux & acrylic nails in Clermiston, Edinburgh. Book online now!" />
        <meta property="og:image" content={feature?.imgSrc || '/images/meta/nails.jpg'} />
      </Head>
      <main className="p-6">
        <h1 className="text-3xl font-bold mb-4">Nail Treatments</h1>
        <p className="mb-6">
          From Vinylux to Shellac and acrylics, our expert team in Clermiston, Edinburgh delivers polished perfection every time.
        </p>
        {/* Inject Nail UI Here */}
      </main>
    </>
  );
}
