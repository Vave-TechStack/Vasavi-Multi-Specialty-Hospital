import type { Metadata } from 'next';
import { Inter, Poppins } from 'next/font/google';
import './globals.css';
import { SiteFooter, SiteHeader } from '@/components/site-shell';
import { WhatsAppWidget } from '@/components/whatsapp-widget';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-poppins' });

export const metadata: Metadata = {
  metadataBase: new URL('https://vasavihospital.com'),
  title: { default: 'Vasavi Multi Specialty Hospital', template: '%s | Vasavi Hospital' },
  description: 'Advanced multi-specialty healthcare with compassionate specialists, modern diagnostics, and 24/7 emergency care.',
  openGraph: { title: 'Vasavi Multi Specialty Hospital', description: 'Advanced healthcare with compassion and excellence.', type: 'website' },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
  manifest: '/manifest.json',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Hospital',
    name: 'Vasavi Multi Specialty Hospital',
    telephone: '+91-98765-43210',
    availableService: ['Emergency care', 'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics'],
    address: { '@type': 'PostalAddress', addressLocality: 'Hyderabad', addressRegion: 'Telangana', addressCountry: 'IN' },
  };
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        <SiteHeader />
        <main>{children}</main>
        <WhatsAppWidget />
        <SiteFooter />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      </body>
    </html>
  );
}
