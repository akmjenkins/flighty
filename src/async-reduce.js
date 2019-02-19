export default function async(arr, start, thenMethod, catchMethod) {
  return arr.reduce((last, next) => {
    if (next[thenMethod]) {
      last = last.then(next[thenMethod]);
    }

    if (next[catchMethod]) {
      last = last.catch(next[catchMethod]);
    }

    return last;
  }, start);
}
