import React from 'react';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import CodeBlock from '@/components/prompt/CodeBlock';
import { BotAvatar } from '@/components/user/bot-avatar';
import { UserAvatar } from '@/components/user/user-avatar';
import {FormatedPromptsProps} from "@/types";


const FormatedPrompts: React.FC<FormatedPromptsProps> = ({ messages }) => {
  return (
    <>
      {messages.flatMap((message, index) => (
        <div key={index} className={`p-10 w-full flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} items-start gap-x-8 rounded-lg`}>
          {message.role === 'user' ? (
            <>
              <div className="flex flex-col items-end w-9/12">
                <div className="text-sm text-black bg-gray-300 dark:bg-gray-300 dark:border font-semibold p-4 rounded-lg w-full relative text-right">
                  <p>{message.content}</p>
                </div>
                <div className="h-4"></div>
                {message.image ? (
                  <div className="bg-gray-300 dark:bg-gray-300 dark:border flex justify-end p-4 rounded-lg">
                    <Image src={`data:image/png;base64,${message.image}`} alt="votre image" width={500} height={500} className="rounded-lg" />
                  </div>
                ) : null}
              </div>
              <UserAvatar />
            </>
          ) : (
            <>
              <BotAvatar />
              <div className="text-sm dark:bg-[#111827] dark:text-white bg-transparent text-black font-semibold p-4 rounded-lg w-9/12 relative">
                <ReactMarkdown
                  components={{
                    pre: ({ node, ...props }) => (
                      <div className="overflow-auto w-full bg-gray-800 text-white rounded-lg ">
                        <pre {...props} />
                      </div>
                    ),
                    code({ node, className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || '');
                      return match ? (
                        <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                      ) : (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    },
                    table({ node, ...props }) {
                      return (
                        <div className="overflow-auto rounded-lg border">
                          <table className="min-w-full dark:border dark:text-black">
                            {props.children}
                          </table>
                        </div>
                      );
                    },
                    th({ node, ...props }) {
                      return (
                        <th className="py-2 px-4 border-b-2 border-gray-200 bg-gray-200 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                          {props.children}
                        </th>
                      );
                    },
                    td({ node, ...props }) {
                      return (
                        <td className="py-2 px-4 border-b border-gray-200 bg-white text-sm">
                          {props.children}
                        </td>
                      );
                    },
                  }}
                  className="leading-7 text-sm overflow-hidden"
                  remarkPlugins={[remarkGfm]}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
};

export default FormatedPrompts;
