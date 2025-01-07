import React, { useRef } from 'react';

interface Props {
  inputText: string;
  setInputText: (text: string) => void;
  handleSend: () => void;
}

const ChatInput = ({ inputText, setInputText, handleSend }: Props) => {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const adjustTextAreaHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${Math.max(textAreaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div style={{
      borderTop: '1px solid rgb(31, 41, 55)',
      backgroundColor: '#111827',
      flexShrink: 0,
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{
        padding: '1.5rem',
        width: '100%',
        boxSizing: 'border-box'
      }}>
        <textarea
          ref={textAreaRef}
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            adjustTextAreaHeight();
          }}
          onKeyDown={handleKeyPress}
          placeholder="Message (Enter to send, Shift+Enter for new line)"
          className="w-full px-5 py-4 text-lg text-gray-200 bg-gray-800/30 border border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500/30 focus:border-transparent overflow-hidden placeholder:text-gray-600 min-h-[120px]"
          style={{ 
            resize: 'none',
            boxSizing: 'border-box',
            display: 'block',
            width: '100%'
          }}
          rows={5}
        />
      </div>
    </div>
  );
};

export default ChatInput;