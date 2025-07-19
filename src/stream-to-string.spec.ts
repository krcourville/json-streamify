import { Readable } from 'stream';
import { streamToString } from './stream-to-string';

describe('streamToString', () => {
  it('should convert a simple stream to string', async () => {
    const testData = 'Hello, World!';
    const stream = Readable.from([testData]);

    const result = await streamToString(stream);
    expect(result).toBe(testData);
  });

  it('should handle multiple chunks', async () => {
    const chunks = ['Hello, ', 'World', '!'];
    const stream = Readable.from(chunks);

    const result = await streamToString(stream);
    expect(result).toBe('Hello, World!');
  });

  it('should handle empty streams', async () => {
    const stream = new Readable({
      read() {
        this.push(null);
      },
    });

    const result = await streamToString(stream);
    expect(result).toBe('');
  });

  it('should handle binary data as strings', async () => {
    const binaryData = Buffer.from('binary data', 'utf8');
    const stream = Readable.from([binaryData]);

    const result = await streamToString(stream);
    expect(result).toBe('binary data');
  });

  it('should reject on stream errors', async () => {
    const stream = new Readable({
      read() {
        this.emit('error', new Error('Stream error'));
      },
    });

    await expect(streamToString(stream)).rejects.toThrow('Stream error');
  });

  it('should handle large streams', async () => {
    const largeContent = 'x'.repeat(10000);
    const stream = Readable.from([largeContent]);

    const result = await streamToString(stream);
    expect(result).toBe(largeContent);
    expect(result.length).toBe(10000);
  });
});
