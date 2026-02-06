export interface GraphNode {
  id: number;
  x: number;
  y: number;
}

export interface GraphEdge {
  s: number;
  t: number;
}

export interface EdgeCut {
  s: number;
  t: number;
}

export interface DegreesStats {
  max: number;
  min: number;
  avg: number;
}

export interface ConnectivityStats {
  kappa: number | string;
  lambda: number | string;
  cutNodes: number[];
  cutEdges: EdgeCut[];
}

export interface EdgeColoringStats {
  chi: number;
  mapping: Record<string, number>;
}

export interface HamiltonianStats {
  path: number[] | null;
  cycle: number[] | null;
  msg: string;
}

export interface EigenStats {
  adj: number[];
  lap: number[];
}

export interface MatrixStats {
  adj: number[][];
  lap: number[][];
}

export interface GraphStatsResult {
  degrees: DegreesStats;
  connectivity: ConnectivityStats;
  edgeColoring: EdgeColoringStats;
  hamiltonian: HamiltonianStats;
  eigen: EigenStats;
  matrices: MatrixStats;
  time: number;
}

export type WorkerCommand = 'compute_all';

export interface WorkerRequest {
  cmd: WorkerCommand;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface WorkerResultMessage {
  type: 'result';
  data: GraphStatsResult;
}

export type WorkerResponse = WorkerResultMessage;
