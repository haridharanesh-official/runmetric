/**
 * Sorting Algorithms for Athlete Performance Platform
 */

/**
 * QuickSort implementation (In-place)
 * @param arr The array to sort
 * @param low Starting index
 * @param high Ending index
 * @returns Sorted array
 */
export const quickSort = (arr: number[], low: number = 0, high: number = arr.length - 1): number[] => {
  if (low < high) {
    const pi = partition(arr, low, high);
    quickSort(arr, low, pi - 1);
    quickSort(arr, pi + 1, high);
  }
  return arr;
};

const partition = (arr: number[], low: number, high: number): number => {
  const pivot = arr[high];
  let i = low - 1;

  for (let j = low; j < high; j++) {
    if (arr[j] < pivot) {
      i++;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }
  [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
  return i + 1;
};

/**
 * MergeSort implementation (Stable)
 * @param arr The array to sort
 * @returns Sorted array
 */
export const mergeSort = (arr: number[]): number[] => {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));

  return merge(left, right);
};

const merge = (left: number[], right: number[]): number[] => {
  let result: number[] = [];
  let l = 0, r = 0;

  while (l < left.length && r < right.length) {
    if (left[l] < right[r]) {
      result.push(left[l]);
      l++;
    } else {
      result.push(right[r]);
      r++;
    }
  }

  return result.concat(left.slice(l)).concat(right.slice(r));
};
