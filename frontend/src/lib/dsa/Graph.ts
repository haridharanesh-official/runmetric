/**
 * Performance Graph for Metric Correlations
 */

export type NodeId = string;

export class PerformanceGraph {
  private adjacencyList: Map<NodeId, NodeId[]> = new Map();

  addNode(id: NodeId): void {
    if (!this.adjacencyList.has(id)) {
      this.adjacencyList.set(id, []);
    }
  }

  addEdge(node1: NodeId, node2: NodeId): void {
    this.addNode(node1);
    this.addNode(node2);
    this.adjacencyList.get(node1)?.push(node2);
    this.adjacencyList.get(node2)?.push(node1);
  }

  getNeighbors(id: NodeId): NodeId[] {
    return this.adjacencyList.get(id) || [];
  }

  /**
   * Breadth-First Search to find clusters or reachability
   */
  bfs(startId: NodeId): NodeId[] {
    const visited = new Set<NodeId>();
    const queue: NodeId[] = [startId];
    const result: NodeId[] = [];

    visited.add(startId);

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      for (const neighbor of this.getNeighbors(current)) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  /**
   * Find connected components (clusters of similar runs)
   */
  findClusters(): NodeId[][] {
    const visited = new Set<NodeId>();
    const clusters: NodeId[][] = [];

    for (const node of this.adjacencyList.keys()) {
      if (!visited.has(node)) {
        const cluster = this.bfs(node);
        cluster.forEach(id => visited.add(id));
        clusters.push(cluster);
      }
    }

    return clusters;
  }
}
