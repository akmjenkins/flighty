import { setupAbort, teardownAbort } from '../src/abort';

describe('abort', () => {
  describe('setupAbort', () => {
    let globalController;
    let localController;
    let map;
    const abortToken = 'some token';

    beforeEach(() => {
      map = new Map();
      globalController = new AbortController();
      localController = new AbortController();
    });

    test('should return the signal from the passed in controller if there is no abortToken or signal', () => {
      const signal = setupAbort({}, globalController, map);
      expect(signal).toBe(globalController.signal);
    });

    test('should add the token to the map', () => {
      setupAbort({ abortToken }, globalController, map);
      const val = map.get(abortToken);
      expect(val).toBeTruthy();
      expect(val.controller).toBeInstanceOf(AbortController);
      expect(val.count).toBe(1);
    });

    test('should increment the map count if the same token is used', () => {
      setupAbort({ abortToken }, globalController, map);
      setupAbort({ abortToken }, globalController, map);
      setupAbort({ abortToken }, globalController, map);
      expect(map.get(abortToken).count).toBe(3);
    });

    test('should return the same signal if for identical tokens', () => {
      const signalOne = setupAbort({ abortToken }, globalController, map);
      const signalTwo = setupAbort({ abortToken }, globalController, map);
      const signalThree = setupAbort({ abortToken }, globalController, map);

      expect(signalOne).toBe(signalTwo);
      expect(signalTwo).toBe(signalThree);
    });

    test('should trigger the returned signal when the globalController is aborted (token)', () => {
      const signal = setupAbort({ abortToken }, globalController, map);
      globalController.abort();
      expect(signal.aborted).toBe(true);
    });

    test('should trigger the returned signal when the globalController is aborted (signal)', () => {
      const signal = setupAbort(
        { signal: localController.signal },
        globalController,
        map,
      );
      globalController.abort();
      expect(signal.aborted).toBe(true);
    });

    test('should trigger the returned signal when the passed in signal is aborted', () => {
      const signal = setupAbort(
        { signal: localController.signal },
        globalController,
        map,
      );
      localController.abort();
      expect(signal.aborted).toBe(true);
    });
  });

  describe('teardownAbort', () => {
    const tokenOne = Symbol('token');
    const tokenTwo = 'some token';
    const tokenThree = '🤨';

    const mapValueOne = { count: 1 };
    const mapValueTwo = { count: 3 };
    const mapValueThree = { count: 4 };

    let map;
    beforeEach(() => {
      map = new Map();
      map.set(tokenOne, mapValueOne);
      map.set(tokenTwo, mapValueTwo);
      map.set(tokenThree, mapValueThree);
    });

    test('should decrement the count of the map', () => {
      teardownAbort(tokenTwo, map);
      expect(map.get(tokenTwo).count).toEqual(2);
    });

    test('should delete from the map if the count is 0', () => {
      teardownAbort(tokenOne, map);
      expect(map.get(tokenOne)).toBeFalsy();
    });
  });
});
