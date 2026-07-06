import { Baby, Bone, Brain, CircleDot, Cross, HeartPulse, Ribbon, Stethoscope } from 'lucide-react';

export const departments = [
  { name: 'Cardiology', icon: HeartPulse, text: 'Advanced heart care, diagnostics and intervention.' },
  { name: 'Neurology', icon: Brain, text: 'Specialist care for brain, spine and nervous system.' },
  { name: 'Orthopedics', icon: Bone, text: 'Restoring mobility with precision and rehabilitation.' },
  { name: 'Pediatrics', icon: Baby, text: 'Thoughtful, complete care for infants and children.' },
  { name: 'Gynecology', icon: CircleDot, text: 'Comprehensive women’s health through every stage.' },
  { name: 'General Medicine', icon: Stethoscope, text: 'Preventive, diagnostic and long-term medical care.' },
  { name: 'Oncology', icon: Ribbon, text: 'Multidisciplinary cancer care and support.' },
  { name: 'Emergency Care', icon: Cross, text: 'Rapid response emergency medicine, around the clock.' },
];

export const doctors = [
  { name: 'Dr. Ananya Rao', role: 'Senior Cardiologist', exp: '18 years experience', image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=85', available: 'Available today' },
  { name: 'Dr. Arjun Mehta', role: 'Consultant Neurologist', exp: '14 years experience', image: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=85', available: 'Next: 10:30 AM' },
  { name: 'Dr. Meera Iyer', role: 'Orthopedic Surgeon', exp: '16 years experience', image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&w=700&q=85', available: 'Available today' },
  { name: 'Dr. Vikram Shah', role: 'Pediatrician', exp: '12 years experience', image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=700&q=85', available: 'Next: 12:00 PM' },
];


/** Dynamic fetch helpers - replace hardcoded data with API calls */
export async function fetchDoctorsFromApi(): Promise<typeof doctors> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
    const res = await fetch(apiUrl + '/public/doctors?limit=8');
    if (!res.ok) throw new Error('API unavailable');
    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return doctors;
    return data.map((d: any) => ({
      name: d.user?.name || 'Medical Specialist',
      role: d.specialization || d.department?.name || 'Specialist',
      exp: d.experienceYears ? d.experienceYears + ' years experience' : 'Experienced',
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=700&q=85',
      available: 'Available today',
    }));
  } catch {
    return doctors; // fallback to static data
  }
}
