import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { DoctorSidebar } from '@/components/layout/DoctorSidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { createClient } from '@/lib/supabase/server';

export default async function DoctorLayout({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: verificationStatus, error: verificationError } = await supabase.rpc(
    'get_doctor_verification_status',
    { p_doctor_id: user.id },
  );

  if (verificationError || !verificationStatus || verificationStatus === 'REJECTED') {
    redirect('/auth/verify-professional');
  }

  if (verificationStatus === 'PENDING') {
    redirect('/profile');
  }

  return (
    <div className="min-h-screen lg:flex">
      <DoctorSidebar />
      <div className="flex min-h-screen flex-1 flex-col bg-slate-50">
        <Navbar />
        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 lg:px-8 lg:pb-6">{children}</main>
      </div>
      <MobileNav variant="doctor" />
    </div>
  );
}
