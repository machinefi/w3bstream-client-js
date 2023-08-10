import { Observable, from, of, timer, zip } from 'rxjs';
import { bufferCount, concatMap, map, mergeMap, take } from 'rxjs/operators';
import axios, { AxiosResponse } from "axios";

import { WSHeader, WSPayload, IW3bstreamClient, WSMessage, RawEvent } from "./types";

export const DATA_PUSH_EVENT_TYPE = "DA-TA_PU-SH";
export const DEFAULT_PUBLISH_INTERVAL_MS = 1_000;
export const DEFAULT_PUBLISH_BATCH_SIZE = 100;
export const DEFAULT_PUBLISH_BATCH_MAX = 1_000;

class W3bstreamClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "W3bstreamClientError";
  }
}

export class W3bstreamClient implements IW3bstreamClient {
  private _DATA_PUSH_EVENT_TYPE = DATA_PUSH_EVENT_TYPE;
  private _batchMax = DEFAULT_PUBLISH_BATCH_MAX;

  private _publishIntervalMs;
  private _batchSize;
  // private _numberOfRetries = 1;

  constructor(
    private _url: string,
    private _apiKey: string,
    {
      batchSize = DEFAULT_PUBLISH_BATCH_SIZE,
      publishIntervalMs = DEFAULT_PUBLISH_INTERVAL_MS
    }: {
      batchSize?: number;
      publishIntervalMs?: number;
    } = {}
  ) {
    if (!_url) {
      throw new W3bstreamClientError("url is required");
    }
    if (!_apiKey) {
      throw new W3bstreamClientError("api key is required");
    }

    this._url = _url;
    this._apiKey = _apiKey;
    this._batchSize = batchSize;
    this._publishIntervalMs = publishIntervalMs;
  }

  async publishSingle(
    header: WSHeader,
    payload: Object | Buffer
  ): Promise<AxiosResponse> {
    this._validateHeader(header);
    const payloadObj = this._buildPayload({ header, payload });
    return this._publish([payloadObj], header.timestamp);
  }

  publishEvents(events: RawEvent[]): Observable<Promise<AxiosResponse>> {
    const chunked = this._processAndChunkRawEvents(events)
    const publishInterval = this._getPublishInterval(events.length)
    const chunksWithInterval = this._addIntervalToChunks(chunked, publishInterval)
    return this._chunkPublisher(chunksWithInterval)
  }

  private _chunkPublisher(chunksWithInterval: Observable<WSMessage[]>): Observable<Promise<AxiosResponse>> {
    return from(chunksWithInterval).pipe(
      mergeMap((chunk) =>
        of(this._publish(chunk))
      )
    );
  }
  // .pipe(
  //   retry(this._numberOfRetries)
  // )
  // retry({
  //   count: this._numberOfRetries,
  //   delay: this._publishIntervalMs,
  // })
  private _addIntervalToChunks(chunked: Observable<WSMessage[]>, publishInterval: Observable<number>) {
    return zip(chunked, publishInterval).pipe(
      concatMap(([chunk]) => chunk),
      bufferCount(this._batchSize)
    );
  }

  private _getPublishInterval(eventsLength: number) {
    const delay = 0;
    return timer(delay, this._publishIntervalMs).pipe(
      take(this._calcChunksCount(eventsLength))
    );
  }

  private _processAndChunkRawEvents(events: RawEvent[]) {
    return from(events).pipe(
      map((event) => this._buildPayload(event)),
      bufferCount(this._batchMax)
    );
  }

  private _calcChunksCount(eventsLength: number): number {
    return Math.ceil(eventsLength / this._batchMax);
  }

  private _buildPayload(event: RawEvent): WSMessage {
    const { header, payload } = event;

    this._validateHeader(header);

    const {
      device_id,
      event_type = "DEFAULT",
      timestamp = this._currentTimestamp(),
    } = header;

    const _payload =
      payload instanceof Buffer ? payload.toString() : JSON.stringify(payload);

    return {
      device_id,
      event_type,
      payload: _payload,
      timestamp,
    }
  }

  private _validateHeader(header: WSHeader): void {
    if (!header.device_id) {
      throw new W3bstreamClientError("device id is required");
    }
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
