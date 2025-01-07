import React, { useState, useRef, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

interface Message {
  id: string;
  sender: 'You' | 'Erotetic Philosophiser';
  text: string;
  timestamp: Date;
}

interface ChatProps {
  messages: Message[];
  isTyping: boolean;
  onSendMessage: (message: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, isTyping, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim()) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    }}>
      <ChatHeader />
      
      <div 
        style={{
          flexGrow: 1,
          overflowY: 'auto',
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: '2rem'
        }}
      >
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        {isTyping && (
          <div className="typing-indicator px-6 py-4 text-gray-400">
            EP is philosophising...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
    
      <ChatInput
        inputText={inputText}
        setInputText={setInputText}
        handleSend={handleSend}
      />
    </div>
  );
};

export default Chat;