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
        json: () => Promise.resolve({ data: "test" }),
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

describe("W3bstreamClient", () => {
  it("should initialize", () => {
    const client: IW3bstreamClient = new W3bstreamClient(
      MOCK_URL,
      MOCK_API_KEY
    );
    expect(client).toBeDefined();
  });
  it("should publish events", () => {
    const client: IW3bstreamClient = new W3bstreamClient(
      MOCK_URL,
      MOCK_API_KEY
    );

    client.publish(MOCK_DEVICE_ID, MOCK_EVENT_TYPE, MOCK_DATA);

    expect(mockFetch).toHaveBeenCalled();
  });
  it("should throw an error if no url is provided", () => {
    expect(() => new W3bstreamClient("", MOCK_API_KEY)).toThrowError(
      "No url provided"
    );
  });
});
