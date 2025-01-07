import React from 'react';
import Graph3D from './Graph3D';
import Chat from './Chat/index';

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

interface MainLayoutProps {
  initialGraphData: GraphData;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialGraphData }) => {
  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0
    }}>
      <div style={{
        width: '50%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#111827'
      }}>
        <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
          <Graph3D graphData={initialGraphData} />
        </div>
      </div>
      <div style={{
        width: '50%',
        height: '100vh',
        borderLeft: '1px solid #374151',
        backgroundColor: '#111827',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <Chat />
      </div>
    </div>
  );
};

export default MainLayout;