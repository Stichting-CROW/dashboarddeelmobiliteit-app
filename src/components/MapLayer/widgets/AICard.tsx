import React, { useState } from 'react';
import SlideBox from '../../SlideBox/SlideBox.jsx';
import { Input } from '../../ui/input';
import { Button } from '../../ui/button';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const AICard = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const createPrompt = async() => {
    if (!input.trim()) return;

    const userMessage = input.trim();

    setInput('');

    let prompt =  `
    You are a helpful assistant that can helps the user to setup the view in the application.

    The user asks "${userMessage}"

    The previous interactions with the user are:
    ${messages.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

    please answer in dutch and do not ask for more than one thing at a time.
    `;

    await sendPrompt(prompt);
  }

  const sendPrompt = async (prompt: string) => {
    setIsLoading(true);
    const userMessage = input;
    try {
      const response = await fetch('http://localhost:3001/send', {
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
        <Button onClick={createPrompt} disabled={isLoading || !input.trim()}>
          Verstuur
        </Button>
        <Button onClick={() => { setMessages([]); setInput(''); }} variant="secondary" disabled={isLoading}>
          Reset
        </Button>
      </div>
    </SlideBox>
  );
}; 