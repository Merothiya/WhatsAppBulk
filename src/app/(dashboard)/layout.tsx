import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, MessageSquare, Send, Settings, BookTemplate, Users } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Home' },
    { href: '/inbox', icon: MessageSquare, label: 'Inbox' },
    { href: '/contacts', icon: Users, label: 'Contacts' },
    { href: '/campaigns', icon: Send, label: 'Campaigns' },
    { href: '/templates', icon: BookTemplate, label: 'Templates' },
    { href: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-white border-r flex-col shrink-0 h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="font-bold text-xl text-teal-600">WhatsApp Bulk</h1>
        </div>
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 h-screen">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t flex justify-around items-center h-16 px-2 z-50">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href} 
            className="flex flex-col items-center justify-center flex-1 py-1 text-gray-500 hover:text-teal-600"
          >
            <item.icon size={20} />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
