import React from 'react';

interface LandingPageProps {
  onSubmit: (question: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onSubmit }) => {
  const [question, setQuestion] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      try {
        // Call parent's onSubmit which will handle the WebSocket communication
        onSubmit(question);
      } catch (error) {
        console.error('Error submitting question:', error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center mb-6">
        <h1 className="text-3xl text-white">
          Ask me a philosophy question
        </h1>
      </div>
      <div className="w-full max-w-md px-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your question..."
          className="w-full p-4 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};

export default LandingPage;