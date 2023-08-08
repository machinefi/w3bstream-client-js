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

export interface WSPayload extends Array<WSMessage> { }

export interface IW3bstreamClient {
  queue: WSPayload;
  enqueueAndPublish: (header: WSHeader, payload: Object | Buffer) => boolean;
  publishDirect: (
    header: WSHeader,
    payload: Object | Buffer
  ) => Promise<AxiosResponse>;
  publish: (events: { header: WSHeader; payload: Object | Buffer }[]) => Promise<AxiosResponse[]>;
  stop: () => void;
}
