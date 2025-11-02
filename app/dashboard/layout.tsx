import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { GlobalVoiceHandler } from '@/components/calling/global-voice-handler';
import { MessageProcessorTrigger } from '@/components/background/message-processor-trigger';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-6">{children}</main>
      </div>
      {/* Global voice system - always active for incoming calls */}
      <GlobalVoiceHandler />
      {/* Background message processor - retries stuck messages */}
      <MessageProcessorTrigger />
    </div>
  );
}
