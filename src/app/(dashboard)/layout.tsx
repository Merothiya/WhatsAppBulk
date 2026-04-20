import { ReactNode } from 'react';
import Link from 'next/link';
import { LayoutDashboard, MessageSquare, Send, Settings, BookTemplate } from 'lucide-react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b">
          <h1 className="font-bold text-xl text-teal-600">WhatsApp Bulk</h1>
        </div>
        <nav className="p-4 space-y-1">
          <Link href="/" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <LayoutDashboard size={20} />
            <span>Overview</span>
          </Link>
          <Link href="/inbox" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <MessageSquare size={20} />
            <span>Inbox</span>
          </Link>
          <Link href="/campaigns" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Send size={20} />
            <span>Campaigns</span>
          </Link>
          <Link href="/templates" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <BookTemplate size={20} />
            <span>Templates</span>
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100">
            <Settings size={20} />
            <span>Settings</span>
          </Link>
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
