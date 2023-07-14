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
  HEADER_2,
  HEADER_2_REQUEST_BODY,
  PUBLISH_BATCH_SIZE,
  DEFAULT_PUBLISH_INTERVAL_MS,
  TESTING_PUBLISH_INTERVAL_MS,
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
  });
  describe("publishing in batches", () => {
    let client: IW3bstreamClient;
    let mockFetch: jest.SpyInstance;

    beforeEach(() => {
      mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
        return Promise.resolve(W3bstreamResponse);
      });

      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        publishIntervalMs: TESTING_PUBLISH_INTERVAL_MS,
      });
    });
    afterEach(() => {
      client.stop();
      mockFetch.mockRestore();
    });
    it("should queue single msg and publish it in interval", async () => {
      const isQueued = client.enqueueAndPublish(HEADER_1, MOCK_DATA);

      expect(isQueued).toBe(true);
      expect(client.queue.length).toBe(1);

      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
        ),
        HEADER_1_REQUEST_BODY,
        REQUEST_HEADERS
      );

      expect(client.queue.length).toBe(0);
    });
    it("should queue multiple msgs and publish them in interval", async () => {
      const isQueued1 = client.enqueueAndPublish(HEADER_1, MOCK_DATA);
      const isQueued2 = client.enqueueAndPublish(HEADER_2, MOCK_DATA);

      expect(isQueued1).toBe(true);
      expect(isQueued2).toBe(true);
      expect(client.queue.length).toBe(2);

      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
        ),
        [...HEADER_1_REQUEST_BODY, ...HEADER_2_REQUEST_BODY],
        REQUEST_HEADERS
      );

      expect(client.queue.length).toBe(0);
    });
    it("should have default publish interval", async () => {
      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
      });

      const isQueued = client2.enqueueAndPublish(HEADER_1, MOCK_DATA);

      expect(isQueued).toBe(true);
      expect(client2.queue.length).toBe(1);

      await new Promise((resolve) =>
        setTimeout(resolve, DEFAULT_PUBLISH_INTERVAL_MS)
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
        ),
        HEADER_1_REQUEST_BODY,
        REQUEST_HEADERS
      );

      expect(client2.queue.length).toBe(0);

      client2.stop();
    });
    it("should publish queue on stop", async () => {
      const isQueued1 = client.enqueueAndPublish(HEADER_1, MOCK_DATA);
      const isQueued2 = client.enqueueAndPublish(HEADER_2, MOCK_DATA);

      expect(isQueued1).toBe(true);
      expect(isQueued2).toBe(true);
      expect(client.queue.length).toBe(2);

      client.stop();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringMatching(
          new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
        ),
        [...HEADER_1_REQUEST_BODY, ...HEADER_2_REQUEST_BODY],
        REQUEST_HEADERS
      );

      expect(client.queue.length).toBe(0);
    });
    it("cannot publish more messages in one batch than the batch limit", async () => {
      for (let i = 0; i < 20; i++) {
        const header: WSHeader = {
          device_id: "device_id_" + i,
          event_type: MOCK_EVENT_TYPE,
          timestamp: Date.now(),
        };
        client.enqueueAndPublish(header, MOCK_DATA);
      }

      expect(client.queue.length).toBe(20);
      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);

      expect(client.queue.length).toBe(10);
      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);

      expect(client.queue.length).toBe(0);
    });
    it("can set the batch limit", async () => {
      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        batchSize: PUBLISH_BATCH_SIZE,
        publishIntervalMs: TESTING_PUBLISH_INTERVAL_MS,
      });

      const eventsToPublish = PUBLISH_BATCH_SIZE * 2;

      for (let i = 0; i < eventsToPublish; i++) {
        const header: WSHeader = {
          device_id: "device_id_" + i,
          event_type: MOCK_EVENT_TYPE,
          timestamp: Date.now(),
        };
        client2.enqueueAndPublish(header, MOCK_DATA);
      }

      expect(client2.queue.length).toBe(eventsToPublish);
      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );
      expect(mockFetch).toHaveBeenCalledTimes(1);

      expect(client2.queue.length).toBe(PUBLISH_BATCH_SIZE);
      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );
      expect(mockFetch).toHaveBeenCalledTimes(2);

      expect(client2.queue.length).toBe(0);

      client2.stop();
    });
    it.skip("should throw error if publish fails", async () => {
      const isQueued1 = client.enqueueAndPublish(HEADER_1, MOCK_DATA);
      const isQueued2 = client.enqueueAndPublish(HEADER_2, MOCK_DATA);

      expect(isQueued1).toBe(true);
      expect(isQueued2).toBe(true);
      expect(client.queue.length).toBe(2);

      await new Promise((resolve) =>
        setTimeout(resolve, TESTING_PUBLISH_INTERVAL_MS)
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);

      expect(client.queue.length).toBe(2);
    });
    it("should set max queue size", async () => {
      const newQueueSize = 5;
      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        batchSize: PUBLISH_BATCH_SIZE,
        publishIntervalMs: TESTING_PUBLISH_INTERVAL_MS,
        maxQueueSize: newQueueSize,
      });

      for (let i = 0; i < newQueueSize; i++) {
        const header: WSHeader = {
          device_id: "device_id_" + i,
          event_type: MOCK_EVENT_TYPE,
          timestamp: Date.now(),
        };
        client2.enqueueAndPublish(header, MOCK_DATA);
      }

      const isAddedToQueue = client2.enqueueAndPublish(HEADER_1, MOCK_DATA);

      expect(isAddedToQueue).toBe(false);

      expect(client2.queue.length).toBe(newQueueSize);

      client2.stop();
    });
    it("should throw if worker is not running", () => {
      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        batchSize: PUBLISH_BATCH_SIZE,
        publishIntervalMs: TESTING_PUBLISH_INTERVAL_MS,
      });

      client2.stop();

      expect(() => client2.enqueueAndPublish(HEADER_1, MOCK_DATA)).toThrow(
        "attempted to enqueue without enabling batching"
      );
    });
  });
});
