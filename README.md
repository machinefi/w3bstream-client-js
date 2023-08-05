# w3bstream-client-js

[![npm](https://img.shields.io/npm/v/w3bstream-client-js)](https://www.npmjs.com/package/w3bstream-client-js)

The JS/TS Client for W3bstream integration on server. This library allows you to send messages to W3bstream using its API.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting started](#getting-started)
- [Example Code](#example-code)
  - [Initialize client](#initialize-client)
  - [Publish single message](#publish-single-message)
  - [Preprocess your data before publishing](#preprocess-your-data-before-publishing)
  - [Sending multiple messages](#sending-multiple-messages)
    - [Waiting for response](#waiting-for-response)
    - [Using then/catch](#using-thencatch)
  - [API](#api)
    - [client.publishDirect](#clientpublishdirectmsgs-timestamp-promiseaxiosresponseany)
    - [client.enqueueAndPublish](#clientenqueueandpublishheader-payload-boolean)
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
```

### Publish single message

```typescript
// header should include device ID
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

### Preprocess your data before publishing

```ts
const events = rawData.map(({ id, temp }) => {
  // each message should include header with device ID
  const header = {
    device_id: id,
  };
  // and payload with the data itself
  const payload = {
    temperature: temp,
  };

  return { header, payload };
});
```

### Sending multiple messages

#### Using `await`

```typescript
const main = async () => {
  for (let i = 0; i < events.length; i++) {
    const { header, payload } = events[i];

    const res = await client.publishDirect(header, payload);
    console.log(res.data);
  }
};

main();
```

#### Using `then/catch`

```typescript
const main = async () => {
  for (let i = 0; i < events.length; i++) {
    const { header, payload } = events[i];

    client
      .publishDirect(header, payload)
      .then((res) => {
        console.log(res.data);
      })
      .catch((err) => {
        console.error(err);
      });
  }
};

main();
```

### API

#### W3bstreamClient(url, apiKey, options)

Initializes the client.

- `url`: The URL of the W3bstream service.
- `apiKey`: The API key of the W3bstream service.
- `options`: An object that includes the following optional parameters:
  - `enableBatching`: Enables batching. Default: `false`.
  - `batchSize`: The number of events to publish in a single batch. Default: `10`.
  - `publishIntervalMs`: The interval between batches in milliseconds. Default: `1000`.
  - `maxQueueSize`: The maximum number of events to queue. Default: `0` (no limit).

#### client.publishDirect(msgs, timestamp): Promise\<AxiosResponse\<any>>

Sends a message to the W3bstream service. Returns a promise that resolves with the server's response.

- `header`: An object that includes the following parameters:
  - `device_id`: The ID of the device that sent the message.
  - `event_type`: The type of the event. _(Optional)_
  - `timestamp`: The timestamp of the event. _(Optional)_
- `payload`: The message to send. Can be an object or binary data.

#### client.enqueueAndPublish(header, payload): boolean

The event is added to a queue and published in batches. The batch size and publish interval can be configured while initializing the client.

Returns:
`true` if the event was successfully added to the queue, `false` otherwise.

- `header`: An object that includes the following parameters:
  - `device_id`: The ID of the device that sent the message.
  - `event_type`: The type of the event. _(Optional)_
  - `timestamp`: The timestamp of the event. _(Optional)_
- `payload`: The message to send. Can be an object or binary data.

#### client.stop()

Stops the client. This method is only relevant when the client is initialized with `enableBatching: true`.
