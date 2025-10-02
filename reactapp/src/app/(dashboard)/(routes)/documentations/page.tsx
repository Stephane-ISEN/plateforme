"use client";


import {useRouter} from "next/navigation";
import {DocumentationContent} from "@/components/documentation/documentation-content";
import withAuth from "@/src/hocs/withauth";
import Navbar from "@/components/navbar/navbar";



const DocumentationPage = () =>  {
    const router = useRouter()
  return (
      <div className={''}>
          <Navbar />
          <DocumentationContent />
      </div>
  );
}

export default withAuth(DocumentationPage);