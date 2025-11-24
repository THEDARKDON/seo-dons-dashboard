import { MessageLayout } from '@/components/messages/message-layout';

export default function MessagesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-gray-500">
          Communicate with your team via channels and direct messages
        </p>
      </div>

      <MessageLayout />
    </div>
  );
}
