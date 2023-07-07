export interface WSHeader {
  deviceId: string;
  eventType?: string;
  timestamp?: string;
}

export interface IW3bstreamClient {
  publish: (header: WSHeader, payload: Object) => Promise<Response>;
}

export class W3bstreamClient implements IW3bstreamClient {
  constructor(private _url: string, private _apiKey: string) {
    if (!_url) {
      throw new Error("W3bstreamClient: url is required");
    }
    if (!_apiKey) {
      throw new Error("W3bstreamClient: api key is required");
    }

    this._url = _url;
    this._apiKey = _apiKey;
  }

  public async publish(header: WSHeader, payload: Object): Promise<Response> {
    if (!header.deviceId) {
      throw new Error("W3bstreamClient: device id is required");
    }

    const url = this._buildUrl(header);
    return this._publish(url, payload);
  }

  private _buildUrl({
    deviceId,
    eventType = "DEFAULT",
    timestamp,
  }: WSHeader): string {
    const timestampParam = timestamp ? `&timestamp=${timestamp}` : "";
    return `${this._url}?device_id=${deviceId}&eventType=${eventType}${timestampParam}`;
  }

  private _publish(url: string, payload: Object): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(payload),
    });
  }

  private _headers(): Headers {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${this._apiKey}`);
    headers.append("Content-Type", "application/json");
    return headers;
  }
}
