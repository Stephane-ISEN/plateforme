"use client";

import Link from "next/link";
import Image from "next/image";
import { Montserrat } from "next/font/google";
import { cn } from "@/lib/utils";
import { Speaker, Files, LayoutDashboardIcon, MessageSquare, Settings, Clapperboard, Camera } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const montserrat = Montserrat({ weight: "600", subsets: ["latin"] });

const routes = [
    {
        label: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboardIcon,
        color: "text-sky-500",
    },
    {
        label: "Conversation",
        href: "/conversation",
        icon: MessageSquare,
        color: "text-violet-500",
    },
    {
        label: "Voice Agent",
        href: "/speech",
        icon: Speaker,
        color: "text-green-500",
    },
    {
        label: "Image Generator",
        href: "/imagegenerator",
        icon: Camera,
        color: "text-blue-500",
    },
    {
        label: "Video Generator",
        href: "/videogenerator",
        icon: Clapperboard,
        color: "text-orange-500",
    },
    {
        label: "Docs",
        href: "/documentations",
        icon: Files,
        color: "text-pink-500",
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        color: "text-red-500",
    },
];

const Sidebar = () => {
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="space-y-4 py-4 flex flex-col h-full" style={{ backgroundColor: 'var(--sidebar-background)', color: 'var(--foreground)' }}>
            <div className="sidebar__header">
                <Link href="/dashboard" className="flex items-center justify-center mb-14">
                    <div className="relative p-2">
                        <div className="block dark:hidden">
                            <Image
                                alt="Logo Light"
                                src="/ManagiaLogo-BR.png"
                                width={250}
                                height={50}
                                layout="fixed"
                            />
                        </div>
                        <div className="hidden dark:block">
                            <Image
                                alt="Logo Dark"
                                src="/managialogo-nr.png"
                                width={250}
                                height={50}
                                layout="fixed"
                            />
                        </div>
                    </div>
                </Link>
                <div className="space-y-1 mt-[30%]">
                    {routes.map((route) => (
                        <Link
                        href={route.href}
                        key={route.href}
                        className={cn(
                            "group flex items-center p-3 w-full hover:text-black font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-200 transition",
                            pathname === route.href ? "bg-white dark:bg-[#111827] dark:border-xl-white" : ""
                        )}
                    >
                        <route.icon className={cn("w-5 h-5 mr-2", route.color)} />
                        <span className={pathname === route.href ? "text-black  dark:text-white" : "text-white dark:text-black"}>{route.label}</span>
                    </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Sidebar;

