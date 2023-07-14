# w3bstream-client-js

[![npm](https://img.shields.io/npm/v/w3bstream-client-js)](https://www.npmjs.com/package/w3bstream-client-js)

The JS/TS Client for W3bstream integration on server. This library allows you to send messages to W3bstream using its API.

## Table of Contents

- [w3bstream-client-js](#w3bstream-client-js)
  - [Table of Contents](#table-of-contents)
  - [Prerequisites](#prerequisites)
  - [Getting started](#getting-started)
  - [Example Code](#example-code)
    - [Initialize client](#initialize-client)
    - [Publish single message](#publish-single-message)
    - [Publish multiple messages](#publish-multiple-messages)
    - [API](#api)
      - [client.publish](#clientpublishheader-payload-boolean)
      - [client.publishDirect](#clientpublishdirectmsgs-timestamp-promiseaxiosresponseany)

## Prerequisites

- Node.js v16 or higher

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

### Publish single message

```typescript
const header = {
  device_id: "device_001",
  event_type: "DEFAULT",
  timestamp: Date.now(),
};

// const payload = Buffer.from('{"temperature": 25}', "utf8");
// OR
const payload = {
  temperature: 25,
};

const main = async () => {
  try {
    const res = await client.publishDirect(header, payload);

    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error(error);
  }
};

main();
```

### Batch publish

```typescript
const EVENT_TYPE = "SUBMIT_TEMPERATURE";
const BATCH_SIZE = 2;
const PUBLISH_INTERVAL_MS = 5_000;
const MAX_QUEUE_SIZE = 10;

const client = new W3bstreamClient(URL, API_KEY, {
  withBatching: true,
  batchSize: BATCH_SIZE,
  publishIntervalMs: PUBLISH_INTERVAL_MS,
  maxQueueSize: MAX_QUEUE_SIZE,
});

const EVENTS_TO_PUBLISH = 10;

for (let i = 0; i < EVENTS_TO_PUBLISH; i++) {
  const header = {
    device_id: "device_id_" + i,
    event_type: EVENT_TYPE,
    timestamp: Date.now(),
  };
  const payload = {
    temperature: 25 + i,
  };
  client.publish(header, payload);
}

setTimeout(() => {
  client.stopWorker();
}, (EVENTS_TO_PUBLISH / BATCH_SIZE) * PUBLISH_INTERVAL_MS);
```

### API

#### client.publish(header, payload): boolean

The event is added to a queue and published in batches. The batch size and publish interval can be configured while initializing the client.

Returns:
`true` if the event was successfully added to the queue, `false` otherwise.

- `header`: An object that includes `device_id`, `event_type` and `timestamp`.
- `payload`: The message to send. Can be an object or binary data.

#### client.publishDirect(msgs, timestamp): Promise\<AxiosResponse\<any>>

Sends a message to the W3bstream service. Returns a promise that resolves with the server's response.

- `header`: An object that includes `device_id`, `event_type` and `timestamp`.
- `payload`: The message to send. Can be an object or binary data.