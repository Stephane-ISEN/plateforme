import Link from "next/link"
import { Button } from "../ui/button"
import {BackButtonProps} from "@/types";


const BackButton = ({label, href}: BackButtonProps) => {
  return (
    <Button variant="link" className="font-semibold w-full text-black" size='sm' asChild>
        <Link href={href}>
            {label}
        </Link>
    </Button>
  )
}

export default BackButton