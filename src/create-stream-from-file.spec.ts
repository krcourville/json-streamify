import { Readable } from 'stream';
import { unlinkSync, writeFileSync } from 'fs';
import { createStreamFromFile } from './create-stream-from-file';
import { streamToString } from './stream-to-string';

describe('createStreamFromFile', () => {
  const testFileName = 'test-file.txt';
  const testContent = 'Hello from test file!\nThis is a test.';

  beforeEach(() => {
    writeFileSync(testFileName, testContent);
  });

  afterEach(() => {
    try {
      unlinkSync(testFileName);
    } catch {
      // Ignore cleanup errors
    }
  });

  it('should create a stream from a text file', async () => {
    const stream = createStreamFromFile(testFileName);
    expect(stream).toBeInstanceOf(Readable);

    const result = await streamToString(stream);
    expect(result).toBe(testContent);
  });

  it('should handle binary files', async () => {
    const binaryContent = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]); // "Hello" in bytes
    const binaryFileName = 'test-binary.bin';
    writeFileSync(binaryFileName, binaryContent);

    try {
      const stream = createStreamFromFile(binaryFileName);
      expect(stream).toBeInstanceOf(Readable);

      const result = await streamToString(stream);
      expect(result).toBe('Hello');
    } finally {
      try {
        unlinkSync(binaryFileName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should throw error for non-existent file', () => {
    expect(() => {
      createStreamFromFile('non-existent-file.txt');
    }).toThrow();
  });

  it('should handle empty files', async () => {
    const emptyFileName = 'empty-file.txt';
    writeFileSync(emptyFileName, '');

    try {
      const stream = createStreamFromFile(emptyFileName);
      const result = await streamToString(stream);
      expect(result).toBe('');
    } finally {
      try {
        unlinkSync(emptyFileName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });

  it('should handle large files', async () => {
    const largeContent = 'Large file content\n'.repeat(1000);
    const largeFileName = 'large-file.txt';
    writeFileSync(largeFileName, largeContent);

    try {
      const stream = createStreamFromFile(largeFileName);
      const result = await streamToString(stream);
      expect(result).toBe(largeContent);
      expect(result.length).toBe(largeContent.length);
    } finally {
      try {
        unlinkSync(largeFileName);
      } catch {
        // Ignore cleanup errors
      }
    }
  });
});
