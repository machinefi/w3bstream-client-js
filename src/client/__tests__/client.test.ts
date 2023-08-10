import axios from "axios";

import {
  W3bstreamClient,
  DATA_PUSH_EVENT_TYPE,
  DEFAULT_PUBLISH_BATCH_SIZE,
  DEFAULT_PUBLISH_BATCH_MAX,
  DEFAULT_PUBLISH_INTERVAL_MS
} from "..";
import { IW3bstreamClient, RawEvent, WSHeader, WSPayload } from "../types";
import {
  HEADER_1,
  MOCK_API_KEY,
  MOCK_DATA,
  MOCK_URL,
  W3bstreamResponse,
  HEADER_1_REQUEST_BODY,
  REQUEST_HEADERS,
} from "../__fixtures__";

describe("W3bstreamClient", () => {
  let mockFetch: jest.SpyInstance;
  let client: IW3bstreamClient;

  beforeEach(() => {
    mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
      return Promise.resolve(W3bstreamResponse);
    });

    client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY);
  });
  afterEach(() => {
    mockFetch.mockRestore();
  });

  describe("constructor", () => {
    it("should initialize", () => {
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
  describe("publishSingle", () => {
    it("should publish single msg with complete header", async () => {
      client.publishSingle(HEADER_1, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPostWithTimestamp(mockFetch, HEADER_1.timestamp as number, HEADER_1_REQUEST_BODY);
    });
    it("should publish single msg without event type in header", async () => {
      const header = { ...HEADER_1, event_type: undefined };

      client.publishSingle(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPostWithTimestamp(mockFetch, header.timestamp as number, [
        {
          ...HEADER_1_REQUEST_BODY[0],
          event_type: "DEFAULT",
        }
      ]);
    });
    it("should publish single msg without timestamp in header", async () => {
      const mockedTimestamp = 1234567890;
      const dateSpy = jest
        .spyOn(Date, "now")
        .mockImplementation(() => mockedTimestamp);

      const header = { ...HEADER_1, timestamp: undefined };
      client.publishSingle(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPostWithTimestamp(mockFetch, mockedTimestamp, [
        {
          ...HEADER_1_REQUEST_BODY[0],
          timestamp: mockedTimestamp,
        }
      ]);

      dateSpy.mockRestore();
    });
    it("should publish single msg with binary data", () => {
      const data = Buffer.from("test data", "utf8");
      client.publishSingle(HEADER_1, data);

      expect(mockFetch).toHaveBeenCalledTimes(1);
      assertAxiosPostWithTimestamp(mockFetch, HEADER_1.timestamp as number, [
        {
          ...HEADER_1_REQUEST_BODY[0],
          payload: data.toString(),
        }
      ]);
    });
    it("should throw if no device id", async () => {
      const header = { ...HEADER_1, device_id: "" };

      await expect(client.publishSingle(header, MOCK_DATA)).rejects.toThrow(
        "device id is required"
      );
    });
  });
  describe("publishEvents", () => {
    it("should publish single msg with complete header", done => {
      const events = [{ header: HEADER_1, payload: MOCK_DATA }];
      const calls = calcExpectedCallTimes(events);

      assertSubscribe(client, events, done, mockFetch, calls, HEADER_1_REQUEST_BODY);
    });
    it("should publish multiple msgs with batch size", done => {
      const eventLength = DEFAULT_PUBLISH_BATCH_SIZE;
      const events = generateEvents(HEADER_1, eventLength);
      const calls = calcExpectedCallTimes(events);

      assertSubscribe(client, events, done, mockFetch, calls, HEADER_1_REQUEST_BODY);
    })
    it("should publish multiple msgs below batch size", done => {
      const eventLength = DEFAULT_PUBLISH_BATCH_SIZE - 1;
      const events = generateEvents(HEADER_1, eventLength);
      const calls = calcExpectedCallTimes(events);

      assertSubscribe(client, events, done, mockFetch, calls, HEADER_1_REQUEST_BODY);
    })
    it("should publish multiple msgs above batch size", done => {
      const eventLength = DEFAULT_PUBLISH_BATCH_SIZE + 1;
      const events = generateEvents(HEADER_1, eventLength);
      const calls = calcExpectedCallTimes(events);

      assertSubscribe(client, events, done, mockFetch, calls, HEADER_1_REQUEST_BODY);
    });
    it("should publish multiple msgs with max batch size", done => {
      const eventLength = DEFAULT_PUBLISH_BATCH_MAX;
      const events = generateEvents(HEADER_1, eventLength);
      const calls = calcExpectedCallTimes(events);

      assertSubscribe(client, events, done, mockFetch, calls, HEADER_1_REQUEST_BODY);
    })
    it("should publish multiple msgs above max batch size", done => {
      const eventLength = DEFAULT_PUBLISH_BATCH_MAX + 1;
      const events = generateEvents(HEADER_1, eventLength);
      const calls = calcExpectedCallTimes(events);

      assertSubscribe(client, events, done, mockFetch, calls, HEADER_1_REQUEST_BODY);
    })
    it("should change batch size", done => {
      const batchSize = 10;
      const client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        batchSize,
      });
      const eventLength = batchSize + 1;
      const events = generateEvents(HEADER_1, eventLength);

      assertSubscribe(client, events, done, mockFetch, 2, HEADER_1_REQUEST_BODY, batchSize);
    })
    it("should change publish interval", done => {
      const publishIntervalMs = 500;
      const client = new W3bstreamClient(MOCK_URL, MOCK_API_KEY, {
        publishIntervalMs,
      });
      const eventLength = DEFAULT_PUBLISH_BATCH_MAX * 2;
      const events = generateEvents(HEADER_1, eventLength);
      const calls = calcExpectedCallTimes(events);

      client.publishEvents(events)
        .subscribe({
          next: () => { },
          error: () => done.fail(),
          complete: () => {
            expect(mockFetch).toHaveBeenCalledTimes(calls);
            assertPublishInterval(mockFetch, publishIntervalMs, DEFAULT_PUBLISH_INTERVAL_MS);
            done();
          },
        });

    })
  });
});

function assertSubscribe(
  client: IW3bstreamClient,
  events: RawEvent[],
  done: jest.DoneCallback,
  mockFetch: jest.SpyInstance<any, any, any>,
  calls: number,
  body: WSPayload,
  batchSize: number = DEFAULT_PUBLISH_BATCH_SIZE
) {
  client.publishEvents(events)
    .subscribe({
      next: () => { },
      error: () => done.fail(),
      complete: () => {
        expect(mockFetch).toHaveBeenCalledTimes(calls);
        assertPostCalls(mockFetch, calls, body, events.length, batchSize);
        done();
      },
    });
}

function assertPublishInterval(mockFetch: jest.SpyInstance<any, any, any>, min: number, max: number) {
  const callsInOneBatch = DEFAULT_PUBLISH_BATCH_MAX / DEFAULT_PUBLISH_BATCH_SIZE;
  const firstCallInFirstBatch = mockFetch.mock.calls[0][0];
  const firstCallInSecondBatch = mockFetch.mock.calls[callsInOneBatch][0];

  const firstTimestamp = firstCallInFirstBatch.split("timestamp=")[1];
  const secondTimestamp = firstCallInSecondBatch.split("timestamp=")[1];

  expect(secondTimestamp - firstTimestamp).toBeGreaterThanOrEqual(min);
  expect(secondTimestamp - firstTimestamp).toBeLessThan(max);
}

function assertPostCalls(
  mockFetch: jest.SpyInstance<any, any, any>,
  calls: number,
  body: WSPayload,
  size: number,
  batchSize: number
) {
  let count = size;
  for (let i = 1; i <= calls; i++) {
    const l = count > batchSize ? batchSize : count;
    assertAxiosNthPostCall(mockFetch, i, body, l);
    count -= batchSize;
  }
}

function assertAxiosPostWithTimestamp(post: jest.SpyInstance<any, any, any>, ts: number, body: WSPayload) {
  expect(post).toHaveBeenCalledWith(
    `${MOCK_URL}?eventType=${DATA_PUSH_EVENT_TYPE}&timestamp=${ts}`,
    body,
    REQUEST_HEADERS
  );
}

function calcExpectedCallTimes(events: any[]) {
  return Math.ceil(events.length / DEFAULT_PUBLISH_BATCH_SIZE);
}

// function assertAxiosPost(mockFetch: jest.SpyInstance<any, any, any>, body: WSPayload) {
//   expect(mockFetch).toHaveBeenCalledWith(
//     expect.stringMatching(
//       new RegExp(`${MOCK_URL}\\?eventType=${DATA_PUSH_EVENT_TYPE}`)
//     ),
//     body,
//     REQUEST_HEADERS
//   );
// }

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
