import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { materialOceanic } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {ClipboardCopy} from "lucide-react";
import {CodeBlockProps} from "@/types";


const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(value).then(
      () => {
        alert('Copied to clipboard!');
      },
      (err) => {
        console.error('Failed to copy: ', err);
      }
    );
  };

  return (
<div className="relative my-4 bg-gray-800 p-4 rounded-lg">
      <button
        className="absolute top-2 right-2 mr-2 bg-gray-700 text-white rounded"
        onClick={copyToClipboard}
      >
        <ClipboardCopy className=" flex m-1" size={16} />
      </button>
      <div className="overflow-auto mt-4">
        <SyntaxHighlighter style={materialOceanic} language={language} PreTag="div">
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
};

export default CodeBlock;
