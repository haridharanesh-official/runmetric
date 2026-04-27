/**
 * Graph Data Structure (Adjacency List)
 */

export class Graph<T> {
  adjacencyList: Map<T, T[]> = new Map();

  addVertex(vertex: T): void {
    if (!this.adjacencyList.has(vertex)) {
      this.adjacencyList.set(vertex, []);
    }
  }

  addEdge(v1: T, v2: T): void {
    if (this.adjacencyList.has(v1) && this.adjacencyList.has(v2)) {
      this.adjacencyList.get(v1)!.push(v2);
      this.adjacencyList.get(v2)!.push(v1); // Undirected graph
    }
  }

  /**
   * Breadth-First Search
   */
  bfs(start: T): T[] {
    const queue: T[] = [start];
    const result: T[] = [];
    const visited: Set<T> = new Set();
    visited.add(start);

    while (queue.length) {
      const vertex = queue.shift()!;
      result.push(vertex);

      this.adjacencyList.get(vertex)?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
    return result;
  }

  /**
   * Depth-First Search
   */
  dfs(start: T): T[] {
    const result: T[] = [];
    const visited: Set<T> = new Set();
    const adjacencyList = this.adjacencyList;

    (function traverse(vertex: T) {
      if (!vertex) return;
      visited.add(vertex);
      result.push(vertex);

      adjacencyList.get(vertex)?.forEach(neighbor => {
        if (!visited.has(neighbor)) {
          traverse(neighbor);
        }
      });
    })(start);

    return result;
  }
}
