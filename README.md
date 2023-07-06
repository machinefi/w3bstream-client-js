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
const DEVICE_ID = "device_id";
const DATA = { test: "test" };

const res = await client.publish(DEVICE_ID, DATA);
console.log(await res.json());
```
