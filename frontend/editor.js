// MirrorMD Editor - Markdown Editor with Live Preview
(function() {
  // Constants
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const MAX_EXPORT_SIZE = 10 * 1024 * 1024; // 10MB for PDF export

  // DOM Elements
  const markdownInput = document.getElementById('markdownInput');
  const preview = document.getElementById('preview');
  const charCount = document.getElementById('charCount');
  const divider = document.getElementById('divider');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const exportBtn = document.getElementById('exportBtn');
  const copyHtmlBtn = document.getElementById('copyHtml');
  const editorContainer = document.getElementById('editorContainer');
  const dropZone = document.getElementById('dropZone');
  const currentFileEl = document.getElementById('currentFile');
  const toastContainer = document.getElementById('toastContainer');

  // Export Modal Elements
  const exportModal = document.getElementById('exportModal');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelExportBtn = document.getElementById('cancelExport');
  const confirmExportBtn = document.getElementById('confirmExport');
  const pdfTitleInput = document.getElementById('pdfTitle');

  // Current file name
  let currentFileName = '';

  // ========== Toast Notification System ==========
  function showToast(message, type = 'info', duration = 4000) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    const icons = {
      success: '✓',
      error: '✕',
      warning: '!',
      info: 'i'
    };

    toast.innerHTML = `
      <span class="toast-icon">${icons[type] || icons.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Close">&times;</button>
    `;

    toastContainer.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // Close button handler
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => removeToast(toast));

    // Auto remove
    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }

    return toast;
  }

  function removeToast(toast) {
    toast.classList.remove('show');
    toast.classList.add('hide');
    setTimeout(() => toast.remove(), 300);
  }

  // ========== File Size Helpers ==========
  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function validateFileSize(size, maxSize, context = 'file') {
    if (size > maxSize) {
      showToast(
        `${context} too large (${formatFileSize(size)}). Maximum size is ${formatFileSize(maxSize)}.`,
        'error'
      );
      return false;
    }
    return true;
  }

  // Configure marked.js
  if (typeof marked !== 'undefined') {
    // Custom renderer to handle images properly
    const renderer = new marked.Renderer();
    renderer.image = function(href, title, text) {
      // Handle both object format (new marked) and string format (old marked)
      if (typeof href === 'object') {
        text = href.text || '';
        title = href.title || '';
        href = href.href || '';
      }
      const titleAttr = title ? ` title="${title}"` : '';
      return `<img src="${href}" alt="${text}"${titleAttr} style="max-width: 100%; height: auto;">`;
    };

    // Allow raw HTML to pass through (for <img> tags etc)
    renderer.html = function(html) {
      // Handle object format in newer marked versions
      if (typeof html === 'object') {
        html = html.raw || html.text || '';
      }
      return html;
    };

    marked.setOptions({
      breaks: true,
      gfm: true,
      renderer: renderer,
      highlight: function(code, lang) {
        if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
          try {
            return hljs.highlight(code, { language: lang }).value;
          } catch (err) {
            console.error('Highlight error:', err);
          }
        }
        return code;
      }
    });
  }

  // Update highlight.js theme based on current theme
  function updateHighlightTheme() {
    const hljsTheme = document.getElementById('hljs-theme');
    if (hljsTheme) {
      const isDark = document.body.classList.contains('solarized-dark');
      const themeName = isDark ? 'solarized-dark' : 'solarized-light';
      hljsTheme.href = `https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/base16/${themeName}.min.css`;
    }
  }

  // Render markdown to preview
  function renderPreview() {
    if (!markdownInput || !preview) return;

    const markdown = markdownInput.value;
    
    if (typeof marked !== 'undefined') {
      preview.innerHTML = marked.parse(markdown);
      
      // Apply syntax highlighting to code blocks
      if (typeof hljs !== 'undefined') {
        preview.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightElement(block);
        });
      }
    } else {
      // Fallback: show raw text
      preview.textContent = markdown;
    }

    // Update character count
    updateCharCount();
  }

  // Update character count
  function updateCharCount() {
    if (!markdownInput || !charCount) return;
    const count = markdownInput.value.length;
    const words = markdownInput.value.trim().split(/\s+/).filter(w => w).length;
    charCount.textContent = `${count} chars · ${words} words`;
  }

  // Debounce function for performance
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Debounced render for typing
  const debouncedRender = debounce(renderPreview, 150);

  // Handle input events
  if (markdownInput) {
    markdownInput.addEventListener('input', debouncedRender);
    
    // Handle tab key for indentation
    markdownInput.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.selectionStart;
        const end = this.selectionEnd;
        this.value = this.value.substring(0, start) + '  ' + this.value.substring(end);
        this.selectionStart = this.selectionEnd = start + 2;
        debouncedRender();
      }
    });
  }

  // Resizable divider
  if (divider) {
    let isResizing = false;
    const editorPane = document.querySelector('.editor-pane');
    const previewPane = document.querySelector('.preview-pane');
    const container = document.querySelector('.editor-container');

    divider.addEventListener('mousedown', function(e) {
      isResizing = true;
      divider.classList.add('dragging');
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', function(e) {
      if (!isResizing) return;

      const containerRect = container.getBoundingClientRect();
      const percentage = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      
      if (percentage > 20 && percentage < 80) {
        editorPane.style.flex = `0 0 ${percentage}%`;
        previewPane.style.flex = `0 0 ${100 - percentage}%`;
      }
    });

    document.addEventListener('mouseup', function() {
      if (isResizing) {
        isResizing = false;
        divider.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    });
  }

  // Helper to load file content
  function loadFile(file) {
    if (!file) return;

    // Check file type
    const validTypes = ['.md', '.markdown', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(ext)) {
      showToast('Invalid file type. Please upload a .md, .markdown, or .txt file', 'error');
      return;
    }

    // Check file size
    if (!validateFileSize(file.size, MAX_FILE_SIZE, 'File')) {
      return;
    }

    // Show loading state on upload button
    if (uploadBtn) uploadBtn.classList.add('loading');

    const reader = new FileReader();
    reader.onload = function(event) {
      markdownInput.value = event.target.result;
      currentFileName = file.name;
      updateFilenameDisplay();
      renderPreview();
      showToast(`Loaded "${file.name}" (${formatFileSize(file.size)})`, 'success');
      if (uploadBtn) uploadBtn.classList.remove('loading');
    };
    reader.onerror = function() {
      showToast('Error reading file. Please try again.', 'error');
      if (uploadBtn) uploadBtn.classList.remove('loading');
    };
    reader.readAsText(file);
  }

  // Update filename display
  function updateFilenameDisplay() {
    if (currentFileEl) {
      currentFileEl.textContent = currentFileName ? currentFileName : '';
    }
  }

  // File upload via button
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      loadFile(file);
      // Reset input so same file can be uploaded again
      fileInput.value = '';
    });
  }

  // Drag and drop support
  if (editorContainer && dropZone) {
    let dragCounter = 0;

    editorContainer.addEventListener('dragenter', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter++;
      dropZone.classList.add('active');
    });

    editorContainer.addEventListener('dragleave', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter--;
      if (dragCounter === 0) {
        dropZone.classList.remove('active');
      }
    });

    editorContainer.addEventListener('dragover', function(e) {
      e.preventDefault();
      e.stopPropagation();
    });

    editorContainer.addEventListener('drop', function(e) {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      dropZone.classList.remove('active');

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        loadFile(files[0]);
      }
    });
  }

  // Export to PDF (placeholder - will be implemented in Day 8)
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      openExportModal();
    });
  }

  // Export Modal Functions
  function openExportModal() {
    if (!exportModal) return;
    
    // Pre-fill title from filename
    const title = currentFileName 
      ? currentFileName.replace(/\.(md|markdown|txt)$/i, '')
      : 'Document';
    if (pdfTitleInput) pdfTitleInput.value = title;
    
    exportModal.classList.add('active');
    pdfTitleInput?.focus();
  }

  function closeExportModal() {
    if (!exportModal) return;
    exportModal.classList.remove('active');
  }

  // Modal event listeners
  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', closeExportModal);
  }

  if (cancelExportBtn) {
    cancelExportBtn.addEventListener('click', closeExportModal);
  }

  // Close modal on overlay click
  if (exportModal) {
    exportModal.addEventListener('click', function(e) {
      if (e.target === exportModal) {
        closeExportModal();
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && exportModal.classList.contains('active')) {
        closeExportModal();
      }
    });
  }

  // Confirm export - generate PDF
  if (confirmExportBtn) {
    confirmExportBtn.addEventListener('click', async function() {
      await generatePDF();
    });
  }

  async function generatePDF() {
    const markdown = markdownInput?.value;
    if (!markdown || markdown.trim().length === 0) {
      showToast('No content to export. Please write some markdown first.', 'warning');
      return;
    }

    // Check content size
    const contentSize = new Blob([markdown]).size;
    if (!validateFileSize(contentSize, MAX_EXPORT_SIZE, 'Content')) {
      return;
    }

    // Get selected theme
    const selectedTheme = document.querySelector('input[name="pdfTheme"]:checked')?.value || 'solarized-light';
    const title = pdfTitleInput?.value || 'Document';

    // Update button state
    const btnText = confirmExportBtn.querySelector('.btn-text');
    const btnLoading = confirmExportBtn.querySelector('.btn-loading');
    
    confirmExportBtn.disabled = true;
    if (btnText) btnText.hidden = true;
    if (btnLoading) btnLoading.hidden = false;

    const startTime = Date.now();

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          markdown, 
          filename: currentFileName || `${title}.md`,
          theme: selectedTheme,
          title
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        // Create download link
        const downloadName = currentFileName 
          ? currentFileName.replace(/\.(md|markdown|txt)$/i, '.pdf')
          : `${title}.pdf`;
        
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);
        showToast(`PDF exported successfully (${formatFileSize(blob.size)}, ${duration}s)`, 'success');
        
        // Close modal on success
        closeExportModal();
      } else {
        let errorMsg = 'Failed to generate PDF';
        try {
          const error = await response.json();
          errorMsg = error.message || error.error || errorMsg;
        } catch (e) {
          // Response wasn't JSON
        }
        showToast(errorMsg, 'error');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        showToast('Network error. Please check your connection.', 'error');
      } else {
        showToast('Failed to generate PDF. Please try again.', 'error');
      }
    } finally {
      // Reset button state
      confirmExportBtn.disabled = false;
      if (btnText) btnText.hidden = false;
      if (btnLoading) btnLoading.hidden = true;
    }
  }

  // Copy HTML
  if (copyHtmlBtn) {
    copyHtmlBtn.addEventListener('click', function() {
      const html = preview.innerHTML;
      if (!html || html.trim().length === 0) {
        showToast('No content to copy', 'warning');
        return;
      }
      
      navigator.clipboard.writeText(html).then(() => {
        const originalText = copyHtmlBtn.textContent;
        copyHtmlBtn.textContent = 'Copied!';
        showToast('HTML copied to clipboard', 'success', 2000);
        setTimeout(() => {
          copyHtmlBtn.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        showToast('Failed to copy HTML to clipboard', 'error');
      });
    });
  }

  // Listen for theme changes (from app.js)
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.attributeName === 'class') {
        updateHighlightTheme();
        // Re-render to apply new highlight theme
        setTimeout(renderPreview, 100);
      }
    });
  });

  observer.observe(document.body, { attributes: true });

  // Initial render
  updateHighlightTheme();
  renderPreview();

  // Expose for debugging
  window.mirrorMD = {
    renderPreview,
    getMarkdown: () => markdownInput?.value || '',
    setMarkdown: (md, filename = '') => {
      if (markdownInput) {
        markdownInput.value = md;
        currentFileName = filename;
        updateFilenameDisplay();
        renderPreview();
      }
    },
    getFilename: () => currentFileName,
    loadFile
  };
})();
