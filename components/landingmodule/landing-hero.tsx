"use client";

import TypewriterComponent from "typewriter-effect";
import Image from "next/image";

export const LandingHero = () => {

    const isSignedIn = false;
    return (
        <div className={"text-white font-bold py-10 text-center space-y-20 mb-24"}>
            <div className="flex flex-col items-center mb-6">
                <Image
                    alt="Logo"
                    src="/ManagiaLogo-BR.png"
                    width={700}
                    height={200}
                    className={"m-4 p-4"}
                />
            </div>
            <div className={"text-4xl sm:text-5xl md:text-6xl lg:text-7xl space-y-5 font-extrabold"}>
                <h1 className={"text-6xl font-bold text-[#dddee2]"}>Votre application pour : </h1>
                <div className={"text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-600 transition-colors duration-300 p-4 m-4 w-full"}>
                    <TypewriterComponent
                        options={{
                            strings: ["former vos équipes à l’IA", "développer vos compétences en IA", "le Reinforcement Learning à votre porté", "le Prompt engineering au bout des doigts"],
                            autoStart: true,
                            loop: true,
                            deleteSpeed: "natural",
                            delay: 100,
                            skipAddStyles: true,
                            wrapperClassName: "text-6xl w-50 h-80",

                        }}
                    />
                </div>
            </div>
            <div className={"text-sm md:text-xl mt-8 pt-4 font-light text-[#dddee2]"}>
                Et si L&#39;IA devenait votre partenaire !
            </div>
        </div>
    );
}