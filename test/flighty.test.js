import Flighty from "../src/flighty";
import qs from "qs";

describe("Flighty", () => {
  const headers = {
    "Content-Type": "application/json"
  };
  let api;
  beforeEach(() => {
    api = new Flighty({ headers });
    fetch.resetMocks();
    fetch.mockResponse("something");
  });

  test("should be truthy", () => {
    expect(Flighty).toBeTruthy();
  });

  ["get", "post", "head", "put", "options", "del","patch"].forEach(method => {
    test("should handle " + method, async () => {
      const path = "/somepath";
      const result = { test: "done" };
      fetch.mockResponseOnce(JSON.stringify(result));

      const res = await api[method](path);
      const json = await res.json();
      expect(json).toEqual(result);
      expect(fetch).toHaveBeenCalledWith(
        path,
        expect.objectContaining({
          method: method.toUpperCase(),
          headers
        })
      );
    });
  });

  test("should hang a 'flighty' object off the response containing json, text, original call to flighty, retry method and retryCount", async () => {
    const path = "/";
    const result = { test: "done" };
    const myOptions = { opt1: "one" };
    const myExtra = { extra: "something extra" };
    fetch.mockResponseOnce(JSON.stringify(result));

    const res = await api.get(path, myOptions, myExtra);

    expect(res.flighty).toBeTruthy();
    expect(res.flighty.retry).toBeTruthy();
    expect(res.flighty.json).toEqual(result);
    expect(res.flighty.text).toEqual(JSON.stringify(result));
    expect(res.flighty.call).toEqual({
      options: myOptions,
      extra: myExtra,
      path
    });

    fetch.mockResponseOnce(JSON.stringify(result));
    await expect(res.flighty.retry()).resolves.toBeTruthy();
  });

  test("should accurately return the number of times a request has been retried", async () => {
    const path = "/";
    const result = { test: "done" };
    const myOptions = { opt1: "one" };
    const myExtra = { extra: "something extra" };
    fetch
      .mockResponseOnce(JSON.stringify(result))
      .mockResponseOnce(JSON.stringify(result))
      .mockResponseOnce(JSON.stringify(result))
      .mockResponseOnce(JSON.stringify(result))
      .mockResponseOnce(JSON.stringify(result));

    const res = await api.get(path, myOptions, myExtra);
    const resTwo = await res.flighty.retry();
    const resThree = await resTwo.flighty.retry();
    const resFour = await resThree.flighty.retry();
    const resFromOneAgain = await res.flighty.retry();

    expect(res.flighty.retryCount).toBe(0);
    expect(resTwo.flighty.retryCount).toBe(1);
    expect(resThree.flighty.retryCount).toBe(2);
    expect(resFour.flighty.retryCount).toBe(3);

    // tricky - it was resTwo is when it was retried once
    // resFromOneAgain is when it was retried a second time
    expect(resFromOneAgain.flighty.retryCount).toBe(2);
  });

  test("should put json/text data in 'flighty'", async () => {
    const result = { test: "done" };
    const myExtra = {};
    fetch.mockResponseOnce(JSON.stringify(result));
    const res = await api.get("/", {}, myExtra);

    expect(res.flighty.json).toEqual(result);
  });

  test("should not modify the original 'extra' paramater", async () => {
    const result = { test: "done" };
    const myExtra = {};
    const originalExtra = { ...myExtra };
    fetch.mockResponseOnce(JSON.stringify(result));
    const { extra } = await api.get("/", {}, myExtra);
    expect(originalExtra).toEqual(myExtra);
  });

  test("should remove empty headers", async () => {
    const path = "/";
    const res = await api.get(path, {
      headers: {
        Date: "some string",
        Etag: null
      }
    });

    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("Etag");
    expect(fetch.mock.calls[0][1].headers).toHaveProperty("Date");
  });

  test("should convert body to querystring when using get", async () => {
    const body = {
      param: "value",
      arr: ["first", "second", "third"]
    };

    const expected = qs.stringify(body);

    const path = "/";
    const res = await api.get(path, {
      body: {
        param: "value",
        arr: ["first", "second", "third"]
      }
    });

    expect(fetch.mock.calls[0][0]).toMatch(expected);
    expect(fetch.mock.calls[0][1]).not.toHaveProperty("body");
  });

  test("should add an empty body to a post request that doesn't have one", async () => {
    await api.post("/");
    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        body: ""
      })
    );
  });

  test("should convert object body to string", async () => {
    const body = { param1: "value", arr: [1, 2, 3, 4] };
    const expected = JSON.stringify(body);
    await api.post("/", { body });
    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        body: expected
      })
    );
  });

  test("should combine baseURI with path", async () => {
    const baseURI = "http://localhost";
    const path = "/somepath";
    api.baseURI = baseURI;
    await api.post(path);
    expect(fetch.mock.calls[0][0]).toEqual(baseURI + path);
  });

  test("should add a JWT header", async () => {
    api.jwt("some token");
    const res = await api.get("/");
    expect(fetch.mock.calls[0][1].headers).toHaveProperty("Authorization");
    expect(fetch.mock.calls[0][1].headers.Authorization).toEqual(
      "Bearer some token"
    );
  });

  test("should remove a JWT header", async () => {
    api.jwt();
    const res = await api.get("/");
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
  });

  describe("abort", () => {
    test("should abort when abortAll() is called", async () => {
      const req = api.get("/");
      api.abortAll();
      const res = await req;
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    test("should abort when abort() is called with token", async () => {
      const abortToken = "some token";
      const req = api.get("/", { abortToken });
      api.abort(abortToken);
      const res = await req;
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    test("should abort when using abortAll() with a token request", async () => {
      const abortToken = "some token";
      const req = api.get("/", { abortToken });
      api.abortAll();
      const res = await req;
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    test("should only abort a single request when abort is called with token", async () => {
      const abortToken = "some token";
      const abortTokenTwo = "some token two";
      const reqOne = api.get("/", { abortToken });
      const reqTwo = api.get("/", { abortToken: abortTokenTwo });
      api.abort(abortToken);
      await Promise.all([reqOne, reqTwo]);
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(fetch.mock.calls[1][1].signal.aborted).toBeFalsy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    test("should allow further requests after abortAll has been called", async () => {
      api.abortAll();
      const res = await api.get("/");
      expect(fetch.mock.calls[0][1].signal.aborted).toBeFalsy();
    });

    test("should abort all requests with the same token", async () => {
      const abortToken = "some token";
      const reqOne = api.get("/", { abortToken });
      const reqTwo = api.get("/", { abortToken });
      const reqThree = api.get("/", { abortToken });
      const reqFour = api.get("/");
      api.abort(abortToken);
      await Promise.all([reqOne, reqTwo, reqThree, reqFour]);
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(fetch.mock.calls[1][1].signal.aborted).toBeTruthy();
      expect(fetch.mock.calls[2][1].signal.aborted).toBeTruthy();
      expect(fetch.mock.calls[3][1].signal.aborted).toBeFalsy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    test("should empty the abortTokenMap when all requests using the same token have completed", async () => {
      const delay = to =>
        fetch.mockResponseOnce(
          () => new Promise(res => setTimeout(() => res(1), to))
        );
      delay(10);
      delay(20);
      delay(30);
      delay(40);
      const abortToken = "some token";
      const reqOne = api.get("/", { abortToken });
      const reqTwo = api.get("/", { abortToken });
      const reqThree = api.get("/", { abortToken });
      const reqFour = api.get("/", { abortToken });
      await reqOne;
      expect(api.abortTokenMap.size).toBe(1);
      await reqTwo;
      expect(api.abortTokenMap.size).toBe(1);
      await reqThree;
      expect(api.abortTokenMap.size).toBe(1);
      await reqFour;
      expect(api.abortTokenMap.size).toBe(0);
    });
  });

  describe("interceptors", () => {
    beforeEach(() => {
      api.clearInterceptors();
    });

    test("should throw if a falsy interceptor is registered", () => {
      expect(() => api.interceptor.register(null)).toThrow();
    });

    test("should register an interceptor", () => {
      const interceptor = { request: jest.fn() };
      api.interceptor.register(interceptor);
      expect(api.interceptors.size).toBe(1);
    });

    test("should remove an interceptor via it's callback", () => {
      const interceptor = { request: jest.fn() };
      const deregister = api.interceptor.register(interceptor);
      expect(api.interceptors.size).toBe(1);
      deregister();
      expect(api.interceptors.size).toBe(0);
    });

    test("should remove an interceptor via unregister", () => {
      const interceptor = { request: jest.fn() };
      const deregister = api.interceptor.register(interceptor);
      expect(api.interceptors.size).toBe(1);
      api.interceptor.unregister(interceptor);
      expect(api.interceptors.size).toBe(0);
    });

    test("should clear interceptors", async () => {
      const interceptorOne = { request: jest.fn() };
      const interceptorTwo = { request: jest.fn() };
      const interceptorThree = { request: jest.fn() };

      api.interceptor.register(interceptorOne);
      api.interceptor.register(interceptorTwo);
      api.interceptor.register(interceptorThree);
      expect(api.interceptors.size).toBe(3);
      api.interceptor.clear();
      expect(api.interceptors.size).toBe(0);
    });

    test("should call request interceptor", async () => {
      const path = "/";
      const options = { opt: "opt" };
      const extra = { extra: "extra" };
      const interceptor = { request: (...args) => args };
      jest.spyOn(interceptor, "request");
      api.interceptor.register(interceptor);
      const res = await api.get(path, options, extra);
      const firstCallArgs = interceptor.request.mock.calls[0];
      expect(firstCallArgs[0]).toEqual(path);
      expect(firstCallArgs[1]).toEqual(options);
      expect(firstCallArgs[2]).toEqual(extra);
    });

    test("should call response interceptor ", async () => {
      const path = "/";
      const options = { opt: "opt" };
      const extra = { extra: "extra" };
      const response = "some response";
      fetch.mockResponseOnce(response);
      const interceptor = {
        response: jest.fn()
      };
      jest.spyOn(interceptor, "response");
      api.interceptor.register(interceptor);
      const res = await api.get(path, options, extra);
      const firstCallArgs = interceptor.response.mock.calls[0][0];
      expect(firstCallArgs.flighty).toBeTruthy();
    });

    test("should immutably pass extra and retryCount to request interceptors", async () => {
      const path = "/";
      const options = { opt1: "option" };
      const extra = { extra: "stuff" };
      const firstInterceptor = {
        request: (path, options, extra, retryCount) => {
          return [
            path,
            options,
            { ...extra, modified: "modified" },
            ++retryCount
          ];
        }
      };
      const secondInterceptor = {
        request: (...args) => args
      };
      api.interceptor.register(firstInterceptor);
      api.interceptor.register(secondInterceptor);

      jest.spyOn(firstInterceptor, "request");
      jest.spyOn(secondInterceptor, "request");
      const res = await api.get(path, options, extra);
      expect(firstInterceptor.request).toHaveBeenCalledWith(
        path,
        options,
        extra,
        0
      );

      expect(secondInterceptor.request).toHaveBeenCalledWith(
        path,
        options,
        extra,
        0
      );

      const resTwo = await res.flighty.retry();
      expect(firstInterceptor.request).toHaveBeenCalledWith(
        path,
        options,
        extra,
        1
      );

      await resTwo.flighty.retry();
      expect(firstInterceptor.request).toHaveBeenCalledWith(
        path,
        options,
        extra,
        2
      );
    });

    test("should call request interceptors in first -> second -> third", async () => {
      const firstInterceptor = {
        request: (...args) => args
      };
      const secondInterceptor = {
        request: (...args) => Promise.reject("error")
      };
      const thirdInterceptor = { requestError: err => Promise.reject(err) };

      api.interceptor.register(firstInterceptor);
      api.interceptor.register(secondInterceptor);
      api.interceptor.register(thirdInterceptor);

      jest.spyOn(firstInterceptor, "request");
      jest.spyOn(secondInterceptor, "request");
      jest.spyOn(thirdInterceptor, "requestError");

      await expect(api.get("/")).rejects.toBeTruthy();

      expect(firstInterceptor.request.mock.invocationCallOrder[0]).toBeLessThan(
        secondInterceptor.request.mock.invocationCallOrder[0]
      );

      expect(
        secondInterceptor.request.mock.invocationCallOrder[0]
      ).toBeLessThan(thirdInterceptor.requestError.mock.invocationCallOrder[0]);
    });

    test("should call response interceptors in third -> second -> first", async () => {
      fetch.mockResponseOnce(JSON.stringify("some response"));
      const firstInterceptor = {
        responseError: err => {
          throw err;
        }
      };
      const secondInterceptor = {
        response: res => {
          throw res;
        }
      };
      const thirdInterceptor = { response: res => res };

      api.interceptor.register(firstInterceptor);
      api.interceptor.register(secondInterceptor);
      api.interceptor.register(thirdInterceptor);

      jest.spyOn(firstInterceptor, "responseError");
      jest.spyOn(secondInterceptor, "response");
      jest.spyOn(thirdInterceptor, "response");

      await expect(api.get("/")).rejects.toBeTruthy();

      expect(
        firstInterceptor.responseError.mock.invocationCallOrder[0]
      ).toBeGreaterThan(secondInterceptor.response.mock.invocationCallOrder[0]);

      expect(
        secondInterceptor.response.mock.invocationCallOrder[0]
      ).toBeGreaterThan(thirdInterceptor.response.mock.invocationCallOrder[0]);
    });

    test("should call interceptors as request -> requestError -> responseError -> response", async () => {
      const r = { response: "some response" };
      const finalResponse = new Response(JSON.stringify(r));
      const firstInterceptor = {
        request: args => Promise.reject("error")
      };
      const secondInterceptor = {
        requestError: err => ["/", {}]
      };
      const thirdInterceptor = {
        responseError: err => finalResponse
      };
      const fourthInterceptor = {
        response: res => {
          throw res;
        }
      };

      api.interceptor.register(firstInterceptor);
      api.interceptor.register(secondInterceptor);
      api.interceptor.register(thirdInterceptor);
      api.interceptor.register(fourthInterceptor);

      jest.spyOn(firstInterceptor, "request");
      jest.spyOn(secondInterceptor, "requestError");
      jest.spyOn(thirdInterceptor, "responseError");
      jest.spyOn(fourthInterceptor, "response");

      const res = await api.get("/");

      expect(firstInterceptor.request).toHaveBeenCalled();
      expect(secondInterceptor.requestError).toHaveBeenCalled();
      expect(thirdInterceptor.responseError).toHaveBeenCalled();
      expect(fourthInterceptor.response).toHaveBeenCalled();
    });
  });
});
