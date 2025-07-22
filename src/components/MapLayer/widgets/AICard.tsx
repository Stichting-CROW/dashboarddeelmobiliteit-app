import React, { useState } from 'react';
import SlideBox from '../../SlideBox/SlideBox.jsx';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';
import { LLMPrompt } from '../../../ai-agent/LLMPrompt';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

const exampleQuestions = [
  "Hoe kan ik het aantal verhuringen in de afgelopen 24 uur bekijken voor de gemeente Utrecht?",
  "Hoe kan ik het aanbod voor aanbieder check zien in Den Haag?",
];

export const AICard = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createPrompt = async(userMsg?: string) => {
    const msg = userMsg !== undefined ? userMsg : input.trim();
    if (!msg) return;
    setInput('');
    let prompt = LLMPrompt(msg, messages.map(msg => `${msg.role}: ${msg.content}`).join('\n'));
    await sendPrompt(prompt, msg);
  }

  const sendPrompt = async (prompt: string, userMsg?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3001/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg || input })
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
            <span className={msg.role === 'user' ? 'bg-blue-100 text-blue-800 px-2 py-1 rounded' : 'bg-gray-200 text-gray-800 px-2 py-1 rounded'}>
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
        <Button onClick={() => { setMessages([]); setInput(''); }} variant="secondary" disabled={isLoading}>
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