import {LucideIcon} from "lucide-react";
import {cn} from "@/lib/utils";
import React from "react";
import {Icon} from "lucide-react";
import { HeadingProps } from "@/types";



export const Heading = ({
 title,
 description,
 icon: Icon,
 iconColor,
 bgColor,
}: HeadingProps) => {
    return (
            <div className={"px-4 lg:px-8 flex items-center gap-x-3 md-8"}>
                <div className={cn("p-2 w-fit rounded-md")}>
                    <Icon className={cn("w-10 h-10", iconColor)} />
                </div>
                <div className={"flex flex-col"}>
                    <h2 className={"text-2xl font-bold"}>{title}</h2>
                    <p className={"text-muted-foreground font-light text-sm md:text-lg"}>{description}</p>
                </div>
            </div>
    );
};
