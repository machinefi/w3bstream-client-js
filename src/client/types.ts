export interface IW3bstreamClient {
  publish: (deviceId: string, data: Object, eventType?: string) => Promise<any>;
}
