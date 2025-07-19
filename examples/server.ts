import express from 'express';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';

const app = express();
const PORT = 3000;
const UPLOAD_DIR = join(__dirname, 'uploads');

app.use(express.json({ limit: '10mb' }));
app.use(express.text({ type: 'application/json', limit: '10mb' }));

interface UploadRequest {
  metadata: {
    filename: string;
    description: string;
    timestamp: string;
  };
  files: {
    [key: string]: string;
  };
}

app.post('/upload', (req, res) => {
  void (async () => {
    console.log('\n📨 Received upload request');
    console.log('Content-Type:', req.headers['content-type']);
    console.log('Content-Length:', req.headers['content-length']);

    try {
      let data: UploadRequest;

      if (typeof req.body === 'string') {
        data = JSON.parse(req.body);
      } else {
        data = req.body;
      }

      console.log('📋 Metadata:', data.metadata);
      console.log('📁 Files received:', Object.keys(data.files).length);

      const savedFiles: string[] = [];

      for (const [fileName, base64Data] of Object.entries(data.files)) {
        console.log(`  📄 Processing file: ${fileName}`);
        console.log(`     Base64 length: ${base64Data.length} characters`);

        const buffer = Buffer.from(base64Data, 'base64');
        console.log(`     Decoded size: ${buffer.length} bytes`);

        const filePath = join(UPLOAD_DIR, fileName);
        await writeFile(filePath, buffer);
        savedFiles.push(filePath);
      }

      res.json({
        success: true,
        message: 'Files uploaded successfully',
        metadata: data.metadata,
        savedFiles: savedFiles.map(f => f.replace(__dirname, '.')),
        stats: {
          filesReceived: Object.keys(data.files).length,
          totalBase64Length: Object.values(data.files).reduce((sum, data) => sum + data.length, 0),
          totalDecodedBytes: Object.values(data.files).reduce(
            (sum, data) => sum + Buffer.from(data, 'base64').length,
            0
          ),
        },
      });

      console.log('✅ Upload completed successfully\n');
    } catch (error) {
      console.error('❌ Error processing upload:', error);
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  })().catch(error => {
    console.error('❌ Unhandled error in upload handler:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

async function startServer() {
  await mkdir(UPLOAD_DIR, { recursive: true });

  app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${UPLOAD_DIR}`);
    console.log('📡 Ready to receive Base64 file uploads\n');
  });
}

startServer().catch(console.error);
