import { jsonStreamify } from './json-streamify';
import { streamToString } from './stream-to-string';

describe('jsonStreamify', () => {
  it('should handle simple objects', async () => {
    const input = { name: 'test', age: 30 };
    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    expect(result).toBe(JSON.stringify(input));
  });

  it('should handle arrays', async () => {
    const input = [1, 2, 3, 'test'];
    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    expect(result).toBe(JSON.stringify(input));
  });

  it('should handle null and undefined', async () => {
    const input = { a: null, b: undefined };
    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    expect(result).toBe(JSON.stringify(input));
  });

  it('should handle nested objects', async () => {
    const input = {
      user: {
        name: 'John',
        address: {
          street: '123 Main St',
          city: 'Anytown',
        },
      },
    };
    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    expect(result).toBe(JSON.stringify(input));
  });

  it('should convert ReadableStream to Base64', async () => {
    const testData = new TextEncoder().encode('Hello, World!');
    const inputStream = new ReadableStream({
      start(controller) {
        controller.enqueue(testData);
        controller.close();
      },
    });
    const input = {
      message: 'test',
      file: inputStream,
    };

    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    const parsed = JSON.parse(result);

    expect(parsed.message).toBe('test');
    expect(parsed.file).toBe(Buffer.from(testData).toString('base64'));
  });

  it('should handle multiple ReadableStreams', async () => {
    const data1 = new TextEncoder().encode('File 1 content');
    const data2 = new TextEncoder().encode('File 2 content');
    const stream1 = new ReadableStream({
      start(controller) {
        controller.enqueue(data1);
        controller.close();
      },
    });
    const stream2 = new ReadableStream({
      start(controller) {
        controller.enqueue(data2);
        controller.close();
      },
    });

    const input = {
      files: [stream1, stream2],
      metadata: { count: 2 },
    };

    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    const parsed = JSON.parse(result);

    expect(parsed.files).toHaveLength(2);
    expect(parsed.files[0]).toBe(Buffer.from(data1).toString('base64'));
    expect(parsed.files[1]).toBe(Buffer.from(data2).toString('base64'));
    expect(parsed.metadata.count).toBe(2);
  });

  it('should handle replacer function', async () => {
    const input = { name: 'test', password: 'secret', age: 30 };
    const replacer = (key: string, value: unknown): unknown => {
      if (key === 'password') return '[REDACTED]';
      return value;
    };

    const stream = jsonStreamify(input, replacer);
    const result = await streamToString(stream);
    const parsed = JSON.parse(result);

    expect(parsed.name).toBe('test');
    expect(parsed.password).toBe('[REDACTED]');
    expect(parsed.age).toBe(30);
  });

  it('should handle space parameter for formatting', async () => {
    const input = { name: 'test', age: 30 };
    const stream = jsonStreamify(input, null, 2);
    const result = await streamToString(stream);

    expect(result).toBe(JSON.stringify(input, null, 2));
    expect(result).toContain('\n');
    expect(result).toContain('  ');
  });

  it('should detect circular references', async () => {
    const input: Record<string, unknown> = { name: 'test' };
    input.self = input;

    const stream = jsonStreamify(input);

    await expect(streamToString(stream)).rejects.toThrow('Converting circular structure to JSON');
  });

  it('should handle empty streams', async () => {
    const emptyStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const input = {
      file: emptyStream,
      message: 'test',
    };

    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    const parsed = JSON.parse(result);

    expect(parsed.file).toBe('');
    expect(parsed.message).toBe('test');
  });

  it('should handle stream errors', async () => {
    const errorStream = new ReadableStream({
      start(controller) {
        controller.error(new Error('Stream error'));
      },
    });

    const input = { file: errorStream };
    const stream = jsonStreamify(input);

    await expect(streamToString(stream)).rejects.toThrow('Stream error');
  });

  it('should return a ReadableStream', () => {
    const input = { test: 'value' };
    const stream = jsonStreamify(input);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should stream JSON output progressively without buffering base64 content', async () => {
    // Create a stream with multiple chunks to verify progressive emission
    const chunkSize = 1024; // 1KB chunks
    const numberOfChunks = 10;
    let chunksEmitted = 0;

    const testDataStream = new ReadableStream({
      start(controller) {
        const emitChunk = () => {
          if (chunksEmitted < numberOfChunks) {
            // Create a chunk filled with predictable data
            const chunk = new Uint8Array(chunkSize).fill(65 + (chunksEmitted % 26));
            controller.enqueue(chunk);
            chunksEmitted++;
            // Emit next chunk asynchronously
            setTimeout(emitChunk, 0);
          } else {
            controller.close();
          }
        };
        emitChunk();
      },
    });

    const input = {
      start: 'beginning',
      data: testDataStream,
      end: 'conclusion',
    };

    const jsonStream = jsonStreamify(input);
    const reader = jsonStream.getReader();

    const receivedChunks: string[] = [];
    let hasSeenStart = false;
    let hasSeenDataField = false;
    let hasSeenBase64Chunks = false;
    let hasSeenEnd = false;
    let base64ChunkCount = 0;

    try {
      let result = await reader.read();
      while (!result.done) {
        const chunk = result.value;
        receivedChunks.push(chunk);

        // Track what we've seen
        if (chunk.includes('"start"')) {
          hasSeenStart = true;
        }
        if (chunk.includes('"data"')) {
          hasSeenDataField = true;
        }
        if (chunk.includes('"end"')) {
          hasSeenEnd = true;
        }

        // Count chunks that are purely base64 content (no JSON structure)
        if (
          hasSeenDataField &&
          !hasSeenEnd &&
          chunk.length > 50 &&
          /^[A-Za-z0-9+/=]+$/.test(chunk.trim())
        ) {
          hasSeenBase64Chunks = true;
          base64ChunkCount++;
        }

        result = await reader.read();
      }
    } finally {
      reader.releaseLock();
    }

    // Verify progressive streaming occurred
    expect(hasSeenStart).toBe(true);
    expect(hasSeenDataField).toBe(true);
    expect(hasSeenBase64Chunks).toBe(true);
    expect(hasSeenEnd).toBe(true);

    // Verify we got multiple chunks (proves streaming, not buffering)
    expect(receivedChunks.length).toBeGreaterThan(5);
    expect(base64ChunkCount).toBeGreaterThan(0);

    // Verify the final JSON is valid and complete
    const completeJson = receivedChunks.join('');
    const parsed = JSON.parse(completeJson);
    expect(parsed.start).toBe('beginning');
    expect(typeof parsed.data).toBe('string');
    expect(parsed.end).toBe('conclusion');

    // Verify the base64 data is correct
    const decodedBuffer = Buffer.from(parsed.data as string, 'base64');
    expect(decodedBuffer.length).toBe(chunkSize * numberOfChunks);

    // Verify the decoded content matches our pattern
    for (let i = 0; i < numberOfChunks; i++) {
      const expectedByte = 65 + (i % 26);
      const chunkStart = i * chunkSize;
      const chunkEnd = chunkStart + chunkSize;
      for (let j = chunkStart; j < chunkEnd; j++) {
        expect(decodedBuffer[j]).toBe(expectedByte);
      }
    }
  });
});
