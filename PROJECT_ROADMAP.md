# Project Architecture & Tech Stack

- **Container Runtime:** Podman (using `podman play kube` or `podman-compose`).
- **Backend:** Python (FastAPI) or Node.js (Express). *Recommendation:* Node.js (excellent ecosystem for markdown/PDF libraries).
- **Frontend:** HTML/JS with Tailwind CSS (configured for Solarized).
- **PDF Engine:** Puppeteer (headless Chrome) or `markdown-pdf`.
- **Storage:** A shared volume for temporary file processing.

---

## Phase 1: Environment & Foundation (Days 1-2)

### Day 1: Podman Setup & Container Configuration

**Goal:** Get a "Hello World" web server running inside a Podman pod.

**Tasks:**
- [x] Initialize a git repository.
- [x] Create a `backend/` directory and initialize a Node.js project (`npm init -y`).
- [x] Create a `Containerfile` (Dockerfile) for the Node.js app.
- [x] Create a `podman-compose.yml` or generate a Kubernetes YAML (`podman generate kube`) to define the pod.

**Milestone:** ✅ Run `podman-compose up` and access `localhost:3000` to see a basic server response.

---

### Day 2: Solarized UI Skeleton

**Goal:** Create the basic layout with the ability to toggle themes.

**Tasks:**
- [x] Set up the frontend structure (`index.html`, `styles.css`).
- [x] Implement the Solarized Color Palette (Base03 to Base3, Yellow, Orange, Red, etc.).
- [x] Create a simple JavaScript toggle that switches a class on the `<body>` (e.g., `.solarized-light` ↔ `.solarized-dark`).

**Milestone:** ✅ A web page with a header, footer, and content area that cleanly switches between light (cream background) and dark (deep blue background) modes.

---

## Phase 2: Core Editor Functionality (Days 3-5)

### Day 3: Markdown Editor Integration

**Goal:** A working text area that understands Markdown.

**Tasks:**
- [x] Integrate a lightweight library like **EasyMDE** or **CodeMirror**.
- [x] Style the editor using your Solarized CSS variables (ensure syntax highlighting matches the theme).
- [x] Set up a real-time preview pane (split-screen view: Code on left, Preview on right).

**Milestone:** ✅ You can type Markdown on the left and see the rendered HTML on the right.

---

### Day 4: File Upload Mechanism

**Goal:** Upload a `.md` file from your local machine to the web app.

**Tasks:**
- [x] Create an HTML File Input element (`<input type="file" accept=".md">`).
- [x] Write the Frontend JS to read the file contents using the `FileReader` API (client-side reading is faster than uploading to server just to read it back).
- [x] Populate the Markdown Editor with the uploaded file's text.

**Milestone:** ✅ You can click "Upload", select a `readme.md`, and see its text appear in the editor.

---

### Day 5: File Management (Backend Logic)

**Goal:** Handle data flow between the frontend and the backend.

**Tasks:**
- [x] Create a `POST` endpoint `/api/convert` that accepts the Markdown string.
- [x] Create a `POST` endpoint `/api/save` (optional) if you want to persist files in a container volume.

**Milestone:** ✅ The frontend can successfully send the current editor content to the backend logs.

---

## Phase 3: The PDF Engine (Days 6-8)

### Day 6: Setting up the PDF Converter

**Goal:** Convert HTML/Markdown to PDF programmatically.

**Tasks:**
- [x] Install a conversion library in the backend container.
  - **Option A (Heavy but precise):** Install `puppeteer` (requires installing Chromium dependencies in the Containerfile). ✅ CHOSEN
  - **Option B (Lighter):** Use `markdown-pdf` or `html-pdf`.
- [x] Update the `Containerfile` to include necessary system libraries (e.g., `libnss3`, `libatk` if using Puppeteer).
- [x] Write a script to test conversion internally (e.g., `node convert_test.js`).

**Milestone:** ✅ A script in the container successfully generates a `test.pdf` from a string.

---

### Day 7: Styling the PDF Output

**Goal:** Ensure the PDF doesn't look like a plain generic document.

**Tasks:**
- [ ] Inject CSS into the PDF generation process.
- [ ] Decide: Should the PDF be "Printer Friendly" (Black/White) or "Solarized" (Theme colors)?
- [ ] Create a specific CSS file for print media (`@media print`).

**Milestone:** The generated test PDF now has proper margins, fonts, and styling.

---

### Day 8: Connecting Export to UI

**Goal:** The "Export PDF" button works.

**Tasks:**
- [ ] **Frontend:** When "Export" is clicked, `POST` the markdown to `/api/generate-pdf`.
- [ ] **Backend:** Generate the PDF into a buffer or temp file.
- [ ] **Backend:** Return the PDF stream with proper headers (`Content-Type: application/pdf`, `Content-Disposition: attachment`).

**Milestone:** Clicking the button downloads a file named `document.pdf` to your computer.

---

## Phase 4: Refinement & Deployment (Days 9-10)

### Day 9: Polish & Error Handling

**Goal:** Make it robust and user-friendly.

**Tasks:**
- [ ] Add loading spinners (generating PDFs can take 1-3 seconds).
- [ ] Handle errors (e.g., "File too large" or "Invalid Markdown").
- [ ] Refine the Solarized theme toggle to persist preference (save to `localStorage`).

**Milestone:** The app feels responsive and remembers if you prefer Dark Mode.

---

### Day 10: Podman Orchestration & Cleanup

**Goal:** Finalize the "Pod" concept.

**Tasks:**
- [ ] Optimize the container image (use multi-stage builds to reduce size).
- [ ] Write a `pod.yaml` for Kubernetes-compatible execution (`podman play kube pod.yaml`).
- [ ] Write a `README.md` explaining how to run it.

**Milestone:** You can stop everything, run one command, and the full app launches cleanly.
