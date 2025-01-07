import React from 'react';

interface Message {
  id: string;
  sender: 'You' | 'Erotetic Philosophiser';
  text: string;
  timestamp: Date;
}

interface Props {
  message: Message;
}

const ChatMessage = ({ message }: Props) => {
  const isUser = message.sender === 'You';
  
  return (
    <div className={`w-full ${isUser ? 'bg-gray-800/30' : 'bg-transparent'} py-8 border-b border-gray-800`}>
      <div className="px-6">
        <div className="flex items-start gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 
            ${isUser ? 'bg-gray-700' : 'bg-purple-900/30'}`}>
            <span className={`text-lg ${isUser ? 'text-gray-300' : 'text-purple-200'}`}>
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <strong className={`text-base ${isUser ? 'text-gray-300' : 'text-purple-300'}`}>
                {message.sender}
              </strong>
            </div>
            <div className="text-gray-200 text-lg leading-relaxed">
              {message.text}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;