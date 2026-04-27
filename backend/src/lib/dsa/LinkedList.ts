/**
 * Linked List Data Structures
 */

export class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;
  prev: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

/**
 * Singly Linked List
 */
export class SinglyLinkedList<T> {
  head: ListNode<T> | null = null;
  tail: ListNode<T> | null = null;
  length: number = 0;

  append(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}

/**
 * Doubly Linked List
 */
export class DoublyLinkedList<T> {
  head: ListNode<T> | null = null;
  tail: ListNode<T> | null = null;
  length: number = 0;

  append(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail!.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  prepend(value: T): void {
    const newNode = new ListNode(value);
    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.next = this.head;
      this.head.prev = newNode;
      this.head = newNode;
    }
    this.length++;
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}
