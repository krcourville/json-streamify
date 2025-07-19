# json-streamify Demo

This directory contains a demonstration of the `json-streamify` library working with a real web API that accepts Base64-encoded file data.

## Files

- `server.ts` - Express.js server that accepts JSON requests with Base64-encoded files
- `client.ts` - Demo client that uses json-streamify to send file data
- `README.md` - This documentation

## Running the Demo

### Option 1: Automated Demo (Recommended)

Run both server and client automatically:

```bash
npm run demo
```

This will:

1. Start the Express server on localhost:3000
2. Wait 2 seconds for server startup
3. Run the client demo
4. Stop the server automatically

### Option 2: Manual Steps

**Terminal 1 - Start the server:**

```bash
npm run demo:server
```

**Terminal 2 - Run the client:**

```bash
npm run demo:client
```

## What the Demo Does

1. **Creates sample files** - Generates `sample.txt` and `sample.json` for demonstration
2. **Creates file streams** - Converts files into Node.js Readable streams
3. **Uses json-streamify** - Transforms the payload containing streams into a JSON string with Base64-encoded files
4. **Sends HTTP request** - Posts the JSON to the local Express server
5. **Server processes** - Decodes Base64 data back to original files
6. **Verifies integrity** - Confirms files were transmitted and decoded correctly

## Expected Output

The demo will show:

- ✅ Stream conversion statistics
- ✅ HTTP transmission details
- ✅ Server-side Base64 decoding
- ✅ File integrity verification
- ✅ Metadata preservation

## Key Verification Points

- **Stream to Base64**: Readable streams are automatically converted to Base64 strings
- **JSON Structure**: Complex objects with nested streams are handled correctly
- **HTTP Compatible**: The resulting JSON string works directly with fetch/HTTP requests
- **Memory Efficient**: Large files are streamed rather than loaded entirely into memory
- **Metadata Preserved**: All non-stream data in the JSON structure is maintained

This demonstrates the library's core value proposition: seamlessly handling binary data in JSON-based API requests with minimal memory overhead.
