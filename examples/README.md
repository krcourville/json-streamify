# json-streamify Demo

This directory contains a demonstration of the `json-streamify` library working with a real web API that accepts Base64-encoded file data.

## Files

- `server.ts` - Express.js server that accepts JSON requests with Base64-encoded files
- `client.ts` - Demo client that uses json-streamify to send file data
- `sparkpost-email.ts` - SparkPost email example with Base64 attachments
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

### Option 3: SparkPost Email Demo

Run the SparkPost email example with attachments:

```bash
npm run demo:sparkpost
```

**Configuration**: The SparkPost demo requires API credentials. You can configure them in two ways:

1. **Using .env file (recommended)**:

   ```bash
   # Copy the example configuration
   cp .env.example .env

   # Edit .env with your credentials
   # SPARKPOST_API_KEY=your-sparkpost-api-key
   # TEST_EMAIL=test@your-domain.com
   # FROM_EMAIL=demo@your-sending-domain.com
   # FROM_NAME=json-streamify Demo
   ```

2. **Using environment variables**:

   ```bash
   SPARKPOST_API_KEY=your-api-key npm run demo:sparkpost
   ```

## What the Demos Do

### File Upload Demo (client.ts + server.ts)

1. **Creates sample files** - Generates `sample.txt` and `sample.json` for demonstration
2. **Creates file streams** - Converts files into Node.js Readable streams
3. **Uses json-streamify** - Transforms the payload containing streams into a JSON string with Base64-encoded files
4. **Sends HTTP request** - Posts the JSON to the local Express server
5. **Server processes** - Decodes Base64 data back to original files
6. **Verifies integrity** - Confirms files were transmitted and decoded correctly

### SparkPost Email Demo (sparkpost-email.ts)

1. **Creates sample attachments** - Generates PDF and CSV files for email attachments
2. **Builds email payload** - Creates SparkPost transmission object with file streams
3. **Uses json-streamify** - Automatically converts file streams to Base64 in the JSON payload
4. **Sends to SparkPost API** - Posts the transmission request with inline attachments
5. **Email delivery** - SparkPost processes and delivers the email with Base64-decoded attachments

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
