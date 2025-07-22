import React, { useState } from 'react';
import SlideBox from '../../SlideBox/SlideBox.jsx';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { MockLlmService } from '../../../ai-agent/mockLlmService';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const exampleQuestions = [
  "Verhuringen afgelopen week",
  "Aanbod in Amsterdam",
  "Verhuringen in Utrecht",
];

export const AICard = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [llmService] = useState(() => new MockLlmService());

  const createPrompt = async(userMsg?: string) => {
    const msg = userMsg !== undefined ? userMsg : input.trim();
    if (!msg) return;
    setInput('');
    
    // Add user message to messages array
    setMessages(prev => [...prev, { role: 'user', content: msg }]);
    
    await sendPrompt(msg);
  }

  const sendPrompt = async (userMsg: string) => {
    setIsLoading(true);
    try {
      const conversation = await llmService.sendMessage(userMsg);
      
      // Get the latest assistant message
      const lastMessage = conversation[conversation.length - 1];
      if (lastMessage.role === 'assistant') {
        setMessages(prev => [...prev, { role: 'assistant', content: lastMessage.content }]);
      }
    } catch (err) {
      console.error('AI service error:', err);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, er is een fout opgetreden. Probeer het opnieuw.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = () => {
    setMessages([]);
    setInput('');
    llmService.clearConversation();
  };

  return (
    <SlideBox
      name="AICard"
      direction="right"
      options={{
        title: 'AI Agent',
        backgroundColor: '#fff',
      }}
      style={{ position: 'absolute', top: '120px', right: 0, minWidth: 320, maxWidth: 420 }}
    >
      <div className="flex flex-col h-48 mb-2 bg-gray-50 rounded p-2 overflow-auto">
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-8">Stel een vraag aan de AI agent...</div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`mb-2 text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
            <span className={`px-2 py-1 rounded ${
              msg.role === 'user' 
                ? 'bg-blue-100 text-blue-800' 
                : 'bg-gray-200 text-gray-800'
            }`}>
              {msg.content}
            </span>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center mt-2">
            <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
            </svg>
          </div>
        )}
      </div>
      <div className="flex gap-2 p-2">
        <Input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') createPrompt(); }}
          placeholder="Typ je vraag..."
          disabled={isLoading}
        />
        <Button onClick={() => createPrompt()} disabled={isLoading || !input.trim()}>
          Verstuur
        </Button>
        <Button onClick={resetConversation} variant="secondary" disabled={isLoading}>
          Reset
        </Button>
      </div>
      <div className="mt-4">
        <div className="text-xs text-gray-500 mb-1">Voorbeeldvragen:</div>
        <ul className="list-disc pl-5 space-y-1">
          {exampleQuestions.map((q, idx) => (
            <li key={idx}>
              <button
                className="text-blue-700 underline hover:text-blue-900 text-left text-sm"
                style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                disabled={isLoading}
                onClick={() => {
                  setMessages([{ role: 'user', content: q }]);
                  setInput('');
                  createPrompt(q);
                }}
              >
                {q}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </SlideBox>
  );
}; 