import { all, create } from 'mathjs';
import { computeGraphStats } from './graph-algorithms.js';
import type { WorkerRequest, WorkerResponse } from './types';

type GraphWorkerScope = {
  math?: unknown;
  postMessage: (message: WorkerResponse) => void;
  onmessage: ((event: MessageEvent<WorkerRequest>) => void) | null;
};

const scope = self as unknown as GraphWorkerScope;
scope.math = create(all, {});

scope.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const payload = event.data;
  if (!payload || payload.cmd !== 'compute_all') return;

  const response: WorkerResponse = {
    type: 'result',
    data: computeGraphStats(payload.nodes, payload.edges),
  };

  scope.postMessage(response);
};
