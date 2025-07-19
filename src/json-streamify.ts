type Replacer = (this: unknown, key: string, value: unknown) => unknown;

/**
 * Converts a value to a JSON string stream, automatically encoding any embedded ReadableStream streams as Base64
 * @param value - The value to convert to JSON
 * @param replacer - Optional function that transforms the results (similar to JSON.stringify)
 * @param space - Optional string or number for pretty-printing (similar to JSON.stringify)
 * @returns A ReadableStream containing the JSON string
 */
export function jsonStreamify(
  value: unknown,
  replacer?: Replacer | null,
  space?: string | number
): ReadableStream<string> {
  return new ReadableStream({
    async start(controller) {
      try {
        const seenObjects = new WeakSet<object>();
        const indent = typeof space === 'number' ? ' '.repeat(space) : space || '';
        await streamJsonValue(value, controller, seenObjects, replacer, indent, 0);
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

async function streamJsonValue(
  value: unknown,
  controller: ReadableStreamDefaultController<string>,
  seenObjects: WeakSet<object>,
  replacer?: Replacer | null,
  indent?: string,
  depth?: number
): Promise<void> {
  // Handle null and undefined
  if (value === null) {
    controller.enqueue('null');
    return;
  }
  if (value === undefined) {
    return; // undefined is omitted in JSON
  }

  // Handle ReadableStream - stream the Base64 encoding
  if (value instanceof ReadableStream) {
    controller.enqueue('"');
    await streamBase64ToController(value, controller);
    controller.enqueue('"');
    return;
  }

  // Handle primitives
  if (typeof value === 'string') {
    controller.enqueue(JSON.stringify(value));
    return;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    controller.enqueue(String(value));
    return;
  }

  // Handle objects and arrays
  if (typeof value === 'object' && value !== null) {
    if (seenObjects.has(value)) {
      throw new TypeError('Converting circular structure to JSON');
    }
    seenObjects.add(value);

    try {
      if (Array.isArray(value)) {
        await streamArray(value, controller, seenObjects, replacer, indent, depth);
      } else {
        await streamObject(
          value as Record<string, unknown>,
          controller,
          seenObjects,
          replacer,
          indent,
          depth
        );
      }
    } finally {
      seenObjects.delete(value);
    }
    return;
  }

  // Fallback for other types
  controller.enqueue(JSON.stringify(value));
}

async function streamArray(
  arr: unknown[],
  controller: ReadableStreamDefaultController<string>,
  seenObjects: WeakSet<object>,
  replacer?: Replacer | null,
  indent?: string,
  depth?: number
): Promise<void> {
  const currentIndent = indent ? `\n${indent.repeat(depth || 0)}` : '';
  const nextIndent = indent ? `\n${indent.repeat((depth || 0) + 1)}` : '';

  controller.enqueue('[');

  for (let i = 0; i < arr.length; i++) {
    if (i > 0) {
      controller.enqueue(',');
    }
    if (indent) {
      controller.enqueue(nextIndent);
    }

    let itemValue = arr[i];
    if (replacer) {
      itemValue = replacer.call(arr, String(i), itemValue);
    }

    await streamJsonValue(itemValue, controller, seenObjects, replacer, indent, (depth || 0) + 1);
  }

  if (indent && arr.length > 0) {
    controller.enqueue(currentIndent);
  }
  controller.enqueue(']');
}

async function streamObject(
  obj: Record<string, unknown>,
  controller: ReadableStreamDefaultController<string>,
  seenObjects: WeakSet<object>,
  replacer?: Replacer | null,
  indent?: string,
  depth?: number
): Promise<void> {
  const currentIndent = indent ? `\n${indent.repeat(depth || 0)}` : '';
  const nextIndent = indent ? `\n${indent.repeat((depth || 0) + 1)}` : '';

  controller.enqueue('{');

  const entries = Object.entries(obj);
  let isFirst = true;

  for (const [key, val] of entries) {
    let processedValue = val;
    if (replacer) {
      processedValue = replacer.call(obj, key, val);
    }

    // Skip undefined values (they're omitted in JSON)
    if (processedValue === undefined) {
      continue;
    }

    if (!isFirst) {
      controller.enqueue(',');
    }
    isFirst = false;

    if (indent) {
      controller.enqueue(nextIndent);
    }

    // Emit the key
    controller.enqueue(JSON.stringify(key));
    controller.enqueue(':');
    if (indent) {
      controller.enqueue(' ');
    }

    // Emit the value
    await streamJsonValue(
      processedValue,
      controller,
      seenObjects,
      replacer,
      indent,
      (depth || 0) + 1
    );
  }

  if (indent && !isFirst) {
    controller.enqueue(currentIndent);
  }
  controller.enqueue('}');
}

async function streamBase64ToController(
  stream: ReadableStream<unknown>,
  controller: ReadableStreamDefaultController<string>
): Promise<void> {
  const reader = stream.getReader();
  let remainder = new Uint8Array(0);

  try {
    let result = await reader.read();
    while (!result.done) {
      const value = result.value;
      if (value === undefined) {
        result = await reader.read();
        continue;
      }

      // Convert input to Uint8Array
      let bytes: Uint8Array;
      if (typeof value === 'string') {
        bytes = new TextEncoder().encode(value);
      } else if (value instanceof Uint8Array) {
        bytes = value;
      } else {
        bytes = new TextEncoder().encode(String(value));
      }

      // Combine with remainder from previous chunk
      const combined = new Uint8Array(remainder.length + bytes.length);
      combined.set(remainder);
      combined.set(bytes, remainder.length);

      // Process in 3-byte chunks (which encode to 4 base64 chars)
      const processLength = Math.floor(combined.length / 3) * 3;
      if (processLength > 0) {
        const toProcess = combined.slice(0, processLength);
        const encoded = encodeBase64Chunk(toProcess, false);
        if (encoded) {
          controller.enqueue(encoded);
        }
      }

      // Save remainder for next iteration
      remainder = combined.slice(processLength);

      result = await reader.read();
    }

    // Handle final remainder with padding
    if (remainder.length > 0) {
      const finalChunk = encodeBase64Chunk(remainder, true);
      if (finalChunk) {
        controller.enqueue(finalChunk);
      }
    }
  } finally {
    reader.releaseLock();
  }
}

function encodeBase64Chunk(bytes: Uint8Array, final: boolean): string {
  if (bytes.length === 0) return '';

  // Convert bytes to binary string
  const binary = Array.from(bytes, byte => String.fromCharCode(byte)).join('');

  // Use btoa for the actual base64 encoding
  let result = btoa(binary);

  // If this is not the final chunk and we have padding, remove it
  // The padding will be added correctly when the final chunk is processed
  if (!final && result.endsWith('=')) {
    result = result.replace(/=+$/, '');
  }

  return result;
}
