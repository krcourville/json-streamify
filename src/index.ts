import { Readable } from 'stream';

type Replacer = (this: unknown, key: string, value: unknown) => unknown;

export function jsonStreamify(
  value: unknown,
  replacer?: Replacer | null,
  space?: string | number
): Readable {
  let started = false;

  return new Readable({
    objectMode: false,
    encoding: 'utf8',
    async read() {
      if (started) return;
      started = true;

      try {
        const result = await transformValue(value, replacer, space);
        this.push(result);
        this.push(null);
      } catch (error) {
        this.emit('error', error);
      }
    },
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

async function transformValue(
  value: unknown,
  replacer?: Replacer | null,
  space?: string | number
): Promise<string> {
  const seenObjects = new WeakSet<object>();

  async function transform(val: unknown): Promise<unknown> {
    if (val === null || val === undefined) {
      return val;
    }

    if (val instanceof Readable) {
      return await streamToBase64(val);
    }

    if (typeof val === 'object' && val !== null) {
      if (seenObjects.has(val)) {
        throw new TypeError('Converting circular structure to JSON');
      }
      seenObjects.add(val);

      if (isArray(val)) {
        const result = await Promise.all(val.map(item => transform(item)));
        seenObjects.delete(val);
        return result;
      } else if (isObject(val)) {
        const result: Record<string, unknown> = {};
        const entries = Object.entries(val);
        const transformedEntries = await Promise.all(
          entries.map(async ([objKey, objValue]) => [objKey, await transform(objValue)] as const)
        );

        for (const [objKey, transformedValue] of transformedEntries) {
          result[objKey] = transformedValue;
        }

        seenObjects.delete(val);
        return result;
      }
    }

    return val;
  }

  const transformed = await transform(value);
  const finalValue = replacer
    ? (JSON.parse(JSON.stringify(transformed, replacer)) as unknown)
    : transformed;
  return JSON.stringify(finalValue, null, space);
}

function streamToBase64(stream: Readable): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];

    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });

    stream.on('end', () => {
      const buffer = Buffer.concat(chunks);
      const base64 = buffer.toString('base64');
      resolve(base64);
    });

    stream.on('error', reject);
  });
}

export default jsonStreamify;
