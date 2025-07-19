# json-streamify

A streaming JSON serializer that automatically converts embedded file streams to Base64.

## Why json-streamify?

When building APIs that need to send JSON with binary file data, you typically face two problems:

1. **Memory usage**: Loading entire files into memory for JSON encoding
2. **Encoding complexity**: Manually converting files to Base64 before JSON serialization

`json-streamify` solves both by:

- Accepting `Readable` streams directly in your JSON structure
- Automatically converting them to Base64 during serialization
- Returning a `Readable` stream for memory-efficient HTTP requests

## Key Features

- **Drop-in replacement** for `JSON.stringify()` with stream support
- **Automatic Base64 encoding** of any `Readable` streams in your data
- **Memory efficient** - streams files instead of loading into memory
- **TypeScript support** with full type definitions
- **Dual module support** - works with both CommonJS and ES modules

## Installation

```sh
npm install @ccm/json-streamify
```

## API

### `jsonStreamify(value, replacer?, space?)`

Works exactly like `JSON.stringify()` but returns a `Readable` stream and automatically converts embedded `Readable` streams to Base64.

**Parameters:**

- `value` - The value to serialize (can contain `Readable` streams)
- `replacer` - Optional function to transform values (same as JSON.stringify)
- `space` - Optional formatting parameter (same as JSON.stringify)

**Returns:** `Readable<string>` - A stream that outputs the JSON string

### `streamToString(stream)`

Utility function to convert a `Readable` stream to a string.

**Parameters:**

- `stream` - The `Readable` stream to convert

**Returns:** `Promise<string>` - Promise that resolves to the complete string content

### `createStreamFromFile(filePath)`

Utility function to create a `Readable` stream from a file.

**Parameters:**

- `filePath` - The path to the file to read

**Returns:** `Readable` - A stream containing the file content

## Compatibility

- **Node.js**: 18.0.0 or higher
- **TypeScript**: Full type definitions included
- **Modules**: Supports both CommonJS (`require`) and ES modules (`import`)

## Quick Start

```typescript
import { Readable } from 'stream';
import { jsonStreamify } from '@ccm/json-streamify';

// Your data with embedded file streams
const payload = {
  message: 'Upload request',
  file: Readable.from([Buffer.from('Hello, World!')]),
  metadata: { filename: 'hello.txt' },
};

// Convert to JSON stream (file automatically becomes Base64)
const jsonStream = jsonStreamify(payload);

// Use directly with fetch - no manual Base64 conversion needed!
const response = await fetch('/api/upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: jsonStream,
});
```

### What the server receives

```json
{
  "message": "Upload request",
  "file": "SGVsbG8sIFdvcmxkIQ==",
  "metadata": { "filename": "hello.txt" }
}
```

The `Readable` stream was automatically converted to Base64!

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
