import { W3bstreamClient, IW3bstreamClient } from "./";

const MOCK_URL = "http://localhost:8080";
const MOCK_API_KEY = "1234567890";
const MOCK_DEVICE_ID = "1234567890";
const MOCK_EVENT_TYPE = "DEFAULT";
const MOCK_DATA = { test: "test" };

const headers = new Headers();
headers.append("Authorization", `Bearer ${MOCK_API_KEY}`);
headers.append("Content-Type", "application/json");

const singleMsgRequest = {
  method: "POST",
  headers,
  body: JSON.stringify(MOCK_DATA),
};

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
      expect(() => new W3bstreamClient("", MOCK_API_KEY)).toThrow(
        "W3bstreamClient: url is required"
      );
    });
    it("should throw if no api key", () => {
      expect(() => new W3bstreamClient(MOCK_URL, "")).toThrow(
        "W3bstreamClient: api key is required"
      );
    });
  });
  describe("Publishing", () => {
    it("should publish single msg", () => {
      const client = initClient();

      const header = {
        deviceId: MOCK_DEVICE_ID,
        eventType: MOCK_EVENT_TYPE,
      };

      client.publish(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?device_id=${MOCK_DEVICE_ID}&eventType=${MOCK_EVENT_TYPE}`,
        singleMsgRequest
      );
    });
    it("should publish single msg without event type", () => {
      const client = initClient();

      const header = {
        deviceId: MOCK_DEVICE_ID,
      };

      client.publish(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?device_id=${MOCK_DEVICE_ID}&eventType=${MOCK_EVENT_TYPE}`,
        singleMsgRequest
      );
    });
    it("should throw if no device id", () => {
      const client = initClient();

      const header = {
        deviceId: "",
        eventType: MOCK_EVENT_TYPE,
      };

      expect(() => client.publish(header, MOCK_DATA)).rejects.toThrow(
        "W3bstreamClient: device id is required"
      );
    });
  });
});
