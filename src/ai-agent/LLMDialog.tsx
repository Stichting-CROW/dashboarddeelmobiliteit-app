import React, { useState } from 'react';
import Modal from '../components/Modal/Modal';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface LLMDialogProps {
  isVisible: boolean;
  onClose: () => void;
}

const LLMDialog: React.FC<LLMDialogProps> = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendPrompt = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    const userMessage = input;
    setInput('');
    try {
      const response = await fetch('http://localhost:3001/api/ai/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage })
      });
      if (!response.ok) throw new Error('LLM API error');
      const data = await response.json();
      setMessages(data.conversation as ConversationMessage[]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Er is een fout opgetreden bij het ophalen van het antwoord van de AI.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isVisible={isVisible}
      title="AI Agent"
      hideModalHandler={onClose}
      button1Title="Sluiten"
      button1Handler={onClose}
      button2Title={isLoading ? 'Wachten...' : 'Verstuur'}
      button2Handler={sendPrompt}
      button2Options={{ isLoading }}
      config={{ fullWidth: true }}
    >
      <div className="flex flex-col h-[60vh]">
        <div className="flex-1 overflow-auto mb-4 bg-gray-50 rounded p-2">
          {messages.length === 0 && (
            <div className="text-gray-400 text-center mt-8">Stel een vraag aan de AI agent...</div>
          )}
          {messages.map((msg, idx) => (
            <div key={idx} className={`mb-2 text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={msg.role === 'user' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded' : 'bg-gray-200 text-gray-800 px-2 py-1 rounded'}>
                {msg.content}
              </span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendPrompt(); }}
            placeholder="Typ je vraag..."
            disabled={isLoading}
          />
          <Button onClick={sendPrompt} disabled={isLoading || !input.trim()}>
            Verstuur
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LLMDialog; 