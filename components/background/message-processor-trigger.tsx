'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Client component that triggers background message processing
 * Runs on every route change to opportunistically process stuck messages
 * Fire-and-forget approach - doesn't block navigation or show errors to user
 */
export function MessageProcessorTrigger() {
  const pathname = usePathname();

  useEffect(() => {
    // Fire-and-forget: trigger background processing
    fetch('/api/messages/process-background', {
      method: 'POST',
    }).catch(() => {
      // Silent fail - this is opportunistic processing
      // Failures are logged server-side
    });
  }, [pathname]); // Run on route changes

  // This component renders nothing
  return null;
}
