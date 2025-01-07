// src/utils/graphLayout.ts

import { GraphData, Node, Vector3D } from './graphTypes';

export class ForceDirectedLayout {
  private nodes: Node[];
  private edges: { source: number; target: number }[];
  private positions: Map<number, Vector3D>;
  
  // Constants for force calculations
  private REPULSION = 1.0;  // Force between all nodes
  private ATTRACTION = 0.1; // Force along edges
  private CENTER_GRAVITY = 0.03;
  private DAMPING = 0.98;
  private MIN_DISTANCE = 2.0;
  private velocities: Map<number, Vector3D>;

  constructor(graphData: GraphData) {
    this.nodes = graphData.nodes;
    this.edges = graphData.edges;
    this.positions = new Map();
    this.velocities = new Map();
    this.initializePositions();
  }

  private initializePositions() {
    // Initialize nodes in a sphere
    this.nodes.forEach((node) => {
      // Random points on a sphere
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 5; // radius of initial sphere

      this.positions.set(node.id, {
        x: r * Math.sin(phi) * Math.cos(theta),
        y: r * Math.sin(phi) * Math.sin(theta),
        z: r * Math.cos(phi)
      });

      // Initialize velocities at 0
      this.velocities.set(node.id, { x: 0, y: 0, z: 0 });
    });
  }

  private calculateRepulsion(pos1: Vector3D, pos2: Vector3D): Vector3D {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance < 0.01) return { x: 0, y: 0, z: 0 };
    
    const force = this.REPULSION / (distance * distance);
    return {
      x: (dx / distance) * force,
      y: (dy / distance) * force,
      z: (dz / distance) * force
    };
  }

  private calculateAttraction(pos1: Vector3D, pos2: Vector3D): Vector3D {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance < 0.01) return { x: 0, y: 0, z: 0 };
    
    const force = this.ATTRACTION * Math.log(distance / this.MIN_DISTANCE);
    return {
      x: (dx / distance) * force,
      y: (dy / distance) * force,
      z: (dz / distance) * force
    };
  }

  public step() {
    // Calculate forces
    this.nodes.forEach((node) => {
      const pos1 = this.positions.get(node.id)!;
      let totalForce = { x: 0, y: 0, z: 0 };
      
      // Repulsion between all nodes
      this.nodes.forEach((otherNode) => {
        if (node.id !== otherNode.id) {
          const pos2 = this.positions.get(otherNode.id)!;
          const force = this.calculateRepulsion(pos1, pos2);
          totalForce.x += force.x;
          totalForce.y += force.y;
          totalForce.z += force.z;
        }
      });
      
      // Attraction along edges
      this.edges.forEach((edge) => {
        if (edge.source === node.id) {
          const targetPos = this.positions.get(edge.target)!;
          const force = this.calculateAttraction(pos1, targetPos);
          totalForce.x += force.x;
          totalForce.y += force.y;
          totalForce.z += force.z;
        } else if (edge.target === node.id) {
          const sourcePos = this.positions.get(edge.source)!;
          const force = this.calculateAttraction(pos1, sourcePos);
          totalForce.x += force.x;
          totalForce.y += force.y;
          totalForce.z += force.z;
        }
      });
      
      // Center gravity
      totalForce.x -= pos1.x * this.CENTER_GRAVITY;
      totalForce.y -= pos1.y * this.CENTER_GRAVITY;
      totalForce.z -= pos1.z * this.CENTER_GRAVITY;
      
      // Update velocity
      const vel = this.velocities.get(node.id)!;
      vel.x = (vel.x + totalForce.x) * this.DAMPING;
      vel.y = (vel.y + totalForce.y) * this.DAMPING;
      vel.z = (vel.z + totalForce.z) * this.DAMPING;
    });
    
    // Update positions
    this.nodes.forEach((node) => {
      const pos = this.positions.get(node.id)!;
      const vel = this.velocities.get(node.id)!;
      pos.x += vel.x;
      pos.y += vel.y;
      pos.z += vel.z;
    });
  }

  public getPositions(): GraphData {
    return {
      nodes: this.nodes.map(node => ({
        ...node,
        x: this.positions.get(node.id)!.x,
        y: this.positions.get(node.id)!.y,
        z: this.positions.get(node.id)!.z
      })),
      edges: this.edges
    };
  }
}

export function layoutGraph(graphData: GraphData, iterations: number = 100): GraphData {
  const layout = new ForceDirectedLayout(graphData);
  for (let i = 0; i < iterations; i++) {
    layout.step();
  }
  return layout.getPositions();
}