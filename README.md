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
      - [client.publish(header, payload)](#clientpublishheader-payload)

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
    const res = await client.publish(header, payload);

    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error(error);
  }
};

main();
```

### Publish multiple messages

```typescript
const EVENT_TYPE = "SUBMIT_TEMPERATURE";

const payloads = [
  {
    temperature: 25,
  },
  {
    temperature: 26,
  },
  {
    temperature: 27,
  },
];

const msgs = [
  {
    device_id: "device_001",
    event_type: EVENT_TYPE,
    payload: JSON.stringify(payloads[0]),
    timestamp: Date.now(),
  },
  {
    device_id: "device_001",
    event_type: EVENT_TYPE,
    payload: JSON.stringify(payloads[1]),
    timestamp: Date.now(),
  },
  {
    device_id: "device_002",
    event_type: EVENT_TYPE,
    payload: JSON.stringify(payloads[2]),
    timestamp: Date.now(),
  },
];

const timestamp = Date.now();

const main = async () => {
  try {
    const res = await client.publishBatch(msgs, timestamp);
    console.log(JSON.stringify(res.data, null, 2));
  } catch (error) {
    console.error(error);
  }
};

main();
```

### API

#### client.publish(header, payload)

Sends a message to the W3bstream service. Returns a promise that resolves with the server's response.

- `header`: An object that includes `device_id`, `event_type` and `timestamp`.
- `payload`: The message to send. Can be an object or binary data.

#### client.publishBatch(msgs, timestamp)

Sends multiple messages to the W3bstream service. Returns a promise that resolves with the server's response.

- `msgs`: An array of objects that includes `device_id`, `event_type`, `payload` and `timestamp`.
- `timestamp`: The timestamp of the messages. Should be string.
