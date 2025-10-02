
import MobileSidebar from "@/components/navbar/mobile-sidebar";
import LogoutButton from "@/components/logout/logoutButton";
import {ModeToggle} from "@/components/darkmode/ModeToggle";


const Navbar = () => {
    return (
        <div className="flex items-center justify-end bg-transparent ">
            <div className="flex-grow">
                <MobileSidebar />
            </div>
            <div className="flex p-2">
                <div className="flex items-center ">
                    <LogoutButton />
                </div>
                <div className={'p-2'}>
                    <ModeToggle />
                </div>
            </div>

       </div>
    )
}

export default Navbar;