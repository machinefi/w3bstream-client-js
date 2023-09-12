import { WSHeader, WSPayload } from "../types";

export const MOCK_URL = "http://localhost:8080";
export const MOCK_API_KEY = "1234567890";
export const MOCK_DEVICE_ID = "1234567890";
export const MOCK_DEVICE_ID_2 = "0987654321";
export const MOCK_EVENT_TYPE = "DEFAULT";

export const MOCK_DATA = { test: "test" };

export const W3bstreamResponse = [
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
];

export const HEADER_1: WSHeader = {
  device_id: MOCK_DEVICE_ID,
  event_type: MOCK_EVENT_TYPE,
  timestamp: Date.now(),
};

export const HEADER_2: WSHeader = {
  device_id: MOCK_DEVICE_ID_2,
  event_type: MOCK_EVENT_TYPE,
  timestamp: Date.now(),
};

export const HEADER_1_REQUEST_BODY: WSPayload = [
  {
    device_id: HEADER_1.device_id,
    event_type: HEADER_1.event_type as string,
    payload: JSON.stringify(MOCK_DATA),
    timestamp: HEADER_1.timestamp as number,
  },
];

export const HEADER_2_REQUEST_BODY: WSPayload = [
  {
    device_id: HEADER_2.device_id,
    event_type: HEADER_2.event_type as string,
    payload: JSON.stringify(MOCK_DATA),
    timestamp: HEADER_2.timestamp as number,
  },
];

export const REQUEST_HEADERS = {
  headers: {
    Authorization: `Bearer ${MOCK_API_KEY}`,
    "Content-Type": "application/json",
  },
};
