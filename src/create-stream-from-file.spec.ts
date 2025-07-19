import { unlink, writeFile } from 'fs/promises';
import { createStreamFromFile } from './create-stream-from-file';
import { streamToString } from './stream-to-string';

describe('createStreamFromFile', () => {
  const testFileName = 'test-file.txt';
  const testContent = 'Hello from test file!\nThis is a test.';

  beforeEach(async () => {
    await writeFile(testFileName, testContent);
  });

  afterEach(async () => {
    try {
      await unlink(testFileName);
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create a stream from a text file', async () => {
    const stream = createStreamFromFile(testFileName);
    expect(stream).toBeInstanceOf(ReadableStream);

    const result = await streamToString(stream);
    expect(result).toBe(testContent);
  });

  it('should handle binary files', async () => {
    const binaryContent = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello" in bytes
    const binaryFileName = 'test-binary.bin';
    await writeFile(binaryFileName, binaryContent);

    try {
      const stream = createStreamFromFile(binaryFileName);
      expect(stream).toBeInstanceOf(ReadableStream);

      const result = await streamToString(stream);
      expect(result).toBe('Hello');
    } finally {
      try {
        await unlink(binaryFileName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should error when reading non-existent file', async () => {
    const stream = createStreamFromFile('non-existent-file.txt');
    await expect(streamToString(stream)).rejects.toThrow();
  });

  it('should handle empty files', async () => {
    const emptyFileName = 'empty-file.txt';
    await writeFile(emptyFileName, '');

    try {
      const stream = createStreamFromFile(emptyFileName);
      const result = await streamToString(stream);
      expect(result).toBe('');
    } finally {
      try {
        await unlink(emptyFileName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should handle large files', async () => {
    const largeContent = 'Large file content\n'.repeat(1000);
    const largeFileName = 'large-file.txt';
    await writeFile(largeFileName, largeContent);

    try {
      const stream = createStreamFromFile(largeFileName);
      const result = await streamToString(stream);
      expect(result).toBe(largeContent);
      expect(result.length).toBe(largeContent.length);
    } finally {
      try {
        await unlink(largeFileName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
});
