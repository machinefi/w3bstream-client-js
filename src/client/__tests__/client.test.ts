import axios from "axios";

import { W3bstreamClient } from "..";
import { WSHeader, IW3bstreamClient } from "../types";
import {
  HEADER_1,
  MOCK_API_KEY,
  MOCK_DATA,
  MOCK_URL,
  W3bstreamResponse,
  DATA_PUSH_EVENT_TYPE,
  HEADER_1_REQUEST_BODY,
  REQUEST_HEADERS,
  MOCK_DEVICE_ID,
  MOCK_EVENT_TYPE,
} from "../__fixtures__";

describe("W3bstreamClient", () => {
  describe("constructor", () => {
    it("should initialize", () => {
      const client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
      expect(client).toBeDefined();
    });
    it("should throw if no url", () => {
      expect(() => new W3bstreamClient("", MOCK_API_KEY)).toThrow(
        "url is required"
      );
    });
    it("should throw if no api key", () => {
      expect(() => new W3bstreamClient(MOCK_URL, "")).toThrow(
        "api key is required"
      );
    });
  });
  describe("publishing", () => {
    let client: IW3bstreamClient;
    let mockFetch: jest.SpyInstance;

    beforeEach(() => {
      mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
        return Promise.resolve(W3bstreamResponse);
      });

      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
    });
    afterEach(() => {
      mockFetch.mockRestore();
    });
    it("should publish single msg", async () => {
      client.publishDirect(HEADER_1, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${DATA_PUSH_EVENT_TYPE}&timestamp=${HEADER_1.timestamp}`,
        HEADER_1_REQUEST_BODY,
        REQUEST_HEADERS
      );
    });
    it("should publish single msg without event type", async () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
      };

      client.publishDirect(header, MOCK_DATA);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    it("should throw if no device id", async () => {
      const header: WSHeader = {
        device_id: "",
        event_type: MOCK_EVENT_TYPE,
      };

      await expect(client.publishDirect(header, MOCK_DATA)).rejects.toThrow(
        "device id is required"
      );
    });
    it("should publish single msg with binary data", () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
        event_type: MOCK_EVENT_TYPE,
      };

      const data = Buffer.from("test data", "utf8");
      client.publishDirect(header, data);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    // it("should publish message batch", () => {
    //   const msgs: WSPayload = [
    //     {
    //       device_id: MOCK_DEVICE_ID,
    //       event_type: MOCK_EVENT_TYPE,
    //       payload: JSON.stringify(MOCK_DATA),
    //       timestamp: Date.now(),
    //     },
    //     {
    //       device_id: MOCK_DEVICE_ID,
    //       event_type: MOCK_EVENT_TYPE,
    //       payload: JSON.stringify(MOCK_DATA),
    //       timestamp: Date.now(),
    //     },
    //     {
    //       device_id: MOCK_DEVICE_ID_2,
    //       event_type: MOCK_EVENT_TYPE,
    //       payload: JSON.stringify(MOCK_DATA),
    //       timestamp: Date.now(),
    //     },
    //   ];
    //   const timestamp = Date.now();
    //   client.publishBatch(msgs, timestamp);

    //   expect(mockFetch).toHaveBeenCalledWith(
    //     `${MOCK_URL}?eventType=${_DATA_PUSH_EVENT_TYPE}&timestamp=${timestamp}`,
    //     msgs,
    //     {
    //       headers: {
    //         Authorization: `Bearer ${MOCK_API_KEY}`,
    //         "Content-Type": "application/json",
    //       },
    //     }
    //   );
    // });
  });
  describe("publishing queue", () => {
    let client: IW3bstreamClient;
    let mockFetch: jest.SpyInstance;

    beforeEach(() => {
      mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
        return Promise.resolve(W3bstreamResponse);
      });

      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        withWorker: true,
      });
    });
    afterEach(() => {
      client.stopWorker();
      mockFetch.mockRestore();
    });
    it("should queue single msg and publish it in interval", async () => {
      const isQueued = client.publish(HEADER_1, MOCK_DATA);

      expect(isQueued).toBe(true);
      expect(client.queue.length).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 2_000));

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
        ),
        HEADER_1_REQUEST_BODY,
        REQUEST_HEADERS
      );

      expect(client.queue.length).toBe(0);
    });
  });
});
