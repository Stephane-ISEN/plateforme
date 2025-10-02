"use client";

import { Montserrat } from "next/font/google";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const font = Montserrat({ weight: "600", subsets: ["latin"] });

export const LandingNavbar = () => {
  const isSignedIn = false;
  return (
    <div className="flex justify-between items-center p-2">
      <nav className="ml-auto">
        <div className="mt-4">
          <Link href={isSignedIn ? "/dashboard" : "/sign-in"}>
            <Button variant="premium" className="md:text-lg p-4 md:p-6 text-[#dddee2] rounded-full font-semibold ">
              Connecte-toi
            </Button>
          </Link>
        </div>
      </nav>
    </div>
  );
};
