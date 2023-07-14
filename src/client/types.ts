import { AxiosResponse } from "axios";

export interface WSHeader {
  device_id: string;
  event_type?: string;
  timestamp?: number;
}

export interface WSMessage {
  device_id: string;
  event_type: string;
  payload: string;
  timestamp: number;
}

export interface WSPayload extends Array<WSMessage> {}

export interface IW3bstreamClient {
  queue: WSPayload;
  publish: (header: WSHeader, payload: Object | Buffer) => true;
  publishDirect: (
    header: WSHeader,
    payload: Object | Buffer
  ) => Promise<AxiosResponse>;
  startWorker: () => void;
  stopWorker: () => void;
}
