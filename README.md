# json-streamify

A streaming JSON serializer that automatically converts embedded ReadableStreams to Base64.

## Table of Contents

- [Why json-streamify?](#why-json-streamify)
- [Key Features](#key-features)
- [Installation](#installation)
- [API](#api)
- [Compatibility](#compatibility)
- [Quick Start](#quick-start)
- [Demo](#demo)
- [Working with Streams](#working-with-streams)
- [Additional Utilities](#additional-utilities)
- [Common Use Cases](#common-use-cases)
- [Contributing](#contributing)
- [License](#license)

## Why json-streamify?

When building APIs that need to send JSON with binary file data, you typically face two problems:

1. **Memory usage**: Loading entire files into memory for JSON encoding
2. **Encoding complexity**: Manually converting files to Base64 before JSON serialization

`json-streamify` solves both by:

- Accepting `ReadableStream` streams directly in your JSON structure
- Automatically converting them to Base64 during serialization
- Returning a `ReadableStream` for memory-efficient HTTP requests

## Key Features

- **Drop-in replacement** for `JSON.stringify()` with stream support
- **Automatic Base64 encoding** of any `ReadableStream` streams in your data
- **Memory efficient** - streams files instead of loading into memory
- **TypeScript support** with full type definitions
- **Dual module support** - works with both CommonJS and ES modules

## Installation

```sh
npm install @cajuncodemonkey/json-streamify
```

## API

### `jsonStreamify(value, replacer?, space?)`

Works exactly like `JSON.stringify()` but returns a `ReadableStream` and automatically converts embedded `ReadableStream` streams to Base64.

**Parameters:**

- `value` - The value to serialize (can contain `ReadableStream` streams)
- `replacer` - Optional function to transform values (same as JSON.stringify)
- `space` - Optional formatting parameter (same as JSON.stringify)

**Returns:** `ReadableStream<string>` - A stream that outputs the JSON string

#### `streamToString(stream)`

Utility function to convert a `ReadableStream` to a string.

**Parameters:**

- `stream` - The `ReadableStream` to convert

**Returns:** `Promise<string>` - Promise that resolves to the complete string content

#### `createStreamFromFile(filePath)`

Utility function to create a `ReadableStream` from a file.

**Parameters:**

- `filePath` - The path to the file to read

**Returns:** `ReadableStream<Uint8Array>` - A stream containing the file content

## Compatibility

- **Node.js**: 18.0.0 or higher (uses Web Streams API)
- **Browsers**: Modern browsers with ReadableStream support
- **Deno**: Full support for web standard streams
- **TypeScript**: Full type definitions included
- **Modules**: Supports both CommonJS (`require`) and ES modules (`import`)

## Quick Start

```typescript
import { jsonStreamify, streamToString } from '@cajuncodemonkey/json-streamify';

// Your data with embedded file streams
const payload = {
  message: 'Upload request',
  file: new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode('Hello, World!'));
      controller.close();
    },
  }),
  metadata: { filename: 'hello.txt' },
};

// Convert to JSON stream (file automatically becomes Base64)
const jsonStream = jsonStreamify(payload);

// Use directly with fetch - no manual Base64 conversion needed!
const response = await fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: jsonStream,
  duplex: 'half', // Required for streaming bodies
} as RequestInit); // Type assertion needed for TypeScript compatibility

// Or with wretch for cleaner API calls
import wretch from 'wretch';

const result = await wretch('/api/upload')
  .headers({ 'Content-Type': 'application/json' })
  .body(jsonStream)
  .options({ duplex: 'half' })
  .post()
  .json();
```

### What the server receives

```json
{
  "message": "Upload request",
  "file": "SGVsbG8sIFdvcmxkIQ==",
  "metadata": { "filename": "hello.txt" }
}
```

The `ReadableStream` was automatically converted to Base64!

## Demo

Run the included demonstration to see json-streamify working with a real web API:

```bash
npm run demo
```

This starts a local Express server that accepts Base64-encoded files and demonstrates:

- Converting Readable streams to Base64 within JSON
- HTTP transmission of the resulting JSON
- Server-side decoding and file reconstruction
- Metadata preservation throughout the process

See [examples/README.md](examples/README.md) for detailed demo documentation.

## Working with Streams

### Using Web Standard ReadableStreams

`json-streamify` uses the web standard `ReadableStream` API, making it compatible across Node.js, browsers, and Deno:

```typescript
import { jsonStreamify } from '@cajuncodemonkey/json-streamify';

// Create a ReadableStream from data
const dataStream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode('Hello, World!'));
    controller.close();
  },
});

const payload = { attachment: dataStream };
const jsonStream = jsonStreamify(payload);
```

### Converting Node.js Streams to ReadableStream

For Node.js built-in streams, convert them to web ReadableStreams:

```typescript
import { createReadStream } from 'fs';
import { Readable } from 'stream';

// Convert Node.js Readable to web ReadableStream
const nodeStream = createReadStream('./document.pdf');
const webStream = Readable.toWeb(nodeStream);

const payload = { attachment: webStream };
const jsonStream = jsonStreamify(payload);
```

### Creating ReadableStreams from Data

```typescript
// From Uint8Array
const binaryStream = new ReadableStream({
  start(controller) {
    const data = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
    controller.enqueue(data);
    controller.close();
  },
});

// From string chunks
const textStream = new ReadableStream({
  start(controller) {
    const chunks = ['Hello', ' ', 'World', '!'];
    chunks.forEach(chunk =>
      controller.enqueue(new TextEncoder().encode(chunk))
    );
    controller.close();
  },
});
```

## Additional Utilities

The library also exports two utility functions that are useful for stream handling:

### `streamToString(stream)` utility

```typescript
import { streamToString } from '@cajuncodemonkey/json-streamify';

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue('Hello');
    controller.enqueue(' ');
    controller.enqueue('World');
    controller.close();
  },
});
const text = await streamToString(stream);
console.log(text); // "Hello World"
```

### `createStreamFromFile(filePath)` utility

```typescript
import { createStreamFromFile } from '@cajuncodemonkey/json-streamify';

const fileStream = createStreamFromFile('./document.pdf');
// Use the stream in your JSON payload
const payload = { attachment: fileStream };
```

## Common Use Cases

- **File uploads in JSON APIs** - Send files as part of JSON requests
- **GraphQL mutations** - Include binary data in GraphQL variables
- **Webhooks with attachments** - Send files along with metadata
- **Microservice communication** - Pass files between services via JSON
- **API testing** - Mock file uploads in test suites

## Contributing

Interested in contributing? See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup, testing, code quality standards, and publishing guidelines.

## License

This library applies a MIT license. Use it however you want at your own risk. Feel free to copy/paste
the code to your own repo vs using the npm package.
