import { createReadStream } from 'fs';

/**
 * Utility function to create a ReadableStream from a file
 * @param filePath - The path to the file to read
 * @returns ReadableStream containing the file content as Uint8Array chunks
 */
export function createStreamFromFile(filePath: string): ReadableStream<Uint8Array> {
  // Create Node.js readable stream from file
  const nodeStream = createReadStream(filePath);

  // Convert Node.js stream to web ReadableStream
  return new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of nodeStream) {
          // Convert Buffer to Uint8Array
          controller.enqueue(new Uint8Array(chunk));
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}
