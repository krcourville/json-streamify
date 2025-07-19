import { streamToString } from './stream-to-string';

describe('streamToString', () => {
  it('should convert a simple stream to string', async () => {
    const testData = 'Hello, World!';
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(testData);
        controller.close();
      },
    });

    const result = await streamToString(stream);
    expect(result).toBe(testData);
  });

  it('should handle multiple chunks', async () => {
    const chunks = ['Hello, ', 'World', '!'];
    const stream = new ReadableStream({
      start(controller) {
        chunks.forEach(chunk => controller.enqueue(chunk));
        controller.close();
      },
    });

    const result = await streamToString(stream);
    expect(result).toBe('Hello, World!');
  });

  it('should handle empty streams', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });

    const result = await streamToString(stream);
    expect(result).toBe('');
  });

  it('should handle binary data as strings', async () => {
    const binaryData = new TextEncoder().encode('binary data');
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(binaryData);
        controller.close();
      },
    });

    const result = await streamToString(stream);
    expect(result).toBe('binary data');
  });

  it('should reject on stream errors', async () => {
    const stream = new ReadableStream({
      start(controller) {
        controller.error(new Error('Stream error'));
      },
    });

    await expect(streamToString(stream)).rejects.toThrow('Stream error');
  });

  it('should handle large streams', async () => {
    const largeContent = 'x'.repeat(10000);
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(largeContent);
        controller.close();
      },
    });

    const result = await streamToString(stream);
    expect(result).toBe(largeContent);
    expect(result.length).toBe(10000);
  });
});
