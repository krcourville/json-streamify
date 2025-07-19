import { Readable } from 'stream';
import { readFileSync, writeFileSync } from 'fs';
import { jsonStreamify } from '../src/index';

const API_URL = 'http://localhost:3000/upload';

function createSampleFiles() {
  console.log('📝 Creating sample files for demonstration...');

  const textContent =
    'Hello from json-streamify!\nThis is a sample text file that will be encoded as Base64.';
  writeFileSync('sample.txt', textContent);

  const jsonContent = JSON.stringify(
    {
      message: 'This is a JSON file',
      data: [1, 2, 3, 4, 5],
      nested: { key: 'value' },
    },
    null,
    2
  );
  writeFileSync('sample.json', jsonContent);

  console.log('✅ Sample files created: sample.txt, sample.json\n');
}

function createStreamFromFile(filePath: string): Readable {
  const content = readFileSync(filePath);
  return Readable.from([content]);
}

async function streamToString(stream: Readable): Promise<string> {
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

async function demonstrateJsonStreamify() {
  console.log('🚀 Demonstrating json-streamify with file uploads\n');

  createSampleFiles();

  const payload = {
    metadata: {
      filename: 'demo-upload',
      description: 'Demonstration of json-streamify with Base64 file encoding',
      timestamp: new Date().toISOString(),
    },
    files: {
      'sample.txt': createStreamFromFile('sample.txt'),
      'sample.json': createStreamFromFile('sample.json'),
      'generated-data.txt': Readable.from([
        Buffer.from('This content was generated in-memory and streamed directly!'),
      ]),
    },
    additionalData: {
      version: '1.0.0',
      source: 'json-streamify demo',
      totalFiles: 3,
    },
  };

  console.log('📦 Creating JSON stream with embedded file streams...');
  const jsonStream = jsonStreamify(payload, null, 2);

  console.log('📤 Converting stream to string for HTTP transmission...');
  const jsonString = await streamToString(jsonStream);

  console.log('📊 Stream statistics:');
  console.log(`   JSON size: ${jsonString.length} characters`);
  console.log(`   Contains ${Object.keys(payload.files).length} embedded file streams`);

  console.log('\n🌐 Sending request to local API...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonString,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as {
      success: boolean;
      stats: {
        filesReceived: number;
        totalBase64Length: number;
        totalDecodedBytes: number;
      };
      metadata: {
        description: string;
      };
    };

    console.log('✅ Upload successful!');
    console.log('📋 Server response:');
    console.log(JSON.stringify(result, null, 2));

    console.log('\n🎯 Key verification points:');
    console.log(`   ✓ Files received: ${result.stats.filesReceived}`);
    console.log(`   ✓ Total Base64 length: ${result.stats.totalBase64Length}`);
    console.log(`   ✓ Total decoded bytes: ${result.stats.totalDecodedBytes}`);
    console.log(`   ✓ Metadata preserved: ${result.metadata.description}`);
  } catch (error) {
    console.error('❌ Request failed:', error);
    process.exit(1);
  }
}

async function main() {
  try {
    console.log('🔍 Testing server health...');
    const healthResponse = await fetch('http://localhost:3000/health');

    if (!healthResponse.ok) {
      throw new Error('Server not available');
    }

    console.log('✅ Server is running\n');

    await demonstrateJsonStreamify();

    console.log('\n🎉 Demo completed successfully!');
    console.log('   - json-streamify converted Readable streams to Base64');
    console.log('   - Server received and decoded the files correctly');
    console.log('   - All metadata was preserved in the JSON structure');
  } catch (error) {
    console.error('❌ Demo failed:', error);
    console.log('\n💡 Make sure the server is running: npm run demo:server');
    process.exit(1);
  }
}

void main();
