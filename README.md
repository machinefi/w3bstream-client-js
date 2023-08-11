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

#### Basic usage

```ts
// events from previous example
client.publishEvents(events).subscribe(async (res) => {
  const response = await res;
  console.log(response.data.length);
});
```

#### With more control

```typescript
client.publishEvents(events).subscribe({
  // will be called for each batch of messages
  next: async (res) => {
    const response = await res;
    console.log(response.data.length);
  },
  error: (err) => {
    console.log(err.message);
  },
  complete: () => {
    console.log("publishing completed");
  },
});
```

### API

#### W3bstreamClient(url, apiKey, options)

Initializes the client.

- `url`: The URL of the W3bstream service.
- `apiKey`: The API key of the W3bstream service.
- `options`: An object that includes the following optional parameters:
  - `batchSize`: The number of events to publish in a single batch. Default: `100`.
  - `publishIntervalMs`: The interval between batche groups in milliseconds. Each batch group consist of 10 batches. Default: `1000`.

#### client.publishSingle(header, payload): Promise\<AxiosResponse\<any>>

Sends a message to the W3bstream service. Returns a promise that resolves with the server's response.

- `header`: An object that includes the following parameters:
  - `device_id`: The ID of the device that sent the message.
  - `event_type`: The type of the event. _(Optional)_
  - `timestamp`: The timestamp of the event. _(Optional)_
- `payload`: The message to send. Can be an object or binary data.

#### client.publishEvents(events): Observable\<Promise\<AxiosResponse\<any>>>

Sends multiple messages to the W3bstream service. Returns an observable that emits a promise for each batch of messages.

- `events`: An array of objects that include the following parameters:
  - `header`: An object that includes the following parameters:
    - `device_id`: The ID of the device that sent the message.
    - `event_type`: The type of the event. _(Optional)_
    - `timestamp`: The timestamp of the event. _(Optional)_
  - `payload`: The message to send. Can be an object or binary data.
