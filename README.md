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
    - [Enqueue and publish multiple messages](#enqueue-and-publish-multiple-messages)
    - [API](#api)
      - [client.enqueueAndPublish](#clientenqueueandpublishheader-payload-boolean)
      - [client.publishDirect](#clientpublishdirectmsgs-timestamp-promiseaxiosresponseany)
      - [client.stop](#clientstop)

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

// or with batching enabled
const client = new W3bstreamClient(URL, API_KEY, {
  enableBatching: true,
});
```

### Publish single message

```typescript
const header = {
  device_id: "device_001",
};

// payload can be an object
const payload = {
  temperature: 25,
};

// or binary data
const payload = Buffer.from('{"temperature": 25}', "utf8");

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

### Enqueue and publish multiple messages

```typescript
// The client is initialized with batching enabled
const events = generateEvents(20);

events.forEach((event) => {
  client.enqueueAndPublish(event.header, event.payload);
});

// Mock event generation
function generateEvents(eventsNum) {
  const events = [];

  for (let i = 0; i < eventsNum; i++) {
    const header = {
      device_id: "device_id_" + i,
    };

    const payload = {
      temperature: 25 + i,
    };
    events.push({ header, payload });
  }
  return events;
}
```

### API

#### client.enqueueAndPublish(header, payload): boolean

The event is added to a queue and published in batches. The batch size and publish interval can be configured while initializing the client.

Returns:
`true` if the event was successfully added to the queue, `false` otherwise.

- `header`: An object that includes `device_id`, `event_type` and `timestamp`.
- `payload`: The message to send. Can be an object or binary data.

#### client.publishDirect(msgs, timestamp): Promise\<AxiosResponse\<any>>

Sends a message to the W3bstream service. Returns a promise that resolves with the server's response.

- `header`: An object that includes `device_id`, `event_type` and `timestamp`.
- `payload`: The message to send. Can be an object or binary data.

#### client.stop()

Stops the client. This method is only relevant when the client is initialized with batching enabled.
