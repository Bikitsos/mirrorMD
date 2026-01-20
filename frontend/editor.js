// MirrorMD Editor - Markdown Editor with Live Preview
(function() {
  // DOM Elements
  const markdownInput = document.getElementById('markdownInput');
  const preview = document.getElementById('preview');
  const charCount = document.getElementById('charCount');
  const divider = document.getElementById('divider');
  const uploadBtn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('fileInput');
  const exportBtn = document.getElementById('exportBtn');
  const copyHtmlBtn = document.getElementById('copyHtml');

  // Configure marked.js
  if (typeof marked !== 'undefined') {
    marked.setOptions({
      breaks: true,
      gfm: true,
      headerIds: true,
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

  // File upload
  if (uploadBtn && fileInput) {
    uploadBtn.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function(event) {
        markdownInput.value = event.target.result;
        renderPreview();
      };
      reader.onerror = function() {
        alert('Error reading file');
      };
      reader.readAsText(file);
      
      // Reset input so same file can be uploaded again
      fileInput.value = '';
    });
  }

  // Export to PDF (placeholder - will be implemented in Day 8)
  if (exportBtn) {
    exportBtn.addEventListener('click', async function() {
      try {
        const markdown = markdownInput.value;
        const response = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ markdown })
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'document.pdf';
          a.click();
          URL.revokeObjectURL(url);
        } else {
          const error = await response.json();
          alert(error.message || 'Failed to generate PDF');
        }
      } catch (err) {
        alert('PDF export not yet implemented. Coming in Phase 3!');
      }
    });
  }

  // Copy HTML
  if (copyHtmlBtn) {
    copyHtmlBtn.addEventListener('click', function() {
      const html = preview.innerHTML;
      navigator.clipboard.writeText(html).then(() => {
        const originalText = copyHtmlBtn.textContent;
        copyHtmlBtn.textContent = '✅ Copied!';
        setTimeout(() => {
          copyHtmlBtn.textContent = originalText;
        }, 2000);
      }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy HTML');
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
    setMarkdown: (md) => {
      if (markdownInput) {
        markdownInput.value = md;
        renderPreview();
      }
    }
  };
})();
