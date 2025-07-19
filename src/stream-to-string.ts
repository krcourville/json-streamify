/**
 * Utility function to convert a ReadableStream to a string
 * @param stream - The ReadableStream to convert
 * @returns Promise that resolves to the complete string content
 */
export async function streamToString(stream: ReadableStream<unknown>): Promise<string> {
  const reader = stream.getReader();
  const chunks: string[] = [];

  try {
    let result = await reader.read();
    while (!result.done) {
      const value = result.value;
      if (value === undefined) {
        result = await reader.read();
        continue;
      }

      // Convert value to string if it's not already
      if (typeof value === 'string') {
        chunks.push(value);
      } else if (value instanceof Uint8Array) {
        chunks.push(new TextDecoder().decode(value));
      } else {
        chunks.push(String(value));
      }

      result = await reader.read();
    }
  } finally {
    reader.releaseLock();
  }

  return chunks.join('');
}
