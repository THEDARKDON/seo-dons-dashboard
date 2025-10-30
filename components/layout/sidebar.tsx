'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Briefcase,
  Phone,
  Calendar,
  DollarSign,
  Trophy,
  BarChart3,
  Settings,
  Users,
  Award,
  History,
  Shield,
  Linkedin,
  Kanban,
  UserPlus,
  Crown,
  UserCog,
  PhoneCall,
  MessageSquare,
  Mail,
  Send,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'SMS', href: '/dashboard/sms', icon: MessageSquare },
  { name: 'Email', href: '/dashboard/email', icon: Mail },
  { name: 'Leads', href: '/dashboard/leads', icon: UserPlus },
  { name: 'Pipeline', href: '/dashboard/pipeline', icon: Kanban },
  { name: 'Deals', href: '/dashboard/deals', icon: Briefcase },
  { name: 'Customers', href: '/dashboard/customers', icon: Users },
  { name: 'Call History', href: '/dashboard/calls/history', icon: History },
  { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
  { name: 'Commissions', href: '/dashboard/commissions', icon: DollarSign },
  { name: 'Social Media', href: '/dashboard/social', icon: Linkedin },
  { name: 'Achievements', href: '/dashboard/achievements', icon: Award },
  { name: 'Leaderboard', href: '/dashboard/leaderboard', icon: Trophy },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { name: 'Compliance', href: '/dashboard/compliance', icon: Shield },
  { name: 'Auto Send', href: '/dashboard/auto-send', icon: Send },
];

const adminNavigation = [
  { name: 'Admin Dashboard', href: '/dashboard/admin', icon: Crown },
  { name: 'SDR Performance', href: '/dashboard/admin/sdrs', icon: Trophy },
  { name: 'User Management', href: '/dashboard/admin/users', icon: UserCog },
  { name: 'Phone Numbers', href: '/dashboard/admin/phone-numbers', icon: PhoneCall },
  { name: 'Admin Settings', href: '/dashboard/admin/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const [isAdmin, setIsAdmin] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<{ sms: number; email: number }>({
    sms: 0,
    email: 0,
  });

  useEffect(() => {
    // Check if user is admin by fetching from Supabase
    async function checkAdmin() {
      if (user) {
        try {
          const response = await fetch('/api/user/role');
          const data = await response.json();
          setIsAdmin(data.role === 'admin');
        } catch (error) {
          console.error('Error checking admin status:', error);
        }
      }
    }
    checkAdmin();
  }, [user]);

  useEffect(() => {
    // Fetch unread counts for SMS and Email
    async function fetchUnreadCounts() {
      try {
        const [smsRes, emailRes] = await Promise.all([
          fetch('/api/sms/conversations'),
          fetch('/api/email/conversations'),
        ]);

        const smsData = await smsRes.json();
        const emailData = await emailRes.json();

        const smsUnread = smsData.conversations?.filter((c: any) => c.unread_count > 0).length || 0;
        const emailUnread = emailData.threads?.filter((t: any) => !t.read).length || 0;

        setUnreadCounts({ sms: smsUnread, email: emailUnread });
      } catch (error) {
        console.error('Error fetching unread counts:', error);
      }
    }

    fetchUnreadCounts();
    const interval = setInterval(fetchUnreadCounts, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex h-screen w-64 flex-col fixed left-0 top-0 bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <h1 className="text-xl font-bold">SEO Dons</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const showBadge =
            (item.name === 'SMS' && unreadCounts.sms > 0) ||
            (item.name === 'Email' && unreadCounts.email > 0);
          const badgeCount = item.name === 'SMS' ? unreadCounts.sms : unreadCounts.email;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
              {showBadge && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin Section */}
        {isAdmin && (
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="px-3 mb-2">
              <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                Administration
              </p>
            </div>
            {adminNavigation.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Settings */}
      <div className="border-t border-gray-800 p-3">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
      </div>
    </div>
  );
}
