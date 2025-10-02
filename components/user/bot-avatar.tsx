import React from "react";
import {Avatar, AvatarImage} from "@/components/ui/avatar";

export const BotAvatar = () => {
  return (
      <Avatar className="h-8 w-8 rounded-full border shadow ">
        <AvatarImage className={"p-1 dark:invert"} src={"/logo.png"} alt={"Bot"} />
      </Avatar>
  );
}