import { Readable } from 'stream';
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

  it('should convert Readable streams to Base64', async () => {
    const testData = Buffer.from('Hello, World!', 'utf8');
    const inputStream = Readable.from([testData]);
    const input = {
      message: 'test',
      file: inputStream,
    };

    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    const parsed = JSON.parse(result);

    expect(parsed.message).toBe('test');
    expect(parsed.file).toBe(testData.toString('base64'));
  });

  it('should handle multiple Readable streams', async () => {
    const data1 = Buffer.from('File 1 content', 'utf8');
    const data2 = Buffer.from('File 2 content', 'utf8');
    const stream1 = Readable.from([data1]);
    const stream2 = Readable.from([data2]);

    const input = {
      files: [stream1, stream2],
      metadata: { count: 2 },
    };

    const stream = jsonStreamify(input);
    const result = await streamToString(stream);
    const parsed = JSON.parse(result);

    expect(parsed.files).toHaveLength(2);
    expect(parsed.files[0]).toBe(data1.toString('base64'));
    expect(parsed.files[1]).toBe(data2.toString('base64'));
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
    const emptyStream = new Readable({
      read() {
        this.push(null);
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
    const errorStream = new Readable({
      read() {
        this.emit('error', new Error('Stream error'));
      },
    });

    const input = { file: errorStream };
    const stream = jsonStreamify(input);

    await expect(streamToString(stream)).rejects.toThrow('Stream error');
  });

  it('should return a Readable stream', () => {
    const input = { test: 'value' };
    const stream = jsonStreamify(input);
    expect(stream).toBeInstanceOf(Readable);
  });
});
