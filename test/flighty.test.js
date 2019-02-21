import Flighty from "flighty";
import qs from "qs";

describe("Flighty", () => {
  const headers = {
    "Content-Type": "application/json"
  };
  let api;
  beforeEach(() => {
    api = new Flighty({ headers });
    fetch.resetMocks();
  });

  test("should be truthy", () => {
    expect(Flighty).toBeTruthy();
  });

  ["get", "post", "head", "put", "options", "delete"].forEach(method => {
    test("should handle " + method, async () => {
      const path = "/somepath";
      const result = { test: "done" };
      fetch.mockResponseOnce(JSON.stringify(result));

      const { res } = await api[method](path);
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

  it("should put json/text data in 'extra'", async () => {
    const result = { test: "done" };
    const myExtra = {};
    fetch.mockResponseOnce(JSON.stringify(result));
    const { extra } = await api.get("/", {}, myExtra);
    expect(extra.json).toEqual(result);
  });

  it("should not modify the original 'extra' paramater", async () => {
    const result = { test: "done" };
    const myExtra = {};
    const originalExtra = { ...myExtra };
    fetch.mockResponseOnce(JSON.stringify(result));
    const { extra } = await api.get("/", {}, myExtra);
    expect(originalExtra).toEqual(myExtra);
  });

  it("should allow a retry", async () => {
    const first = "first";
    const second = "second";
    const third = "third";

    fetch
      .mockResponseOnce(first)
      .mockResponseOnce(second)
      .mockResponseOnce(third);

    const resOne = await api.get("/");
    const resTwo = await resOne.retry();
    const resThree = await resTwo.retry();

    expect(await resOne.res.text()).toBe(first);
    expect(await resTwo.res.text()).toBe(second);
    expect(await resThree.res.text()).toBe(third);

    expect(resOne.extra).toEqual(expect.objectContaining({ retry: 0 }));
    expect(resTwo.extra).toEqual(expect.objectContaining({ retry: 1 }));
    expect(resThree.extra).toEqual(expect.objectContaining({ retry: 2 }));
  });

  it("should remove empty headers", async () => {
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

  it("should convert body to querystring when using get", async () => {
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

  it("should add an empty body to a post request that doesn't have one", async () => {
    await api.post("/");
    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        body: ""
      })
    );
  });

  it("should convert object body to string", async () => {
    const body = { param1: "value", arr: [1, 2, 3, 4] };
    const expected = JSON.stringify(body);
    await api.post("/", { body });
    expect(fetch.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        body: expected
      })
    );
  });

  it("should combine baseURI with path", async () => {
    const baseURI = "http://localhost";
    const path = "/somepath";
    api.baseURI = baseURI;
    await api.post(path);
    expect(fetch.mock.calls[0][0]).toEqual(baseURI + path);
  });

  it("should add a JWT header", async () => {
    api.jwt("some token");
    const res = await api.get("/");
    expect(fetch.mock.calls[0][1].headers).toHaveProperty("Authorization");
    expect(fetch.mock.calls[0][1].headers.Authorization).toEqual(
      "Bearer some token"
    );
  });

  it("should remove a JWT header", async () => {
    api.jwt();
    const res = await api.get("/");
    expect(fetch.mock.calls[0][1].headers).not.toHaveProperty("Authorization");
  });

  describe("abort", () => {
    it("should abort when abortAll() is called", async () => {
      const req = api.get("/");
      api.abortAll();
      const res = await req;
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    it("should abort when abort() is called with token", async () => {
      const abortToken = "some token";
      const req = api.get("/", { abortToken });
      api.abort(abortToken);
      const res = await req;
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    it("should abort when using abortAll() with a token request", async () => {
      const abortToken = "some token";
      const req = api.get("/", { abortToken });
      api.abortAll();
      const res = await req;
      expect(fetch.mock.calls[0][1].signal.aborted).toBeTruthy();
      expect(api.abortTokenMap.size).toBe(0);
    });

    it("should only abort a single request when abort is called with token", async () => {
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

    it("should allow further requests after abortAll has been called", async () => {
      api.abortAll();
      const res = await api.get("/");
      expect(fetch.mock.calls[0][1].signal.aborted).toBeFalsy();
    });

    it("should abort all requests with the same token", async () => {
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

    it("should empty the abortTokenMap when all requests using the same token have completed", async () => {
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

    it("should throw if a falsy interceptor is registered", () => {
      expect(() => api.interceptor.register(null)).toThrow();
    });

    it("should register an interceptor", () => {
      const interceptor = { request: jest.fn() };
      api.interceptor.register(interceptor);
      expect(api.interceptors.size).toBe(1);
    });

    it("should remove an interceptor via it's callback", () => {
      const interceptor = { request: jest.fn() };
      const deregister = api.interceptor.register(interceptor);
      expect(api.interceptors.size).toBe(1);
      deregister();
      expect(api.interceptors.size).toBe(0);
    });

    it("should remove an interceptor via unregister", () => {
      const interceptor = { request: jest.fn() };
      const deregister = api.interceptor.register(interceptor);
      expect(api.interceptors.size).toBe(1);
      api.interceptor.unregister(interceptor);
      expect(api.interceptors.size).toBe(0);
    });

    it("should clear interceptors", async () => {
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

    it("should call request interceptor", async () => {
      const path = "/";
      const options = { opt: "opt" };
      const extra = { extra: "extra" };
      const interceptor = {
        request: ({ ...args }) => args
      };
      jest.spyOn(interceptor, "request");
      api.interceptor.register(interceptor);
      const res = await api.get(path, options, extra);
      expect(interceptor.request).toHaveBeenCalledWith({
        path,
        options,
        extra: {
          ...extra,
          retry: 0
        }
      });
    });

    it("should call response interceptor ", async () => {
      const path = "/";
      const options = { opt: "opt" };
      const extra = { extra: "extra" };
      const response = "some response";
      fetch.mockResponseOnce(response);
      const interceptor = {
        response: ({ ...args }) => ({ path, options })
      };
      jest.spyOn(interceptor, "response");
      api.interceptor.register(interceptor);
      const res = await api.get(path, options, extra);
      const firstCallArgs = interceptor.response.mock.calls[0][0];
      expect(firstCallArgs.retry).toBeTruthy();
      expect(firstCallArgs.extra).toEqual(
        expect.objectContaining({ ...extra })
      );
      expect(firstCallArgs.res).toBeTruthy();
    });

    it("should not call fetch if an error is thrown in the requestInterceptor", async () => {
      const error = "some specific error";
      const interceptor = {
        request: ({ path, options }) => Promise.reject(error)
      };

      api.interceptor.register(interceptor);

      try {
        await api.get("/");
        // hackish
        expect(true).toBeFalsy();
      } catch (err) {
        expect(err).toBe(error);
      }

      expect(fetch).not.toHaveBeenCalled();
    });

    it("should call request interceptors in first -> second -> third", async () => {
      const firstInterceptor = {
        request: ({ path, options }) => ({ path, options })
      };
      const secondInterceptor = {
        request: ({ path, options }) => Promise.reject("error")
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

    it("should call response interceptors in third -> second -> first", async () => {
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

    it("should call interceptors as request -> requestError -> responseError -> response", async () => {
      const r = { response: "some response" };
      const finalResponse = new Response(JSON.stringify(r));
      const firstInterceptor = {
        request: ({ path, options }) => Promise.reject("error")
      };
      const secondInterceptor = {
        requestError: err => ({ path: "/", options: {} })
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
