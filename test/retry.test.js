import { asyncRetry, fetchRetry, retryDelayFn } from "../src/retry";

describe("retry", () => {
  describe("fetchRetry", () => {
    const fetchFn = (opts, ftch) =>
      fetchRetry(ftch || (() => fetch("/")), opts || {});
    const fakeFetchFn = opts => fetchFn(opts,jest.fn());
    beforeEach(() => {
      fetch.resetMocks();
      fetch.mockResponse(JSON.stringify({}));
    });

    test("should reject if fetchToRetry is not a function", () => {
      expect(fakeFetchFn("not an fn",{})).rejects.toThrow();
    });

    test("should reject if retryOn is not an array", () => {
      expect(fakeFetchFn({ retryOn: "boo" })).rejects.toThrow();
    });

    test("should reject if passed in a bad signal", () => {
      expect(fakeFetchFn({ retryOn: [], signal: "bad" })).rejects.toThrow();
    });

    test("should not retry if the fetch was aborted", async () => {
      fetch.mockReject("some error");
      const signal = { aborted: true };
      await expect(fetchFn({ retries: 10, signal })).rejects.toThrow();
      expect(fetch).toHaveBeenCalledTimes(1);
    });

    test("should obey retryOn statii", async () => {
      fetch.mockImplementation(() => ({ status: 401 }));
      await expect(fetchFn({ retries: 10 })).resolves.toBeTruthy();
      expect(fetch).toHaveBeenCalledTimes(1);

      fetch.resetMocks();

      fetch.mockImplementation(() => ({ status: 401 }));
      await expect(
        fetchFn({ retries: 10, retryOn: [401, 402, 404] })
      ).resolves.toBeTruthy();
      expect(fetch).toHaveBeenCalledTimes(11);
    });
  });

  describe("asyncRetry", () => {
    const stopAfter = (n, val, err) =>
      jest.fn(i => {
        if (i === n - 1) return val;
        throw new Error(err);
      });

    test("should reject if the retry is not callable", async () => {
      await expect(asyncRetry("not an fn",{})).rejects.toThrow();
    });

    test("should reject the number of retries isNaN or less than 0", async () => {
      await expect(
        asyncRetry(jest.fn(), { retries: "not a number" })
      ).rejects.toThrow();
      await expect(asyncRetry(jest.fn(), { retries: -2 })).rejects.toThrow();
    });

    test("should reject if the retryDelay isNaN", async () => {
      await expect(
        asyncRetry(jest.fn(), {
          retryDelay: "not a number"
        })
      ).rejects.toThrow();
    });

    test("should reject if the retry is not callable", async () => {
      await expect(
        asyncRetry(jest.fn(), {
          retryFn: "not an fn"
        })
      ).rejects.toThrow();
    });

    test("should obey retryFn if both retryFn and retryDelay are passed in", async () => {
      const retryFn = jest.fn();
      const asyncFn = jest.fn(() => {
        throw new Error("test");
      });
      await expect(
        asyncRetry(asyncFn, {
          retries: 10,
          retryDelay: 10000,
          retryFn
        })
      ).rejects.toThrow();

      expect(retryFn).toHaveBeenCalledTimes(10);
    });

    test("should call asyncFn retries+1 times if it fails every time", async () => {
      const asyncFn = jest.fn(() => {
        throw new Error("test");
      });
      await expect(
        asyncRetry(asyncFn, {
          retries: 10,
          retryDelay: 1 // for the benefit for jest
        })
      ).rejects.toThrow();

      expect(asyncFn).toHaveBeenCalledTimes(11);
    });

    test("should stop calling as soon as asyncFn doesn't throw", async () => {
      const asyncFn = stopAfter(5);
      await expect(
        asyncRetry(asyncFn, {
          retries: 10,
          retryDelay: 1 // for the benefit for jest
        })
      ).resolves.toBeTruthy();

      expect(asyncFn).toHaveBeenCalledTimes(5);
    });

    test("should return the number of times the async func was retried and the resolving value", async () => {
      const val = "some resolving val";
      const asyncFn = stopAfter(6, val);
      await expect(
        asyncRetry(asyncFn, {
          retries: 10,
          retryDelay: 1 // for the benefit for jest
        })
      ).resolves.toEqual({ count: 5, res: val });
    });

  });
});
