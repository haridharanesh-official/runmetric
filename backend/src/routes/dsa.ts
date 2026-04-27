import { Router } from "express";
import { quickSort, mergeSort } from "../lib/dsa/Sorting";
import { SinglyLinkedList, DoublyLinkedList } from "../lib/dsa/LinkedList";
import { Graph } from "../lib/dsa/Graph";

const router = Router();

/**
 * @route GET /api/dsa/test-sorting
 * @desc Test Sorting Algorithms
 */
router.get("/test-sorting", (req, res) => {
  const data = Array.from({ length: 10 }, () => Math.floor(Math.random() * 100));
  const qsResult = quickSort([...data]);
  const msResult = mergeSort([...data]);

  res.json({
    original: data,
    quickSort: qsResult,
    mergeSort: msResult,
  });
});

/**
 * @route GET /api/dsa/test-linkedlist
 * @desc Test Linked List Operations
 */
router.get("/test-linkedlist", (req, res) => {
  const sll = new SinglyLinkedList<string>();
  ["Athlete A", "Athlete B", "Athlete C"].forEach(n => sll.append(n));

  const dll = new DoublyLinkedList<number>();
  [10, 20, 30].forEach(n => dll.append(n));
  dll.prepend(5);

  res.json({
    singlyLinkedList: sll.toArray(),
    doublyLinkedList: dll.toArray(),
    lengthSLL: sll.length,
    lengthDLL: dll.length,
  });
});

/**
 * @route GET /api/dsa/test-graph
 * @desc Test Graph Traversals
 */
router.get("/test-graph", (req, res) => {
  const g = new Graph<string>();
  const nodes = ["A", "B", "C", "D", "E", "F"];
  nodes.forEach(n => g.addVertex(n));

  g.addEdge("A", "B");
  g.addEdge("A", "C");
  g.addEdge("B", "D");
  g.addEdge("C", "E");
  g.addEdge("D", "E");
  g.addEdge("D", "F");
  g.addEdge("E", "F");

  res.json({
    nodes,
    bfs: g.bfs("A"),
    dfs: g.dfs("A"),
  });
});

export default router;
