import React from 'react';

const ChatHeader = () => {
  return (
    <div className="border-b border-gray-800 p-4 flex items-center gap-3">
      <div className="bg-purple-900/30 w-8 h-8 rounded-full flex items-center justify-center">
        <span className="text-purple-200 text-lg"></span>
      </div>
      <span className="text-gray-200 text-lg"></span>
    </div>
  );
};

export default ChatHeader;