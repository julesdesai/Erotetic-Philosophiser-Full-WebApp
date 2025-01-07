import React, { useState, useRef, useEffect } from 'react';
import ChatHeader from './ChatHeader';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Message } from './types';

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const clientId = useRef(`client-${Math.random().toString(36).substr(2, 9)}`);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Connect to the chat-specific WebSocket endpoint
    wsRef.current = new WebSocket(`ws://localhost:8000/ws/chat/${clientId.current}`);

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          if (data.message) {
            addMessage('Erotetic Philosophiser', data.message);
          }
          break;
        
        case 'typing':
          setIsTyping(data.typing || false);
          break;
        
        case 'discussion_ended':
          // Optionally handle discussion ended state
          console.log('Discussion ended:', data.message);
          break;
        
        case 'error':
          console.error('Chat error:', data.message);
          break;
      }
    };

    return () => {
      wsRef.current?.close();
    };
  }, []);

  const addMessage = (sender: 'You' | 'Erotetic Philosophiser', text: string) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      text,
      sender,
      timestamp: new Date()
    }]);
  };

  const handleSend = () => {
    if (inputText.trim()) {
      addMessage('You', inputText);
      
      // Send message with type field
      wsRef.current?.send(JSON.stringify({
        type: 'message',
        message: inputText
      }));
      
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
        gap: '2rem'  // This adds space between flex children
      }}
    >
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
      {isTyping && (
        <div className="typing-indicator">
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