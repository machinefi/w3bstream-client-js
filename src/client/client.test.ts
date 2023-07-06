import { W3bstreamClient } from "./";
import { IW3bstreamClient } from "./types";

const MOCK_URL = "http://localhost:8080";
const MOCK_API_KEY = "1234567890";
const MOCK_DEVICE_ID = "1234567890";
const MOCK_EVENT_TYPE = "DEFAULT";
const MOCK_DATA = { test: "test" };

const mockFetch = jest
  .spyOn(global, "fetch")
  .mockImplementation(
    (
      input: RequestInfo | URL,
      _: RequestInit | undefined
    ): Promise<Response> => {
      const fetchResponse = {
        json: () =>
          Promise.resolve([
            {
              index: 0,
              results: [
                {
                  appletName: "1000",
                  instanceID: "1000",
                  handler: "start",
                  returnValue: null,
                  code: 0,
                },
              ],
            },
          ]),
        url: input.toString(),
        headers: new Headers(),
        ok: true,
        redirected: false,
        status: 200,
        statusText: "OK",
        type: new Response().type,
        clone: () => fetchResponse,
        body: null,
        bodyUsed: false,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
        blob: () => Promise.resolve(new Blob()),
        formData: () => Promise.resolve(new FormData()),
        text: () => Promise.resolve("test"),
      };
      return Promise.resolve(fetchResponse);
    }
  );

const initClient = (): IW3bstreamClient =>
  new W3bstreamClient(MOCK_URL, MOCK_API_KEY);

describe("W3bstreamClient", () => {
  describe("Contructor", () => {
    it("should initialize", () => {
      const client: IW3bstreamClient = new W3bstreamClient(
        MOCK_URL,
        MOCK_API_KEY
      );
      expect(client).toBeDefined();
    });
    it("should throw if no url", () => {
      expect(() => new W3bstreamClient("", MOCK_API_KEY)).toThrow();
    });
    it("should throw if no api key", () => {
      expect(() => new W3bstreamClient(MOCK_URL, "")).toThrow();
    });
  });
  describe("Publishing", () => {
    it("should publish single msg", () => {
      const client = initClient();

      client.publish(MOCK_DEVICE_ID, MOCK_DATA, MOCK_EVENT_TYPE);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    it("should publish single msg without event type", () => {
      const client = initClient();

      client.publish(MOCK_DEVICE_ID, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
