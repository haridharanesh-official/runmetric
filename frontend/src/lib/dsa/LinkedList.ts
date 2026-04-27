/**
 * Doubly Linked List for Performance Data
 */

export class PerformanceNode<T> {
  value: T;
  next: PerformanceNode<T> | null = null;
  prev: PerformanceNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

export class PerformanceList<T> {
  head: PerformanceNode<T> | null = null;
  tail: PerformanceNode<T> | null = null;
  length: number = 0;

  static fromArray<T>(arr: T[]): PerformanceList<T> {
    const list = new PerformanceList<T>();
    arr.forEach(item => list.append(item));
    return list;
  }

  append(value: T): void {
    const newNode = new PerformanceNode(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      if (this.tail) this.tail.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  find(id: string, idKey: keyof T): PerformanceNode<T> | null {
    let current = this.head;
    while (current) {
      if (String(current.value[idKey]) === id) return current;
      current = current.next;
    }
    return null;
  }
}
