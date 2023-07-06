import { IW3bstreamClient } from "@src/client/types";

export class W3bstreamClient implements IW3bstreamClient {
  constructor(private _url: string, private _apiKey: string) {}

  public async publish(
    deviceId: string,
    eventType: string = "DEFAULT",
    data: any
  ): Promise<any> {
    const url = this._buildUrl(deviceId, eventType);
    return this._publish(url, data);
  }

  private _buildUrl(device_id: string, eventType: string): string {
    return `${
      this._url
    }?device_id=${device_id}&eventType=${eventType}&timestamp=${Date.now()}`;
  }

  private _publish(url: string, data: any): Promise<any> {
    return fetch(url, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(data),
    });
  }

  private _headers(): Headers {
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${this._apiKey}`);
    headers.append("Content-Type", "application/json");
    return headers;
  }
}
