# w3bstream-client-js

The JS/TS Client for W3bstream integration on server

## Getting started

Install `w3bstream-client-js` via `npm`

```shell
npm install w3bstream-client-js
```

## Example Code

### Initialize client

```typescript
import { W3bstreamClient } from "w3bstream-client-js";

const URL = "http_route";
const API_KEY = "api_key";

const client = new W3bstreamClient(URL, API_KEY);
```

### Publish messages

```typescript
const header = {
  deviceId: "device_id",
  eventType: "event_type",
};

const payload = {
  data: "data",
};

const response = await client.publish(header, payload);
console.log(response);
```
