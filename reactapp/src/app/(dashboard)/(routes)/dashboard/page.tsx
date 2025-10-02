"use client";


import { ArrowRight, Speaker, Files, LayoutDashboardIcon, MessageSquare, Settings, Clapperboard, Camera } from "lucide-react";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar/navbar";
import withAuth from 'src/hocs/withauth';

const tools = [
    {
        label: "Conversation",
        href: "/conversation",
        icon: MessageSquare,
        color: "text-violet-500",
        bgColor: "bg-violet-500/10",
    },
    {
        label: "Voice Agent",
        href: "/speech",
        icon: Speaker,
        color: "text-green-500",
        bgColor: "bg-green-500/10",
    },
    {
        label: "Image Generator",
        href: "/imagegenerator", 
        icon: Camera,
        color: "text-blue-500",
        bgColor: "bg-blue-500/10",
    },    
    {
        label: "Video Generator",
        href: "/videogenerator",
        icon: Clapperboard,
        color: "text-orange-500",
        bgColor: "bg-orange-500/10",
    },
    {
        label: "Docs",
        href: "/documentations",
        icon: Files,
        color: "text-pink-500",
        bgColor: "bg-pink-500/10",
    },
    {
        label: "Settings",
        href: "/settings",
        icon: Settings,
        color: "text-red-500",
        bgColor: "bg-red-500/10",
    },
];

const DashboardPage = () => {
    const router = useRouter();
    return (
        <div className="bg-white dark:bg-[#111827] min-h-screen">
            <Navbar />
            {/* Contenu principal de la page */}
            <div className={"mb-8 space-y-4"}>
                <h2 className={"text-2xl md:text-4xl font-bold text-center"}>Tableau de bord</h2>
                <p className={"text-muted-foreground font-light text-sm md:text-lg text-center"}>Bienvenue sur AI Explorer !</p>
            </div>
            <div className={"px-4 md:px-20 lg:px-32 space-y-4"}>
                {tools.map((tool, index) => (
                    <Card
                        onClick={() => router.push(tool.href)}
                        key={tool.href}
                        className={"p-4 border-black/10 dark:border-white/10 flex items-center hover:shadow-accent-foreground justify-between transition cursor-pointer"}>
                        <div className={"flex items-center gap-x-4"}>
                            <div className={cn("p-2 w-fit rounded-md", tool.bgColor)}>
                                <tool.icon className={cn(tool.color)} />
                            </div>
                            <div>
                                <h3 className={"text-lg font-semibold"}>{tool.label}</h3>
                            </div>
                        </div>
                        <ArrowRight className={"w-5 h-5"} />
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default withAuth(DashboardPage);
