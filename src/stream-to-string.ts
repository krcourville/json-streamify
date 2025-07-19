import { Readable } from 'stream';

/**
 * Utility function to convert a Readable stream to a string
 * @param stream - The Readable stream to convert
 * @returns Promise that resolves to the complete string content
 */
export function streamToString(stream: Readable): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: string[] = [];

    stream.on('data', (chunk: string) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(chunks.join(''));
    });

    stream.on('error', reject);
  });
}
