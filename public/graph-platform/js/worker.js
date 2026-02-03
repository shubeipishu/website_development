/* --- START OF FILE js/worker.js --- */
importScripts('libs/math.js');
importScripts('graph-algorithms.js');

self.onmessage = function (e) {
    const { cmd, nodes, edges } = e.data;

    if (cmd === 'compute_all') {
        // computeGraphStats is defined in graph-algorithms.js
        const result = computeGraphStats(nodes, edges);

        self.postMessage({
            type: 'result',
            data: result
        });
    }
};