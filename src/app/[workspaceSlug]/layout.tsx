import React, { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WorkspaceProvider } from '@/components/workspace/WorkspaceContext';
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell';

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/signin');
  }

  const { workspaceSlug } = await params;

  return (
    <Suspense fallback={<div className="p-8 text-sm text-[#6B6B68]">Loading Fabric Workspace...</div>}>
      <WorkspaceProvider workspaceSlug={workspaceSlug}>
        <WorkspaceShell>{children}</WorkspaceShell>
      </WorkspaceProvider>
    </Suspense>
  );
}
