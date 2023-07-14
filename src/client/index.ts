import axios, { AxiosResponse } from "axios";

import { WSHeader, WSPayload, IW3bstreamClient } from "./types";

class W3bstreamClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "W3bstreamClientError";
  }
}

export class W3bstreamClient implements IW3bstreamClient {
  private _DATA_PUSH_EVENT_TYPE = "DA-TA_PU-SH";

  constructor(private _url: string, private _apiKey: string) {
    if (!_url) {
      throw new W3bstreamClientError("url is required");
    }
    if (!_apiKey) {
      throw new W3bstreamClientError("api key is required");
    }

    this._url = _url;
    this._apiKey = _apiKey;
  }

  public async publish(
    header: WSHeader,
    payload: Object | Buffer
  ): Promise<AxiosResponse> {
    if (!header.device_id) {
      throw new W3bstreamClientError("device id is required");
    }

    const payloadObj = this._buildPayload(header, payload);
    return this._publish(payloadObj, header.timestamp);
  }

  public async publishBatch(
    payload: WSPayload,
    timestamp?: number
  ): Promise<AxiosResponse> {
    return this._publish(payload, timestamp);
  }

  private _buildPayload(header: WSHeader, payload: Object | Buffer): WSPayload {
    const {
      device_id,
      event_type = "DEFAULT",
      timestamp = Date.now(),
    } = header;

    const _payload =
      payload instanceof Buffer ? payload.toString() : JSON.stringify(payload);

    return [
      {
        device_id,
        event_type,
        payload: _payload,
        timestamp,
      },
    ];
  }

  private _buildUrl(timestamp: number = Date.now()): string {
    return `${this._url}?eventType=${this._DATA_PUSH_EVENT_TYPE}&timestamp=${timestamp}`;
  }

  private _publish(
    payload: WSPayload,
    timestamp?: number
  ): Promise<AxiosResponse> {
    const url = this._buildUrl(timestamp);

    return axios.post(url, payload, {
      headers: {
        Authorization: `Bearer ${this._apiKey}`,
        "Content-Type": "application/json",
      },
    });
  }
}
