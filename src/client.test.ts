import axios from "axios";

import { W3bstreamClient, IW3bstreamClient, WSHeader, WSPayload } from "./";

const MOCK_URL = "http://localhost:8080";
const MOCK_API_KEY = "1234567890";
const MOCK_DEVICE_ID = "1234567890";
const MOCK_DEVICE_ID_2 = "0987654321";
const MOCK_EVENT_TYPE = "DEFAULT";
const MOCK_DATA = { test: "test" };
const _DATA_PUSH_EVENT_TYPE = "DA-TA_PU-SH";

describe("W3bstreamClient", () => {
  describe("constructor", () => {
    it("should initialize", () => {
      const client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
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
  describe("publishing", () => {
    let client: IW3bstreamClient;
    let mockFetch: jest.SpyInstance;
    beforeEach(() => {
      mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
        return Promise.resolve([
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
        ]);
      });

      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
    });
    afterEach(() => {
      mockFetch.mockRestore();
    });
    it("should publish single msg", async () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
        event_type: MOCK_EVENT_TYPE,
        timestamp: Date.now(),
      };

      client.publish(header, MOCK_DATA);
      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${_DATA_PUSH_EVENT_TYPE}&timestamp=${header.timestamp}`,
        [
          {
            device_id: header.device_id,
            event_type: header.event_type,
            payload: JSON.stringify(MOCK_DATA),
            timestamp: header.timestamp,
          },
        ],
        {
          headers: {
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    });
    it("should publish single msg without event type", async () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
      };

      client.publish(header, MOCK_DATA);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    it("should throw if no device id", async () => {
      const header: WSHeader = {
        device_id: "",
        event_type: MOCK_EVENT_TYPE,
      };

      await expect(client.publish(header, MOCK_DATA)).rejects.toThrow(
        "W3bstreamClient: device id is required"
      );
    });
    it("should publish single msg with binary data", () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
        event_type: MOCK_EVENT_TYPE,
      };

      const data = Buffer.from("test data", "utf8");
      client.publish(header, data);

      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
    it("should publish message batch", () => {
      const msgs: WSPayload = [
        {
          device_id: MOCK_DEVICE_ID,
          event_type: MOCK_EVENT_TYPE,
          payload: JSON.stringify(MOCK_DATA),
          timestamp: Date.now(),
        },
        {
          device_id: MOCK_DEVICE_ID,
          event_type: MOCK_EVENT_TYPE,
          payload: JSON.stringify(MOCK_DATA),
          timestamp: Date.now(),
        },
        {
          device_id: MOCK_DEVICE_ID_2,
          event_type: MOCK_EVENT_TYPE,
          payload: JSON.stringify(MOCK_DATA),
          timestamp: Date.now(),
        },
      ];
      const timestamp = Date.now();
      client.publishBatch(msgs, timestamp);

      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${_DATA_PUSH_EVENT_TYPE}&timestamp=${timestamp}`,
        msgs,
        {
          headers: {
            Authorization: `Bearer ${MOCK_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
    });
  });
});
