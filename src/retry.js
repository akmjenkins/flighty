export const retryDelayFn = delay => new Promise(res => setTimeout(() => res(), delay));

const checkFn = (fn, err) => {
  if (typeof fn !== 'function') {
    throw new Error(err);
  }
};

export const asyncRetry = async (asyncFnToRetry, { retries = 0, retryDelay = 1000, retryFn }) => {
  checkFn(asyncFnToRetry, 'retry function is not a function');

  if (typeof retries !== 'number' || !Number.isInteger(retries) || retries < 0) {
    throw new Error('retries must be a number greater than or equal to 0');
  }

  if (retryDelay && (typeof retryDelay !== 'number' || !Number.isFinite(retryDelay))) {
    throw new Error('retryDelay must be a number (milliseconds)');
  }

  if (retryFn && typeof retryFn !== 'function') {
    throw new Error('retryFn must be callable');
  }

  const localRetryFn = async (...args) => (retryFn ? retryFn(...args) : retryDelayFn(retryDelay));

  let count = -1;
  const wrap = async (remaining) => {
    try {
      count++;
      return await asyncFnToRetry(count);
    } catch (err) {
      if (!remaining) {
        throw err;
      }
      await localRetryFn(count + 1, err);
      return wrap(remaining - 1);
    }
  };

  const res = await wrap(retries);
  return { count, res };
};

export const fetchRetry = async (fetchToRetry, {
  retries, retryDelay, retryFn, retryOn = [], signal,
}) => {
  checkFn(fetchToRetry, 'retry function is not a function');

  if (retryOn && !Array.isArray(retryOn)) {
    throw new Error('retryOn must be an array of response statii');
  }

  if (signal != null && typeof signal.aborted !== 'boolean') {
    throw new Error('signal must have boolean "aborted" property');
  }

  return asyncRetry(
    async (retryCount) => {
      const res = await fetchToRetry();
      if (retryOn.indexOf(res.status) === -1 || retries === retryCount) {
        return res;
      }
      throw new Error(res);
    },
    {
      retries,
      retryFn: async (count, err) => {
        if (signal && signal.aborted) {
          throw err;
        }

        if (retryFn) {
          return retryFn(count, err);
        }

        return retryDelayFn(retryDelay);
      },
    },
  );
};
