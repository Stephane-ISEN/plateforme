import { useState } from "react";
import { Heading } from "@/components/format/heading";
import { Files } from "lucide-react";
import { Card } from "@/components/ui/Card";
import useFetchDocumentation from "@/components/documentation/documentation-fetch";
import { DocumentationNavigation } from "@/components/documentation/documentation-navbar";

export const DocumentationContent = () => {
  const [selectedCategory, setSelectedCategory] = useState("all_docs");

  const { docs, error } = useFetchDocumentation(selectedCategory);

  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <Heading
        title={"Documentations"}
        description={"Voici une liste de documentations pour les technologies et outils les plus populaires."}
        icon={Files}
        iconColor={"text-pink-500"}
        bgColor={"bg-pink-500/10"}
      />
      
      <DocumentationNavigation onCategorySelect={setSelectedCategory} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-5 p-7 pb-20 bg-white dark:bg-[#111827]">
        {docs.map((link) => (
          <a href={link.url} target="_blank" rel="noopener noreferrer" key={link.title} className="block">
            <Card
              className="bg-[#111827] dark:border-white/10 rounded-lg text-white shadow-lg dark:shadow-foreground/5 p-4 hover:text-black hover:bg-gradient-to-r from-blue-500 to-emerald-600 transition-colors duration-300"
            >
              <div className="flex items-center gap-x-2">
                <div>
                  <h3 className="text-lg font-bold text-white p-2">
                    {link.title}
                  </h3>
                </div>
              </div>
              <p className="mt-2 text-sm text-white p-2">
                {link.description}
              </p>
            </Card>
          </a>
        ))}
      </div>

      <div className="pb-20 bg-white dark:bg-[#111827]">
        <div className="flex items-center justify-center">
          <div>
            <h3 className="flex justify-center dark:text-white text-lg font-semibold text-black">
              ManagIA
            </h3>
            <p className="text-sm font-semibold text-black dark:text-white">
              © 2021 ManagIA, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
