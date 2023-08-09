import axios from "axios";

import { W3bstreamClient, DATA_PUSH_EVENT_TYPE, DEFAULT_PUBLISH_BATCH_SIZE, DEFAULT_PUBLISH_INTERVAL_MS } from "..";
import { WSHeader, IW3bstreamClient, WSPayload } from "../types";
import {
  HEADER_1,
  MOCK_API_KEY,
  MOCK_DATA,
  MOCK_URL,
  W3bstreamResponse,
  HEADER_1_REQUEST_BODY,
  REQUEST_HEADERS,
  MOCK_DEVICE_ID,
  MOCK_EVENT_TYPE,
  HEADER_2,
  HEADER_2_REQUEST_BODY,
} from "../__fixtures__";

describe("W3bstreamClient", () => {
  let mockFetch: jest.SpyInstance;

  beforeEach(() => {
    mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
      return Promise.resolve(W3bstreamResponse);
    });
  });
  afterEach(() => {
    mockFetch.mockRestore();
  });

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
  describe("publishDirect", () => {
    let client: IW3bstreamClient;

    beforeEach(() => {
      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
    });

    it("should publish single msg with complete header", async () => {
      client.publishDirect(HEADER_1, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${DATA_PUSH_EVENT_TYPE}&timestamp=${HEADER_1.timestamp}`,
        HEADER_1_REQUEST_BODY,
        REQUEST_HEADERS
      );
    });
    it("should publish single msg without event type in header", async () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
        timestamp: Date.now(),
      };

      client.publishDirect(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${DATA_PUSH_EVENT_TYPE}&timestamp=${header.timestamp}`,
        [
          {
            device_id: MOCK_DEVICE_ID,
            event_type: "DEFAULT",
            payload: JSON.stringify(MOCK_DATA),
            timestamp: header.timestamp,
          },
        ],
        REQUEST_HEADERS
      );
    });
    it("should publish single msg without timestamp in header", async () => {
      const header: WSHeader = {
        device_id: MOCK_DEVICE_ID,
        event_type: MOCK_EVENT_TYPE,
      };
      const mockedTimestamp = 1234567890;
      const dateSpy = jest
        .spyOn(Date, "now")
        .mockImplementation(() => mockedTimestamp);

      client.publishDirect(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${DATA_PUSH_EVENT_TYPE}&timestamp=${mockedTimestamp}`,
        [
          {
            device_id: MOCK_DEVICE_ID,
            event_type: MOCK_EVENT_TYPE,
            payload: JSON.stringify(MOCK_DATA),
            timestamp: mockedTimestamp,
          },
        ],
        REQUEST_HEADERS
      );

      dateSpy.mockRestore();
    });
    it("should publish single msg with binary data", () => {
      const data = Buffer.from("test data", "utf8");
      client.publishDirect(HEADER_1, data);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        `${MOCK_URL}?eventType=${DATA_PUSH_EVENT_TYPE}&timestamp=${HEADER_1.timestamp}`,
        [
          {
            device_id: HEADER_1.device_id,
            event_type: HEADER_1.event_type,
            payload: data.toString(),
            timestamp: HEADER_1.timestamp,
          },
        ],
        REQUEST_HEADERS
      );
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
  });
  describe("enqueueAndPublish", () => {
    let client: IW3bstreamClient;

    beforeEach(() => {
      jest.useFakeTimers();

      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
      });
    });
    afterEach(() => {
      client.stop();
      jest.useRealTimers();
    });

    it("should queue single msg and publish it in interval", async () => {
      const isQueued = client.enqueueAndPublish(HEADER_1, MOCK_DATA);

      expect(isQueued).toBe(true);
      expect(client.queue.length).toBe(1);

      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPost(mockFetch, HEADER_1_REQUEST_BODY);
      expect(client.queue.length).toBe(0);
    });
    it("should queue multiple msgs and publish them in interval", async () => {
      const isQueued1 = client.enqueueAndPublish(HEADER_1, MOCK_DATA);
      const isQueued2 = client.enqueueAndPublish(HEADER_2, MOCK_DATA);

      expect(isQueued1).toBe(true);
      expect(isQueued2).toBe(true);
      expect(client.queue.length).toBe(2);

      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPost(mockFetch, [...HEADER_1_REQUEST_BODY, ...HEADER_2_REQUEST_BODY]);
      expect(client.queue.length).toBe(0);
    });
    it("can set custom publish interval", async () => {
      const newPublishInterval = 5_000;

      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        publishIntervalMs: newPublishInterval,
      });

      client2.enqueueAndPublish(HEADER_1, MOCK_DATA);

      expect(mockFetch).not.toHaveBeenCalled();
      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);

      expect(mockFetch).not.toHaveBeenCalled();
      jest.advanceTimersByTime(
        newPublishInterval - DEFAULT_PUBLISH_INTERVAL_MS
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPost(mockFetch, HEADER_1_REQUEST_BODY);

      expect(client2.queue.length).toBe(0);

      client2.stop();
    });
    it("should publish the rest of queue on stop", async () => {
      client.enqueueAndPublish(HEADER_1, MOCK_DATA);
      client.enqueueAndPublish(HEADER_2, MOCK_DATA);
      expect(client.queue.length).toBe(2);

      client.stop();

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPost(mockFetch, [...HEADER_1_REQUEST_BODY, ...HEADER_2_REQUEST_BODY]);

      expect(client.queue.length).toBe(0);
    });
    it("publishes msgs in batches respecting batch size", async () => {
      const eventsToPublish = DEFAULT_PUBLISH_BATCH_SIZE * 2;
      generateAndEnqueEvents(eventsToPublish, client);

      expect(client.queue.length).toBe(eventsToPublish);
      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);
      expect(mockFetch).toHaveBeenCalledTimes(1);

      expect(client.queue.length).toBe(
        eventsToPublish - DEFAULT_PUBLISH_BATCH_SIZE
      );

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      expect(client.queue.length).toBe(0);
    });
    it("can set a custom batch limit", async () => {
      const newPublishBatchSize = 5;
      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        batchSize: newPublishBatchSize,
      });

      const eventsToPublish = newPublishBatchSize * 2;
      generateAndEnqueEvents(eventsToPublish, client2);

      expect(client2.queue.length).toBe(eventsToPublish);
      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(client2.queue.length).toBe(newPublishBatchSize);

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      expect(client2.queue.length).toBe(0);

      client2.stop();
    });
    it("should throw error if publish fails", (done) => {
      mockFetch.mockRejectedValueOnce(new Error("test error"));

      generateAndEnqueEvents(2, client);
      expect(client.queue.length).toBe(2);
      expect(mockFetch).not.toHaveBeenCalled();

      jest.advanceTimersByTime(DEFAULT_PUBLISH_INTERVAL_MS);

      jest.useRealTimers();
      setTimeout(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(client.queue.length).toBe(2);
        done();
      }, 1);
    });
    it("should set custom max queue size", async () => {
      const newQueueSize = 5;

      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        enableBatching: true,
        maxQueueSize: newQueueSize,
      });
      generateAndEnqueEvents(newQueueSize, client2);

      const isAddedToQueue = client2.enqueueAndPublish(HEADER_1, MOCK_DATA);

      expect(isAddedToQueue).toBe(false);
      expect(client2.queue.length).toBe(newQueueSize);

      client2.stop();
    });
    it("should throw if worker is not running", () => {
      client.stop();

      expect(() => client.enqueueAndPublish(HEADER_1, MOCK_DATA)).toThrow(
        "attempted to enqueue without enabling batching"
      );
    });
  });
  describe("publish", () => {
    let client: IW3bstreamClient;

    beforeEach(() => {
      jest.useFakeTimers();

      client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should publish single msg", async () => {
      const events = generateEvents(HEADER_1, 1);
      const calls = calcExpectedCallTimes(events);

      const res = await client.publish(events);

      expect(mockFetch).toHaveBeenCalledTimes(calls);
      assertAxiosNthPostCall(mockFetch, 1, HEADER_1_REQUEST_BODY, 1);
      expect(res.length).toBe(calls);
    });
    it("should publish multiple msgs", async () => {
      const events = generateEvents(HEADER_1, 2);
      const calls = calcExpectedCallTimes(events);

      const res = await client.publish(events);

      expect(mockFetch).toHaveBeenCalledTimes(calls);
      assertAxiosNthPostCall(mockFetch, 1, HEADER_1_REQUEST_BODY, 2);
      expect(res.length).toBe(calls);
    });
    it("should publish msgs in batches respecting batch size", async () => {
      const batch1 = generateEvents(HEADER_1);
      const batch2 = generateEvents(HEADER_2);
      const eventsAll = [...batch1, ...batch2];
      const calls = calcExpectedCallTimes(eventsAll);

      const res = await client.publish(eventsAll);

      expect(mockFetch).toHaveBeenCalledTimes(calls);
      assertAxiosNthPostCall(mockFetch, 1, HEADER_1_REQUEST_BODY);
      assertAxiosNthPostCall(mockFetch, 2, HEADER_2_REQUEST_BODY);
      expect(res.length).toBe(calls)
    });
    it("should publish msgs in batches if msgs length is uneven", async () => {
      const batch1 = generateEvents(HEADER_1);
      const batch2Size = DEFAULT_PUBLISH_BATCH_SIZE - 1;
      const batch2 = generateEvents(HEADER_2, batch2Size);
      const events = [...batch1, ...batch2];
      const calls = calcExpectedCallTimes(events);

      const res = await client.publish(events);

      expect(mockFetch).toHaveBeenCalledTimes(calls);
      assertAxiosNthPostCall(mockFetch, 1, HEADER_1_REQUEST_BODY);
      assertAxiosNthPostCall(mockFetch, 2, HEADER_2_REQUEST_BODY, batch2Size);
      expect(res.length).toBe(calls);
    });
    it("should publish 100_000 msgs in batches", async () => {
      const client2 = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);

      const eventsAll = generateEvents(HEADER_1, 100_000);
      const calls = calcExpectedCallTimes(eventsAll);

      const res = await client2.publish(eventsAll);

      expect(mockFetch).toHaveBeenCalledTimes(calls);
      expect(res.length).toBe(calls);
    });
    it("should throw if no device id", async () => {
      const msgs = [
        {
          header: { ...HEADER_1, device_id: "" },
          payload: MOCK_DATA,
        }
      ]

      await expect(client.publish(msgs)).rejects.toThrow(
        "device id is required"
      );
    });
  })

});

function calcExpectedCallTimes(events: any[]) {
  return Math.ceil(events.length / DEFAULT_PUBLISH_BATCH_SIZE);
}

function assertAxiosPost(mockFetch: jest.SpyInstance<any, any, any>, body: WSPayload) {
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringMatching(
      new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
    ),
    body,
    REQUEST_HEADERS
  );
}

function assertAxiosNthPostCall(mockFetch: jest.SpyInstance<any, any, any>, nthCall: number, body: WSPayload, size: number = DEFAULT_PUBLISH_BATCH_SIZE) {
  expect(mockFetch).toHaveBeenNthCalledWith(
    nthCall,
    expect.stringMatching(
      new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
    ),
    Array(size).fill(body).flat(),
    REQUEST_HEADERS
  );
}

function generateEvents(header: WSHeader, size: number = DEFAULT_PUBLISH_BATCH_SIZE) {
  return Array(size).fill({
    header,
    payload: MOCK_DATA,
  });
}

function generateAndEnqueEvents(eventsToPublish: number, client: IW3bstreamClient) {
  for (let i = 0; i < eventsToPublish; i++) {
    const header: WSHeader = {
      device_id: "device_id_" + i,
      event_type: MOCK_EVENT_TYPE,
      timestamp: Date.now(),
    };
    client.enqueueAndPublish(header, MOCK_DATA);
  }
}
