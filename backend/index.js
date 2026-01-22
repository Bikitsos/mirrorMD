const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { marked } = require('marked');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const TEMP_DIR = path.join(__dirname, '../temp');

// Ensure temp directory exists
async function ensureTempDir() {
  try {
    await fs.mkdir(TEMP_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create temp directory:', err);
  }
}
ensureTempDir();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MirrorMD Backend is running!' });
});

// Hello World endpoint
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from MirrorMD!' });
});

// Convert Markdown to HTML
app.post('/api/convert', (req, res) => {
  try {
    const { markdown } = req.body;
    
    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Invalid markdown content' });
    }

    // Configure marked options
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true
    });

    const html = marked(markdown);
    
    console.log(`[API] Converted ${markdown.length} chars of markdown to HTML`);
    
    res.json({ 
      success: true, 
      html,
      stats: {
        markdownLength: markdown.length,
        htmlLength: html.length
      }
    });
  } catch (err) {
    console.error('[API] Convert error:', err);
    res.status(500).json({ error: 'Failed to convert markdown' });
  }
});

// Save markdown file to temp storage
app.post('/api/save', async (req, res) => {
  try {
    const { markdown, filename } = req.body;
    
    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Invalid markdown content' });
    }

    // Generate safe filename
    const safeFilename = filename 
      ? filename.replace(/[^a-zA-Z0-9._-]/g, '_')
      : `document_${uuidv4().slice(0, 8)}.md`;
    
    const filePath = path.join(TEMP_DIR, safeFilename);
    
    await fs.writeFile(filePath, markdown, 'utf8');
    
    console.log(`[API] Saved file: ${safeFilename} (${markdown.length} chars)`);
    
    res.json({ 
      success: true, 
      filename: safeFilename,
      path: filePath,
      size: markdown.length
    });
  } catch (err) {
    console.error('[API] Save error:', err);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

// List saved files
app.get('/api/files', async (req, res) => {
  try {
    const files = await fs.readdir(TEMP_DIR);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const fileStats = await Promise.all(
      mdFiles.map(async (filename) => {
        const filePath = path.join(TEMP_DIR, filename);
        const stat = await fs.stat(filePath);
        return {
          filename,
          size: stat.size,
          modified: stat.mtime
        };
      })
    );
    
    res.json({ success: true, files: fileStats });
  } catch (err) {
    console.error('[API] List files error:', err);
    res.json({ success: true, files: [] });
  }
});

// Load a saved file
app.get('/api/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(TEMP_DIR, safeFilename);
    
    const content = await fs.readFile(filePath, 'utf8');
    
    res.json({ 
      success: true, 
      filename: safeFilename,
      content,
      size: content.length
    });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    console.error('[API] Load file error:', err);
    res.status(500).json({ error: 'Failed to load file' });
  }
});

// Delete a saved file
app.delete('/api/files/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = path.join(TEMP_DIR, safeFilename);
    
    await fs.unlink(filePath);
    
    console.log(`[API] Deleted file: ${safeFilename}`);
    
    res.json({ success: true, filename: safeFilename });
  } catch (err) {
    if (err.code === 'ENOENT') {
      return res.status(404).json({ error: 'File not found' });
    }
    console.error('[API] Delete file error:', err);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Serve frontend for all other routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MirrorMD server running on http://localhost:${PORT}`);
});
