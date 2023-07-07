import axios from "axios";

import { W3bstreamClient, IW3bstreamClient } from "./";

const MOCK_URL = "http://localhost:8080";
const MOCK_API_KEY = "1234567890";
const MOCK_DEVICE_ID = "1234567890";
const MOCK_EVENT_TYPE = "DEFAULT";
const MOCK_DATA = { test: "test" };

const mockFetch = jest.spyOn(axios, "post").mockImplementation(() => {
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

      expect(mockFetch).toHaveBeenCalled();
    });
    it("should publish single msg without event type", () => {
      const client = initClient();

      const header = {
        deviceId: MOCK_DEVICE_ID,
      };

      client.publish(header, MOCK_DATA);

      expect(mockFetch).toHaveBeenCalled();
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
    it("should publish single msg with binary data", () => {
      const client = initClient();

      const header = {
        deviceId: MOCK_DEVICE_ID,
        eventType: MOCK_EVENT_TYPE,
      };

      const data = Buffer.from("test data", "utf8");
      client.publish(header, data);

      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
