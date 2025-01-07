// src/utils/graphTypes.ts

export interface Node {
    id: number;
    summary: string; //Title summary of question
    question: string;

    //Position of the node in 3D space
    x: number;
    y: number;
    z: number;
  }
  
  export interface Edge {
    source: number;
    target: number;
  }
  
  export interface GraphData {
    nodes: Node[];
    edges: Edge[];
  }
  
  export interface Vector3D {
    x: number;
    y: number;
    z: number;
  }