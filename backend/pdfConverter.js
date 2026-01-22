// PDF Converter Module using Puppeteer
const puppeteer = require('puppeteer');

// Default PDF options
const DEFAULT_OPTIONS = {
  format: 'A4',
  margin: {
    top: '20mm',
    right: '20mm',
    bottom: '20mm',
    left: '20mm'
  },
  printBackground: true
};

// Solarized CSS for PDF styling
const SOLARIZED_CSS = `
  :root {
    --base03:  #002b36;
    --base02:  #073642;
    --base01:  #586e75;
    --base00:  #657b83;
    --base0:   #839496;
    --base1:   #93a1a1;
    --base2:   #eee8d5;
    --base3:   #fdf6e3;
    --yellow:  #b58900;
    --orange:  #cb4b16;
    --red:     #dc322f;
    --magenta: #d33682;
    --violet:  #6c71c4;
    --blue:    #268bd2;
    --cyan:    #2aa198;
    --green:   #859900;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    font-size: 12pt;
    line-height: 1.6;
    color: var(--base00);
    background: white;
    padding: 0;
  }

  h1, h2, h3, h4, h5, h6 {
    color: var(--base01);
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
    line-height: 1.3;
  }

  h1 { font-size: 2em; border-bottom: 2px solid var(--cyan); padding-bottom: 0.3em; }
  h2 { font-size: 1.5em; border-bottom: 1px solid var(--base1); padding-bottom: 0.2em; }
  h3 { font-size: 1.25em; }
  h4 { font-size: 1.1em; }

  h1:first-child, h2:first-child {
    margin-top: 0;
  }

  p {
    margin-bottom: 1em;
  }

  a {
    color: var(--blue);
    text-decoration: none;
  }

  strong {
    font-weight: 600;
    color: var(--base01);
  }

  em {
    font-style: italic;
  }

  code {
    font-family: 'SF Mono', 'Fira Code', Monaco, Consolas, monospace;
    font-size: 0.9em;
    background-color: var(--base2);
    padding: 0.2em 0.4em;
    border-radius: 3px;
    color: var(--orange);
  }

  pre {
    background-color: var(--base2);
    padding: 1em;
    border-radius: 6px;
    overflow-x: auto;
    margin-bottom: 1em;
    border-left: 4px solid var(--cyan);
  }

  pre code {
    background: transparent;
    padding: 0;
    color: var(--base00);
  }

  blockquote {
    margin: 1em 0;
    padding: 0.5em 1em;
    border-left: 4px solid var(--cyan);
    background-color: var(--base2);
    color: var(--base01);
    font-style: italic;
  }

  ul, ol {
    margin-bottom: 1em;
    padding-left: 2em;
  }

  li {
    margin-bottom: 0.25em;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  th, td {
    padding: 0.5em 0.75em;
    text-align: left;
    border: 1px solid var(--base1);
  }

  th {
    background-color: var(--base2);
    font-weight: 600;
    color: var(--base01);
  }

  tr:nth-child(even) {
    background-color: rgba(238, 232, 213, 0.3);
  }

  hr {
    border: none;
    height: 1px;
    background-color: var(--base1);
    margin: 2em 0;
  }

  img {
    max-width: 100%;
    height: auto;
  }

  /* Print-specific styles */
  @media print {
    body {
      background: white;
    }
    
    pre, code {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  }
`;

// Create browser instance
let browser = null;

async function getBrowser() {
  if (!browser) {
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined
    });
  }
  return browser;
}

// Convert HTML to PDF
async function htmlToPdf(html, options = {}) {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Create full HTML document with styling
    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>${SOLARIZED_CSS}</style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `;

    await page.setContent(fullHtml, { waitUntil: 'networkidle0' });

    const pdfOptions = {
      ...DEFAULT_OPTIONS,
      ...options
    };

    const pdfBuffer = await page.pdf(pdfOptions);
    return pdfBuffer;
  } finally {
    await page.close();
  }
}

// Convert Markdown to PDF
async function markdownToPdf(markdown, options = {}) {
  const { marked } = require('marked');
  
  marked.setOptions({
    breaks: true,
    gfm: true
  });

  const html = marked(markdown);
  return htmlToPdf(html, options);
}

// Cleanup browser on exit
async function closeBrowser() {
  if (browser) {
    await browser.close();
    browser = null;
  }
}

// Handle process termination
process.on('SIGINT', closeBrowser);
process.on('SIGTERM', closeBrowser);

module.exports = {
  htmlToPdf,
  markdownToPdf,
  closeBrowser,
  SOLARIZED_CSS,
  DEFAULT_OPTIONS
};
