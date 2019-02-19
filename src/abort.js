const teardownAbort = (token, map) => {
  if (!token) {
    return;
  }

  const val = map.get(token);
  if (!val) {
    return;
  }

  if (--val.count) {
    return;
  }
  map.delete(token);
};

const setupAbort = ({ abortToken, signal }, controller, map) => {
  // if there is no token or signal, use Flighty abortController
  if (!abortToken && !signal) {
    return controller.signal;
  }

  // otherwise, use an abortController local to this request
  let abortController = new AbortController();
  if (abortToken) {
    // allow to use a single token to cancel multiple requests
    const mapValue = map.get(abortToken) || {
      controller: abortController,
      count: 0
    };

    mapValue.count++;
    map.set(abortToken, mapValue);
    abortController = mapValue.controller;
  }

  // the user has defined their own signal. We won't use it directly, but we'll listen to it
  if (signal) {
    signal.addEventListener("abort", () => abortController.abort());
  }

  // when the Flighty abortController aborts, also abort this request
  controller.signal.addEventListener("abort", () => abortController.abort());
  return abortController.signal;
};

export { setupAbort, teardownAbort };
