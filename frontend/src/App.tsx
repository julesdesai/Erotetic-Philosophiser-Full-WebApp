import React, { useState, useEffect } from 'react';
import MainLayout from './components/MainLayout';
import LandingPage from './components/LandingPage';

interface Message {
  id: string;
  sender: 'You' | 'Erotetic Philosophiser';
  text: string;
  timestamp: Date;
}

interface WebSocketMessage {
  type: 'message' | 'typing' | 'discussion_ended' | 'error' | 'graph_data';
  message?: string;
  typing?: boolean;
  data?: {
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

const App: React.FC = () => {
  const [hasInitialQuestion, setHasInitialQuestion] = useState(false);
  const [graphData, setGraphData] = useState<WebSocketMessage | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [clientId] = useState(() => `client-${Math.random().toString(36).substr(2, 9)}`);
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    const websocket = new WebSocket(`ws://localhost:8000/ws/chat/${clientId}`);
    
    websocket.onmessage = (event) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      console.log("Received WebSocket message:", data);
      
      switch (data.type) {
        case 'graph_data':
          console.log("Received graph data:", data);
          setGraphData(data);
          setHasInitialQuestion(true);
          break;

        case 'message':
          if (data.message) {
            setChatMessages(prev => [...prev, {
              id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sender: 'Erotetic Philosophiser',
              text: data.message,
              timestamp: new Date()
            }]);
          }
          break;
        
        case 'typing':
          setIsTyping(data.typing || false);
          break;
        
        case 'discussion_ended':
          console.log('Discussion ended:', data.message);
          break;
        
        case 'error':
          console.error('WebSocket error:', data.message);
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    websocket.onclose = () => {
      console.log('WebSocket closed');
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [clientId]);

  const handleInitialQuestion = async (question: string) => {
    console.log("Received initial question:", question);
    
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'init',
        message: question
      }));
    } else {
      console.error('WebSocket is not connected');
    }
  };

  const sendChatMessage = (message: string) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      // Add user message to chat with unique ID
      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sender: 'You',
        text: message,
        timestamp: new Date()
      }]);
  
      // Send message to WebSocket
      ws.send(JSON.stringify({
        type: 'message',
        message: message
      }));
    } else {
      console.error('WebSocket is not connected');
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