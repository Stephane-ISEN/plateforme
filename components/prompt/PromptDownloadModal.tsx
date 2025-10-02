"use client";

import React, { useState, useEffect } from 'react';
import Modal from 'react-modal';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import { Card } from '@/components/ui/Card';
import { PromptDownloadModalProps } from '@/types';
import useFetchAll from '@/src/hooks/FetchAllPrompt';
import FormatedPrompts from '@/components/prompt/FormatedPrompts';
import { useUser } from '@/components/user/UserContext';
import { Button } from '@/components/ui/button';

pdfMake.vfs = pdfFonts.pdfMake.vfs;

const PromptDownloadModal: React.FC<PromptDownloadModalProps> = ({ isOpen, onRequestClose, onDownloadOnly }) => {
  const { user } = useUser();
  const [downloadCount, setDownloadCount] = useState(0);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [shouldFetch, setShouldFetch] = useState(false);
  const { messages, loading, error } = useFetchAll(user, shouldFetch);

  useEffect(() => {
    Modal.setAppElement('body');
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShouldFetch(true);
    }
  }, [isOpen]);

  const downloadPdf = () => {
    const docDefinition = {
      content: messages.map((message) => ({
        text: `${message.role === 'user' ? 'User' : 'Bot'}: ${message.content}`,
        margin: [0, 10],
      })),
      defaultStyle: {
        fontSize: 12,
      },
    };

    pdfMake.createPdf(docDefinition).download(`prompts_${downloadCount + 1}.pdf`);
    setDownloadCount(downloadCount + 1);
    setShouldFetch(false);
  };

  if (error) return <div>Error: {error}</div>;

  return (
    <div className="rounded-0">
      <Modal
        isOpen={isOpen}
        onRequestClose={onRequestClose}
        contentLabel="Download Prompts"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-[#111827] p-10 max-w-4xl max-h-90vh overflow-y-auto"
        overlayClassName="fixed inset-0 bg-black bg-opacity-75 z-50"
      >
        <div className="flex justify-end">
          <Button onClick={onRequestClose} className="btn-close text-black bg-white hover:bg-gray-300 p-2 mt-0 w-10 h-10">X</Button>
        </div>
        <Card className="rounded-lg p-4 flex flex-col bg-[#111827] text-white border-0 items-center w-full font-bold">
          <p className="text-center text-2xl">
            Téléchargez vos Prompts sous forme de fichier PDF.
          </p>
          <p className="text-center text-xl">
            Vous pouvez les consulter et les télécharger à tout moment.
          </p>
          <div className="flex justify-between">
            <Button onClick={() => setIsContentVisible(!isContentVisible)} className="btn-toggle bg-white text-black hover:bg-gray-300 p-2 m-4">
              {isContentVisible ? 'Hide Prompts' : 'Show Prompts'}
            </Button>
            <Button onClick={downloadPdf} className="btn-download bg-white text-black hover:bg-gray-300 p-2 m-4">
              Download PDF
            </Button>
          </div>
          <Card className="rounded-lg p-4 mt-4 w-full h-full overflow-y-auto border-0 dark:bg-[#111827]">
            <div id="prompts-list" className={`w-full ${isContentVisible ? '' : 'hidden'}`}>
              <FormatedPrompts messages={messages} />
            </div>
          </Card>
        </Card>
      </Modal>
    </div>
  );
};

export default PromptDownloadModal;
