import Image from "next/image";
import {Emptyprops} from "@/types";
import {usePathname, useRouter} from "next/navigation";

export const Empty = ({ label }: Emptyprops) => {
    const router = useRouter();
    const currentPage = usePathname();

    let imageSrc;
    if (currentPage === "/conversation" || currentPage === "/codegenerator") {
        imageSrc = "/waiting.png";
    } else if (currentPage === "/imagegenerator" || currentPage === "/videogenerator") {
        imageSrc = "/WorkInProgress.png";
    } else {
        imageSrc = "/waiting.png"; // une image par défaut si aucune des conditions ci-dessus n'est remplie
    }

    return (
        <div className={"h-full flex flex-col items-center justify-center"}>
            <div className={'bg-transparent'}>
                <Image src={imageSrc} alt={"Empty"} height={"0"} width={"300"} />
                <p className={"text-muted-foreground text-center"}>
                    {label}
                </p>
            </div>
        </div>
    )
}