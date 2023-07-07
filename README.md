# w3bstream-client-js

The JS/TS Client for W3bstream integration on server. This library allows you to send messages to W3bstream using its API.

## Prerequisites

- Node.js v16 or higher
- Axios (^1.4.0) - this package is designed to work in an environment where Axios is already installed, as it's a peer dependency.

## Getting started

Install `w3bstream-client-js` via `npm`

```shell
npm install w3bstream-client-js
```

Also, make sure `axios` is installed in your project:

```shell
npm install axios
```

## Example Code

### Initialize client

```typescript
import { W3bstreamClient, WSHeader } from "w3bstream-client-js";

const URL = "http_route";
const API_KEY = "api_key";

const client = new W3bstreamClient(URL, API_KEY);
```

### Publish messages

```typescript
const header: WSHeader = {
  deviceId: "device_id",
  eventType: "event_type",
};

// const payload = Buffer.from("test data", "utf8"); or
const payload = {
  data: "data",
};

try {
  const res = await client.publish(header, payload);
  console.log(res.data);
} catch (error) {
  console.error(error);
}
```

### API

#### client.publish(header, payload)

Sends a message to the W3bstream service. Returns a promise that resolves with the server's response.

- `header`: An object that includes `deviceId`, `eventType` and `timestamp`.
- `payload`: The message to send. Can be an object or binary data.
