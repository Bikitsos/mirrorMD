const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const { marked } = require('marked');
const { v4: uuidv4 } = require('uuid');
const { markdownToPdf, closeBrowser, THEMES } = require('./pdfConverter');

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

// Get available PDF themes
app.get('/api/pdf-themes', (req, res) => {
  res.json({
    success: true,
    themes: Object.keys(THEMES).map(key => ({
      id: key,
      name: key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      description: key === 'printer' 
        ? 'Black & white, ink-friendly' 
        : key === 'solarized-light'
          ? 'Light cream background'
          : 'Dark blue background'
    })),
    default: 'solarized-light'
  });
});

// Generate PDF from markdown
app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { markdown, filename, theme = 'solarized-light', title } = req.body;
    
    if (!markdown || typeof markdown !== 'string') {
      return res.status(400).json({ error: 'Invalid markdown content' });
    }

    // Validate theme
    const validTheme = THEMES[theme] ? theme : 'solarized-light';
    
    console.log(`[API] Generating PDF: ${filename || 'document'} (theme: ${validTheme}, ${markdown.length} chars)`);
    
    const startTime = Date.now();
    
    // Generate PDF buffer
    const pdfBuffer = await markdownToPdf(markdown, {
      theme: validTheme,
      title: title || filename?.replace(/\.(md|markdown|txt)$/i, '') || 'Document',
      showFooter: true
    });
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[API] PDF generated in ${duration}s (${(pdfBuffer.length / 1024).toFixed(2)} KB)`);
    
    // Generate download filename
    const downloadName = filename 
      ? filename.replace(/\.(md|markdown|txt)$/i, '.pdf')
      : 'document.pdf';
    
    // Send PDF as download
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${downloadName}"`,
      'Content-Length': pdfBuffer.length
    });
    
    res.send(pdfBuffer);
  } catch (err) {
    console.error('[API] PDF generation error:', err);
    res.status(500).json({ error: 'Failed to generate PDF', message: err.message });
  }
});

// Serve frontend for all other routes
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 MirrorMD server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('📴 Shutting down gracefully...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('📴 Shutting down gracefully...');
  await closeBrowser();
  process.exit(0);
});
