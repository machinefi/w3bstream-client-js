import { AxiosResponse } from "axios";
import { Observable } from "rxjs";

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
  publishSingle: (
    header: WSHeader,
    payload: Object | Buffer
  ) => Promise<AxiosResponse>;
  publishEvents: (
    events: RawEvent[]
  ) => Observable<AxiosResponse>;
}

export interface RawEvent {
  header: WSHeader;
  payload: Object | Buffer;
}