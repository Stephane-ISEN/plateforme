import { LandingNavbar } from "@/components/landingmodule/landing-navbar";
import {LandingHero} from "@/components/landingmodule/landing-hero";
import {LandingContent} from "@/components/landingmodule/landing-content";
const LandingPage = () => {
    return (
        <div className={"h-full"}>
          <LandingNavbar />
          <LandingHero />
          <LandingContent />

        </div>
    );
}

export default LandingPage;
