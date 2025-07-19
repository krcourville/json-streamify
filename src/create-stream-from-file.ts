import { Readable } from 'stream';
import { readFileSync } from 'fs';

/**
 * Utility function to create a Readable stream from a file
 * @param filePath - The path to the file to read
 * @returns Readable stream containing the file content
 */
export function createStreamFromFile(filePath: string): Readable {
  const content = readFileSync(filePath);
  return Readable.from([content]);
}
