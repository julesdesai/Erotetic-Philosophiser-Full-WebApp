import React, { useEffect, useState, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Html, Billboard } from '@react-three/drei';

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

interface LayoutedNode {
  id: number;
  x: number;
  y: number;
  z: number;
  summary: string;
  question: string;
}

interface NodeProps {
  position: [number, number, number];
  summary: string;
  question: string;
  onClick: () => void;
}

interface EdgeProps {
  start: [number, number, number];
  end: [number, number, number];
}

const Node: React.FC<NodeProps> = ({ position, summary, question, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={hovered ? "#FFA500" : "#FF8C00"} />
      </mesh>
      <Billboard
        follow={true}
        lockX={false}
        lockY={false}
        lockZ={false}
      >
        <Html
          position={[1.2, 0, 0]}
          style={{
            display: 'block',
            backgroundColor: 'rgba(31, 41, 55, 0.95)',
            padding: '8px',
            borderRadius: '4px',
            transform: 'translate3d(0, 0, 0)',
            whiteSpace: 'normal',
            width: '150px',
            cursor: 'pointer', // Add cursor pointer
          }}
          transform
          occlude
        >
          <div 
            style={{ 
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: hovered ? 'bold' : 'normal',
              opacity: hovered ? 1 : 0.8,
              transition: 'all 0.2s'
            }}
            onClick={(e) => {
              e.stopPropagation(); // Prevent event from reaching the canvas
              onClick();
            }}
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => setHovered(false)}
          >
            {summary || question.slice(0, 50)}
          </div>
        </Html>
      </Billboard>
    </group>
  );
};

const Edge: React.FC<EdgeProps> = ({ start, end }) => (
  <Line
    points={[start, end]}
    color="white"
    lineWidth={1}
    dashed={false}
  />
);

const layoutGraph = (graphData: GraphData, spacing: number = 10) => {
  const nodes: LayoutedNode[] = graphData.data.nodes.map((node, index) => ({
    id: index,
    x: (Math.random() - 0.5) * spacing,
    y: (Math.random() - 0.5) * spacing,
    z: (Math.random() - 0.5) * spacing,
    summary: node.summary,
    question: node.question
  }));

  // Force-directed layout
  for (let iteration = 0; iteration < 100; iteration++) {
    // Repulsive forces between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        
        if (distance < spacing) {
          const force = (spacing - distance) / distance * 0.1;
          nodes[i].x += dx * force;
          nodes[i].y += dy * force;
          nodes[i].z += dz * force;
          nodes[j].x -= dx * force;
          nodes[j].y -= dy * force;
          nodes[j].z -= dz * force;
        }
      }
    }

    // Attractive forces along edges
    graphData.data.edges.forEach(edge => {
      const source = nodes[edge.source];
      const target = nodes[edge.target];
      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const dz = target.z - source.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance > spacing / 2) {
        const force = (distance - spacing / 2) / distance * 0.1;
        source.x += dx * force;
        source.y += dy * force;
        source.z += dz * force;
        target.x -= dx * force;
        target.y -= dy * force;
        target.z -= dz * force;
      }
    });
  }

  return { nodes, edges: graphData.data.edges };
};

const Graph3D: React.FC<{ graphData: GraphData }> = ({ graphData }) => {
  const [layoutedData, setLayoutedData] = useState<{
    nodes: LayoutedNode[];
    edges: { source: number; target: number }[];
  }>({ nodes: [], edges: [] });
  const [selectedNode, setSelectedNode] = useState<{
    summary: string;
    question: string;
  } | null>(null);

  useEffect(() => {
    const positioned = layoutGraph(graphData);
    setLayoutedData(positioned);
  }, [graphData]);

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%'
    }}>
      <Canvas 
        style={{
          width: '100%',
          height: '100%'
        }}
        camera={{ position: [15, 15, 15], fov: 60 }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        
        <group scale={[0.8, 0.8, 0.8]}>
          {layoutedData.nodes.map((node) => (
            <Node
              key={node.id}
              position={[node.x, node.y, node.z]}
              summary={node.summary}
              question={node.question}
              onClick={() => setSelectedNode({
                summary: node.summary,
                question: node.question
              })}
            />
          ))}
          
          {layoutedData.edges.map((edge) => {
            const sourceNode = layoutedData.nodes[edge.source];
            const targetNode = layoutedData.nodes[edge.target];
            
            if (sourceNode && targetNode) {
              return (
                <Edge
                  key={`${edge.source}-${edge.target}`}
                  start={[sourceNode.x, sourceNode.y, sourceNode.z]}
                  end={[targetNode.x, targetNode.y, targetNode.z]}
                />
              );
            }
            return null;
          })}
        </group>
        
        <OrbitControls
          enableZoom={true}
          enablePan={true}
          enableRotate={true}
          minDistance={5}
          maxDistance={50}
        />
      </Canvas>

      {selectedNode && (
        <div style={{
          position: 'absolute',
          top: '1rem',
          left: '1rem',
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          color: 'white',
          padding: '1rem',
          borderRadius: '0.5rem',
          maxWidth: '24rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Summary
          </h3>
          <p style={{ marginBottom: '1rem' }}>{selectedNode.summary}</p>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            Question
          </h3>
          <p>{selectedNode.question}</p>
        </div>
      )}
    </div>
  );
};

export default Graph3D;