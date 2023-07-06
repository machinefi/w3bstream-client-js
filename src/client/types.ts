export interface IW3bstreamClient {
  publish: (deviceId: string, eventType: string, data: any) => Promise<any>;
}
