'use client';

import { MessageCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

const whatsappUrl =
  'https://wa.me/919876543210?text=Hello%20Vasavi%20Hospital%2C%20I%20need%20help%20with%20an%20appointment.';

export function WhatsAppWidget() {
  const pathname = usePathname();

  if (pathname.startsWith('/dashboard') || pathname === '/login') return null;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Vasavi Hospital on WhatsApp"
      className="group fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-[#25D366] p-3.5 text-white shadow-xl shadow-emerald-900/20 transition hover:-translate-y-1 hover:bg-[#20bd5a] sm:bottom-7 sm:right-7 sm:px-5"
    >
      <MessageCircle size={24} fill="currentColor" />
      <span className="hidden text-sm font-semibold sm:inline">Chat on WhatsApp</span>
      <span className="absolute right-0 top-0 size-3 rounded-full border-2 border-white bg-red-500" />
    </a>
  );
}
