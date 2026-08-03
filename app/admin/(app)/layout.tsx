import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-auth'
import AdminSidebar from './sidebar'
import AdminHeader from './header'

export const metadata = { title: 'Admin — Dominicana Tour', robots: 'noindex' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await getAdminSession())) redirect('/admin/login')
  return (
    <div className="flex h-screen overflow-hidden bg-dt-bg text-dt-text"
      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif', fontSize: 14, lineHeight: 1.5 }}>
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-7 bg-dt-bg-2">{children}</main>
      </div>
    </div>
  )
}
