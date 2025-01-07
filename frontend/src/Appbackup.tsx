import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import LandingPage from './components/LandingPage';

// Graph data interface
interface GraphData {
  type: string;
  data: {
    nodes: Array<{
      summary: string;
      question: string;
    }>;
    edges: Array<{
      source: number;
      target: number;
    }>;
  };
}

interface Message {
  role: 'You' | 'Erotetic Philosophiser';
  content: string;
}

// Chat message interface
interface ChatMessage {
  type: 'message' | 'typing' | 'discussion_ended' | 'error';
  message?: string;
  typing?: boolean;
}

const App: React.FC = () => {
  const [hasInitialQuestion, setHasInitialQuestion] = useState(false);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'You' | 'Erotetic Philosophiser', content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [clientId] = useState(() => `client-${Math.random().toString(36).substr(2, 9)}`);
  const [chatWs, setChatWs] = useState<WebSocket | null>(null);

  // Initialize chat WebSocket when component mounts
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/chat/${clientId}`);
    
    ws.onmessage = (event) => {
      const data: ChatMessage = JSON.parse(event.data);
      
      switch (data.type) {
        case 'message':
          if (data.message) {
            setChatMessages(prev => [...prev, {
              role: 'Erotetic Philosophiser',
              content: data.message
            }]);
          }
          break;
        
        case 'typing':
          setIsTyping(data.typing || false);
          break;
        
        case 'discussion_ended':
          // Handle discussion ended state
          console.log('Discussion ended:', data.message);
          break;
        
        case 'error':
          console.error('Chat error:', data.message);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('Chat WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('Chat WebSocket closed');
    };

    setChatWs(ws);

    return () => {
      ws.close();
    };
  }, [clientId]);

  const handleInitialQuestion = async (question: string) => {
    console.log("Received initial question:", question);
    
    try {
      const graphWs = new WebSocket('ws://localhost:8000/ws');
      
      graphWs.onopen = () => {
        console.log("Graph WebSocket connected");
        graphWs.send(question);
      };

      graphWs.onmessage = (event) => {
        console.log("Received graph response:", event.data);
        const response = JSON.parse(event.data);
        if (response.type === 'graph_data') {
          setGraphData(response);
          setHasInitialQuestion(true);
        }
      }; 

      graphWs.onerror = (error) => {
        console.error('Graph WebSocket error:', error);
      };

    } catch (error) {
      console.error('Error connecting to Graph WebSocket:', error);
    }
  };

  const sendChatMessage = (message: string) => {
    if (chatWs && chatWs.readyState === WebSocket.OPEN) {
      // Add user message to chat - match the format used in state
      setChatMessages(prev => [...prev, {
        role: 'You',
        content: message
      }]);
  
      // Send message to WebSocket
      chatWs.send(JSON.stringify({
        type: 'message',
        message: message
      }));
    } else {
      console.error('Chat WebSocket is not connected');
    }
  };

  return (
    <div className="h-screen w-screen">
      {!hasInitialQuestion ? (
        <LandingPage onSubmit={handleInitialQuestion} />
      ) : graphData ? (
        <MainLayout 
          initialGraphData={graphData}
          chatMessages={chatMessages}
          isTyping={isTyping}
          onSendMessage={sendChatMessage}
        />
      ) : null}
    </div>
  );
};

export default App;