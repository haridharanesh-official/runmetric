/**
 * DSA Sorting for Frontend
 */

export const quickSort = <T>(
  arr: T[], 
  key: keyof T, 
  ascending: boolean = true
): T[] => {
  if (arr.length <= 1) return arr;
  
  const pivot = arr[arr.length - 1];
  const left: T[] = [];
  const right: T[] = [];
  
  for (let i = 0; i < arr.length - 1; i++) {
    const val = arr[i][key];
    const pVal = pivot[key];
    
    if (ascending) {
      if (val < pVal) left.push(arr[i]);
      else right.push(arr[i]);
    } else {
      if (val > pVal) left.push(arr[i]);
      else right.push(arr[i]);
    }
  }
  
  return [...quickSort(left, key, ascending), pivot, ...quickSort(right, key, ascending)];
};
