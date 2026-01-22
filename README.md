# MirrorMD

A containerized Markdown to PDF converter web application with a Solarized-themed interface.

---

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [Architecture](#architecture)
5. [Prerequisites](#prerequisites)
6. [Installation](#installation)
7. [Configuration](#configuration)
8. [Usage](#usage)
9. [API Reference](#api-reference)
10. [Development](#development)
11. [Project Structure](#project-structure)
12. [Troubleshooting](#troubleshooting)
13. [License](#license)

---

## Overview

MirrorMD is a web-based application that allows users to write Markdown documents and convert them to professionally styled PDF files. The application features a split-pane editor with real-time preview, multiple PDF themes, and a clean Solarized color scheme with light/dark mode support.

The application runs entirely in containers using Podman, with external access provided through Cloudflare Tunnel for secure, zero-trust networking without exposing ports directly.

---

## Features

- Split-pane Markdown editor with live preview
- Real-time syntax highlighting for code blocks
- PDF export with three theme options:
  - Printer (black and white, ink-friendly)
  - Solarized Light (cream background)
  - Solarized Dark (dark blue background)
- Solarized color theme with light/dark mode toggle
- Theme preference persistence via localStorage
- File upload via button or drag-and-drop
- File validation (type and size limits)
- Toast notification system for user feedback
- Responsive design for various screen sizes
- Secure access via Cloudflare Tunnel

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 (Alpine) | JavaScript runtime |
| Express.js | 5.x | Web server framework |
| Puppeteer | Latest | Headless Chrome for PDF generation |
| Chromium | Alpine package | Browser engine for rendering |
| marked | Latest | Markdown parsing library |
| uuid | Latest | Unique identifier generation |

### Frontend

| Technology | Purpose |
|------------|---------|
| HTML5 | Document structure |
| CSS3 | Styling with CSS custom properties |
| Vanilla JavaScript | Client-side logic (no frameworks) |
| marked.js | Client-side Markdown parsing |
| highlight.js | Code syntax highlighting |

### Infrastructure

| Technology | Purpose |
|------------|---------|
| Podman | Container runtime (Docker alternative) |
| podman-compose | Multi-container orchestration |
| Cloudflare Tunnel | Secure external access without port exposure |
| Alpine Linux | Minimal container base image |

### Design

| Element | Specification |
|---------|---------------|
| Color Scheme | Solarized (by Ethan Schoonover) |
| Typography | System fonts, SF Mono for code |
| Icons | Text-based (no emoji dependencies) |

---

## Architecture

```
                                 Internet
                                    |
                                    v
                          +------------------+
                          | Cloudflare Edge  |
                          +------------------+
                                    |
                                    v
+---------------------------------------------------------------+
|  Podman Pod                                                   |
|                                                               |
|  +------------------+       +-----------------------------+   |
|  | cloudflared      |       | mirrormd-app                |   |
|  | (tunnel client)  | ----> | (Node.js + Puppeteer)       |   |
|  +------------------+       +-----------------------------+   |
|         |                              |                      |
|         |                              v                      |
|         |                   +-----------------------------+   |
|         |                   | Chromium (headless)         |   |
|         |                   | - PDF rendering             |   |
|         |                   +-----------------------------+   |
|         |                                                     |
|         +-------------> mirrormd-network (bridge)             |
|                                                               |
+---------------------------------------------------------------+
                                    |
                                    v
                          +------------------+
                          | ./temp (volume)  |
                          | - PDF files      |
                          | - Uploaded files |
                          +------------------+
```

### Data Flow

1. User accesses the application via Cloudflare Tunnel URL
2. Cloudflared container forwards requests to mirrormd-app on port 3000
3. Express.js serves the frontend and handles API requests
4. For PDF generation:
   - Markdown is parsed to HTML using marked.js
   - Puppeteer launches headless Chromium
   - HTML is rendered with PDF-specific CSS
   - PDF buffer is returned to the client

---

## Prerequisites

Before installing MirrorMD, ensure you have:

1. **Podman** (version 4.0 or later)
   - macOS: `brew install podman`
   - Linux: Use your distribution's package manager
   - Windows: Download from podman.io

2. **podman-compose**
   ```bash
   pip install podman-compose
   ```

3. **Cloudflare Account** with Zero Trust access
   - Free tier is sufficient
   - Requires a domain configured in Cloudflare

---

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mirrorMD
```

### 2. Initialize Podman Machine (macOS/Windows only)

```bash
podman machine init
podman machine start
```

### 3. Configure Cloudflare Tunnel

1. Log in to [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/)
2. Navigate to **Networks** > **Tunnels**
3. Click **Create a tunnel**
4. Name your tunnel (e.g., "mirrormd")
5. Copy the tunnel token
6. In the tunnel configuration, add a public hostname:
   - Subdomain: your choice (e.g., "md")
   - Domain: your Cloudflare domain
   - Service: `http://mirrormd-app:3000`

### 4. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` and add your tunnel token:

```
CLOUDFLARE_TUNNEL_TOKEN=eyJhIjoi...your_token_here
```

### 5. Start the Application

```bash
./start.sh
```

Or manually:

```bash
podman-compose up --build -d
```

---

## Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `CLOUDFLARE_TUNNEL_TOKEN` | Token from Cloudflare Zero Trust | Yes |
| `NODE_ENV` | Node environment (production/development) | No (default: production) |
| `PORT` | Internal port for the app | No (default: 3000) |

### File Limits

| Limit | Value | Location |
|-------|-------|----------|
| Upload file size | 5 MB | frontend/editor.js |
| Export content size | 10 MB | frontend/editor.js |
| API body size | 10 MB | backend/index.js |

---

## Usage

### Writing Markdown

1. Access your application via your Cloudflare Tunnel URL
2. Type or paste Markdown in the left pane
3. See rendered preview in the right pane in real-time
4. Resize panes by dragging the divider

### Uploading Files

- Click **Upload** button and select a file, or
- Drag and drop a `.md`, `.markdown`, or `.txt` file onto the editor

### Exporting to PDF

1. Click **Export PDF** button
2. Enter a document title (optional)
3. Select a PDF theme:
   - **Printer**: Black and white, suitable for printing
   - **Solarized Light**: Cream background with Solarized colors
   - **Solarized Dark**: Dark background with Solarized colors
4. Click **Generate PDF**
5. PDF downloads automatically

### Theme Toggle

Click the **Light/Dark** button in the header to switch between Solarized Light and Dark modes. Your preference is saved automatically.

---

## API Reference

### Health Check

```
GET /api/health
```

Returns server status.

**Response:**
```json
{
  "status": "ok",
  "message": "MirrorMD Backend is running!"
}
```

### Convert Markdown to HTML

```
POST /api/convert
Content-Type: application/json
```

**Request Body:**
```json
{
  "markdown": "# Hello World"
}
```

**Response:**
```json
{
  "success": true,
  "html": "<h1>Hello World</h1>",
  "stats": {
    "markdownLength": 13,
    "htmlLength": 22
  }
}
```

### Generate PDF

```
POST /api/generate-pdf
Content-Type: application/json
```

**Request Body:**
```json
{
  "markdown": "# Document Title\n\nContent here...",
  "filename": "document.md",
  "theme": "solarized-light",
  "title": "My Document"
}
```

**Response:** Binary PDF file with headers:
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="document.pdf"`

**Available Themes:**
- `printer`
- `solarized-light`
- `solarized-dark`

### Get PDF Themes

```
GET /api/pdf-themes
```

**Response:**
```json
{
  "success": true,
  "themes": [
    {"id": "printer", "name": "Printer", "description": "Black & white, ink-friendly"},
    {"id": "solarized-light", "name": "Solarized Light", "description": "Light cream background"},
    {"id": "solarized-dark", "name": "Solarized Dark", "description": "Dark blue background"}
  ],
  "default": "solarized-light"
}
```

### Save File

```
POST /api/save
Content-Type: application/json
```

**Request Body:**
```json
{
  "markdown": "# Content",
  "filename": "document.md"
}
```

### List Files

```
GET /api/files
```

### Get File

```
GET /api/files/:filename
```

### Delete File

```
DELETE /api/files/:filename
```

---

## Development

### Local Development with Port Exposure

For local development without Cloudflare Tunnel, you can modify `podman-compose.yml`:

```yaml
services:
  mirrormd:
    # ... existing config ...
    ports:
      - "3000:3000"
```

Then access at `http://localhost:3000`

### Rebuilding After Changes

```bash
podman-compose down
podman-compose up --build -d
```

### Viewing Logs

```bash
# All containers
podman-compose logs -f

# Specific container
podman logs -f mirrormd-app
podman logs -f mirrormd-tunnel
```

### Accessing Container Shell

```bash
podman exec -it mirrormd-app sh
```

---

## Project Structure

```
mirrorMD/
|-- backend/
|   |-- index.js              # Express server and API routes
|   |-- pdfConverter.js       # Puppeteer PDF generation module
|   |-- print.css             # PDF styling with theme support
|   |-- convert_test.js       # PDF generation test script
|   |-- package.json          # Node.js dependencies
|   +-- package-lock.json
|
|-- frontend/
|   |-- index.html            # Landing page
|   |-- editor.html           # Main editor interface
|   |-- styles.css            # Global styles and Solarized theme
|   |-- editor.css            # Editor-specific styles
|   |-- app.js                # Theme toggle functionality
|   +-- editor.js             # Editor logic, file handling, PDF export
|
|-- temp/                     # Temporary file storage (gitignored)
|
|-- .env                      # Environment variables (gitignored)
|-- .env.example              # Environment template
|-- .gitignore                # Git ignore rules
|-- Containerfile             # Container image definition
|-- podman-compose.yml        # Container orchestration
|-- start.sh                  # Startup script
|-- PROJECT_ROADMAP.md        # Development roadmap
+-- README.md                 # This file
```

---

## Troubleshooting

### Podman Machine Not Starting (macOS)

```bash
podman machine stop
podman machine rm
podman machine init --memory 4096
podman machine start
```

### Tunnel Not Connecting

1. Verify token is correct in `.env`
2. Check tunnel status in Cloudflare Dashboard
3. View tunnel logs: `podman logs mirrormd-tunnel`

### PDF Generation Fails

1. Check container logs: `podman logs mirrormd-app`
2. Verify Chromium is installed: `podman exec mirrormd-app which chromium-browser`
3. Ensure sufficient memory is allocated to Podman machine

### Container Build Fails

1. Ensure Podman machine is running
2. Check disk space: `podman system df`
3. Prune unused resources: `podman system prune -a`

### App Not Accessible

1. Verify containers are running: `podman-compose ps`
2. Check tunnel configuration in Cloudflare Dashboard
3. Ensure the service URL is `http://mirrormd-app:3000`

---

## License

MIT License

---

## Acknowledgments

- [Solarized](https://ethanschoonover.com/solarized/) color scheme by Ethan Schoonover
- [marked.js](https://marked.js.org/) for Markdown parsing
- [highlight.js](https://highlightjs.org/) for syntax highlighting
- [Puppeteer](https://pptr.dev/) for PDF generation
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) for secure access
