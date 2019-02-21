export default function async(arr, start, thenMethod, catchMethod, afterEach) {
  return arr.reduce((last, next) => {
    if (afterEach) {
      last = last.then(afterEach).catch(({ ...args }) => {
        throw afterEach(args);
      });
    }

    if (next[thenMethod]) {
      last = last.then(args => next[thenMethod](...[].concat(args)));
    }

    if (next[catchMethod]) {
      last = last.catch(next[catchMethod]);
    }

    return last;
  }, start);
}
