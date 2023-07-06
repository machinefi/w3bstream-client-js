export interface IW3bstreamClient {
  publish: (deviceId: string, data: Object, eventType?: string) => Promise<Response>;
}

interface SingleMsg {
  device_id: string;
  payload: string;
}

interface Messages extends Array<SingleMsg> {}

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

  public async publish(
    deviceId: string,
    data: Object,
    eventType: string = "DEFAULT"
  ): Promise<Response> {
    if (!deviceId) {
      throw new Error("W3bstreamClient: device id is required");
    }

    const url = this._buildUrl(eventType);
    const messages = this._parseData(deviceId, data);
    return this._publish(url, messages);
  }

  private _buildUrl(eventType: string): string {
    return `${this._url}?eventType=${eventType}`;
  }

  private _parseData(device_id: string, data: Object): Messages {
    return [
      {
        device_id,
        payload: JSON.stringify(data),
      },
    ];
  }

  private _publish(url: string, msgs: Messages): Promise<Response> {
    return fetch(url, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(msgs),
    });
  }

  private _headers(): Headers {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${this._apiKey}`);
    headers.append("Content-Type", "application/json");
    return headers;
  }
}
