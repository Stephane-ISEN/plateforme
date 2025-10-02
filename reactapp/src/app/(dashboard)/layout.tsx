import Sidebar from "@/components/navbar/sidebar";
import { LayoutProps } from '@/types';

export default function DashboardLayout({ children }: LayoutProps) {
  return (
    <div className="h-full dark:bg-[#111827] sm:h-full">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-[#111827] ">
        <Sidebar />
      </div>
      <main className="md:pl-72">
        {children}
      </main>
    </div>
  );
}
