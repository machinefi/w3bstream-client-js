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
  private _worker: NodeJS.Timeout | null = null;
  private _publishIntervalMs = 1_000;
  private _batchSize = 10;
  private _maxQueueSize = 0;

  queue: WSPayload = [];

  constructor(
    private _url: string,
    private _apiKey: string,
    options?: {
      enableBatching?: boolean;
      batchSize?: number;
      publishIntervalMs?: number;
      maxQueueSize?: number;
    }
  ) {
    if (!_url) {
      throw new W3bstreamClientError("url is required");
    }
    if (!_apiKey) {
      throw new W3bstreamClientError("api key is required");
    }

    this._url = _url;
    this._apiKey = _apiKey;
    this._batchSize = options?.batchSize || this._batchSize;
    this._publishIntervalMs =
      options?.publishIntervalMs || this._publishIntervalMs;
    this._maxQueueSize = options?.maxQueueSize || this._maxQueueSize;

    if (options?.enableBatching) {
      this._startWorker();
    }
  }

  public enqueueAndPublish(
    header: WSHeader,
    payload: Object | Buffer
  ): boolean {
    if (!this._worker) {
      throw new W3bstreamClientError(
        "attempted to enqueue without enabling batching"
      );
    }
    if (this._maxQueueSize > 0 && this.queue.length >= this._maxQueueSize) {
      return false;
    }
    this._validateHeader(header);

    const payloadObj = this._buildPayload(header, payload);
    this.addToQueue(payloadObj);
    return true;
  }

  public async publishDirect(
    header: WSHeader,
    payload: Object | Buffer
  ): Promise<AxiosResponse> {
    this._validateHeader(header);
    const payloadObj = this._buildPayload(header, payload);
    return this._publish(payloadObj, header.timestamp);
  }

  public stop(): void {
    this._publishQueue();

    if (this._worker) {
      clearInterval(this._worker);
      this._worker = null;
    }
  }

  private _startWorker(): void {
    this._worker = setInterval(
      async () => await this._publishQueue(),
      this._publishIntervalMs
    );
  }

  private async _publishQueue(): Promise<void> {
    if (this.queue.length > 0) {
      const payload = this.takeFromQueue(this._batchSize);

      try {
        await this._publish(payload);
      } catch (e) {
        console.error(e);
        console.log("requeueing: ", payload);
        this.addToQueue(payload);
      }
    }
  }

  private takeFromQueue(length: number): WSPayload {
    return this.queue.splice(0, length);
  }

  private addToQueue(payloadObj: WSPayload) {
    this.queue.push(...payloadObj);
  }

  private _validateHeader(header: WSHeader): void {
    if (!header.device_id) {
      throw new W3bstreamClientError("device id is required");
    }
  }

  private _buildPayload(header: WSHeader, payload: Object | Buffer): WSPayload {
    const {
      device_id,
      event_type = "DEFAULT",
      timestamp = this._currentTimestamp(),
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

  private _buildUrl(timestamp: number = this._currentTimestamp()): string {
    return `${this._url}?eventType=${this._DATA_PUSH_EVENT_TYPE}&timestamp=${timestamp}`;
  }

  private _currentTimestamp(): number {
    return Date.now();
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
