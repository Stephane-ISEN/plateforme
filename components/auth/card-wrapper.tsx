"use client"

import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
  } from "@/components/ui/Card";
import AuthHeader from "./auth-header";
import BackButton from "./back-button";
import React from "react";
import Image from "next/image";
import {CardWrapperProps} from "@/types";


const CardWrapper = ({label, title, backButtonHref, backButtonLabel, children}: CardWrapperProps) => {
  return (
    <Card className="w-[500px] shadow-md bg-white">
        <CardHeader className={''}>
            <Image
                      alt="Logo"
                      src="/managialogo-nr.png"
                        width={250}
                        height={100}
                      className={'justify-center mx-auto p-2 m-2'}
                  />
            <AuthHeader label={label} title={title}/>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
        <CardFooter>
            <BackButton label={backButtonLabel} href={backButtonHref} />
        </CardFooter>
    </Card>
  )
}

export default CardWrapper