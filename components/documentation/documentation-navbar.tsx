import React from "react";
import { Button } from "@/components/ui/button"

interface DocumentationNavigationProps {
  onCategorySelect: (category: string) => void;
}

export const DocumentationNavigation: React.FC<DocumentationNavigationProps> = ({ onCategorySelect }) => {

    const bouton_doc = "px-4 py-2 mx-2 bg-[#111827] dark:border border-white/10 shadow-md dark:shadow-foreground/5 rounded-lg text-white hover:bg-gradient-to-r from-blue-500 to-emerald-600 transition-colors duration-300";
  
    return (
    <div className="px-7">
      <div className="pb-10 mt-10 border-b-2 border-black dark:border-white">
        <Button onClick={() => onCategorySelect('all_docs')}
          className={bouton_doc}>
          Tout
        </Button>
        <Button onClick={() => onCategorySelect('session')}
          className={bouton_doc}>
          Session
        </Button>
        <Button onClick={() => onCategorySelect('technique')}
          className={bouton_doc}>
          Technique
        </Button>
        <Button onClick={() => onCategorySelect('livres')}
          className={bouton_doc}>
          Livres
        </Button>
      </div>
    </div>
  );
};
