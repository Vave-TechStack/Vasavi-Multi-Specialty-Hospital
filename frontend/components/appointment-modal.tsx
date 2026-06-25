'use client';

import { X } from 'lucide-react';
import { AppointmentForm } from '@/components/appointment-form';

type Props = {
  onClose: () => void;
};

export function AppointmentModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          <X size={24} />
        </button>
        <h2 className="mb-4 text-2xl font-semibold text-center">Book an Appointment</h2>
        <AppointmentForm />
      </div>
    </div>
  );
}
