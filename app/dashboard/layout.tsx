import SideNav from '@/app/ui/dashboard/sidenav';
import FaceMonitor from '@/app/ui/proctoring/FaceMonitor';


export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col md:flex-row md:overflow-hidden">
      <div className="w-full flex-none md:w-64">
        <SideNav />
      </div>
      <FaceMonitor />
      <div className="grow p-6 md:overflow-y-auto md:p-12">{children}</div>
    </div>
  );
}