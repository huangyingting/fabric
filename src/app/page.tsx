import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function RootEntryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/signin');
  }

  if (!session.user.hasFinishedOnboarding) {
    redirect('/onboard/profile');
  }

  const slug = session.user.defaultWorkspaceSlug || 'powlowskijoshuah-cq1od1';
  redirect(`/${slug}/home`);
}
