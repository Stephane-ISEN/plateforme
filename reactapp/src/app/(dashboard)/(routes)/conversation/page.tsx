"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Heading } from '@/components/format/heading';
import { MessageSquare } from 'lucide-react';
import Navbar from '@/components/navbar/navbar';
import PromptForm from '@/components/prompt/PromptForm';
import { Empty } from '@/components/format/empty';
import { useUser } from '@/components/user/UserContext';
import withAuth from 'src/hocs/withauth';
import { Message } from '@/types';
import FormatedPrompts from "@/components/prompt/FormatedPrompts";
import useFetchModels from '@/src/hooks/fetchModels';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const ConversationPage = () => {
  const { user, fetchUserData } = useUser();
  const [hasFetched, setHasFetched] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const [selectedModel1, setSelectedModel1] = useState<string | null>("gpt");
  const [selectedModel2, setSelectedModel2] = useState<string | null>("gpt");
  const { messages: fetchedMessages1, loading: loading1, error: error1 } = useFetchModels(user, shouldFetch, selectedModel1, 'conversation');
  const { messages: fetchedMessages2, loading: loading2, error: error2 } = useFetchModels(user, shouldFetch, selectedModel2, 'conversation');
  const [messages1, setMessages1] = useState<Message[]>([]);
  const [messages2, setMessages2] = useState<Message[]>([]);
  const messagesEndRef1 = useRef<HTMLDivElement>(null);
  const messagesEndRef2 = useRef<HTMLDivElement>(null);
  const [numberModel, setNumberModel] = useState<'1' | '2'>('1');

  useEffect(() => {
    if (!user) {
      fetchUserData();
    }
  }, [user, fetchUserData]);

  useEffect(() => {
    if (user && !hasFetched) {
      setShouldFetch(true);
      setHasFetched(true);
    }
  }, [user, hasFetched]);

  useEffect(() => {
    if (fetchedMessages1.length >= 1) {
      setMessages1(fetchedMessages1);
      setShouldFetch(false);
    }
  }, [fetchedMessages1]);

  useEffect(() => {
    if (fetchedMessages2.length >= 1) {
      setMessages2(fetchedMessages2);
      setShouldFetch(false);
    }
  }, [fetchedMessages2]);

  useEffect(() => {
    if (messagesEndRef1.current) {
      messagesEndRef1.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages1]);

  useEffect(() => {
    if (messagesEndRef2.current) {
      messagesEndRef2.current.scrollIntoView({ behavior: "instant" });
    }
  }, [messages2]);
  
  useEffect(() => {
    if (shouldFetch && selectedModel1) {
      setShouldFetch(true);
      setShouldFetch(false);
    }
  }, [shouldFetch, selectedModel1]);

  const handleMessagesReceived = (userMessage: Message, apiResponseMessage: Message, model: string) => {
    if (model === selectedModel1) {
      setMessages1((prevMessages) => [...prevMessages, userMessage, apiResponseMessage]);
    } else if (model === selectedModel2) {
      setMessages2((prevMessages) => [...prevMessages, userMessage, apiResponseMessage]);
    }
  };

  const handleModelChange1 = (model: string | null) => {
    setSelectedModel1(model);
    setMessages1([]);
    setShouldFetch(true);
  };

  const handleModelChange2 = (model: string | null) => {
    setSelectedModel2(model);
    setMessages2([]);
    setShouldFetch(true);
  };

  const handleNumberChange = (count: '1' | '2') => {
    setNumberModel(count);
  }

  if (loading1 || loading2) return null;
  if (error1 || error2) return <div>Error: {error1 || error2}</div>;

  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex-grow flex flex-col overflow-hidden">
        <Heading
          title="Conversation"
          description="Assistant conversationnel pour la formation à l'IA !"
          icon={MessageSquare}
          iconColor="text-violet-500"
          bgColor="bg-violet-500/10"
        />
        <div className={`flex-grow grid gap-1 px-8 py-4 ${numberModel === '1' ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          <Card className="w-full flex flex-col h-full overflow-hidden">
            <div className="sticky top-0 z-10">
              <Select onValueChange={handleModelChange1} value={selectedModel1 ?? undefined}> 
                <SelectTrigger className="w-full dark:bg-[#111827]">
                  <SelectValue placeholder="model"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt">gpt</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                  <SelectItem value="mistral">Mistral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-grow p-4 overflow-y-auto">
              <FormatedPrompts messages={messages1} />
              <div ref={messagesEndRef1} />
            </div>
          </Card>
          {numberModel === '2' && (
            <Card className="w-full flex flex-col h-full overflow-hidden">
              <div className="sticky top-0 z-10">
                <Select onValueChange={handleModelChange2} value={selectedModel2 ?? undefined}> 
                  <SelectTrigger className="w-full dark:bg-[#111827]">
                    <SelectValue placeholder="model"/>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt">gpt</SelectItem>
                    <SelectItem value="gemini">Gemini</SelectItem>
                    <SelectItem value="mistral">Mistral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-grow p-4 overflow-y-auto">
                <FormatedPrompts messages={messages2} />
                <div ref={messagesEndRef2} />
              </div>
            </Card>
          )}
        </div>
      </div>
      <div className="px-4 lg:px-8 py-4 pb-6 bg-transparent">
        <PromptForm
          onMessageReceived={handleMessagesReceived}
          pageName="conversation"
          onNumberChange={handleNumberChange}
          numberModel={numberModel}
          selectedModel1={selectedModel1}
          selectedModel2={selectedModel2}
        />
      </div>
    </div>
  );
};

export default withAuth(ConversationPage);