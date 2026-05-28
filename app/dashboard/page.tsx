export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getPatientDashboardData } from '@/actions/patient';
import { PatientDashboardClient } from './PatientDashboardClient';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const summary = await getPatientDashboardData(user.id);
  return <PatientDashboardClient {...summary} />;
}
