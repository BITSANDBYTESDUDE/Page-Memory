# 🧠 PageMemory

### Remember where you left off.

**PageMemory** is a privacy-first Chrome extension that remembers where you stopped reading on webpages and lets you instantly continue from your previous reading position.

Save a page, read naturally, close the tab, and come back later. PageMemory keeps track of your reading progress locally so you can continue without searching for your place again.

---

## ✨ Features

### 📖 Reading Memory

Automatically remember your position on saved webpages.

* Reading progress tracking
* Scroll position memory
* Automatic progress updates
* One-click position restoration
* Support for long-form webpages

### 🔖 Page Library

Keep your important webpages organized in one place.

* Save webpages
* Recently read pages
* Search saved pages
* Favorites
* Page details
* Quick reopen

### 🏷️ Organization

Organize saved pages your way.

* Custom tags
* Collections
* Favorites
* Sorting and filtering
* Personal notes

### 📝 Personal Notes

Attach private notes to saved pages.

Use notes to remember:

* Important concepts
* Things to research later
* Tasks related to a webpage
* Learning notes
* Personal reminders

### 📊 Reading Progress

See exactly how much of a saved page you've read.

```text
JavaScript Closures

████████████████░░░░ 82%

Last read: 2 hours ago
```

### 🔍 Search

Quickly find saved pages by searching:

* Page title
* Website
* URL
* Tags
* Notes

### 🔐 Privacy First

PageMemory is designed with privacy as a core principle.

* No account required
* No external backend required
* No AI API
* No advertising
* No unnecessary tracking
* User data is stored locally in the browser
* No passwords or form contents are collected

Your saved PageMemory data stays on your device.

---

# 🎯 Why PageMemory?

The web is full of useful information, but reading often gets interrupted.

You find an interesting article.

You read halfway.

You close the tab.

Later you return and think:

> **"Where was I?"**

PageMemory solves that problem.

Instead of manually searching for your position, PageMemory remembers it for you.

---

# 🖥️ How It Works

```text
Open a webpage
      │
      ▼
Save the page
      │
      ▼
PageMemory tracks reading progress
      │
      ▼
Close the tab
      │
      ▼
Return later
      │
      ▼
Click "Continue Reading"
      │
      ▼
Return to your previous position
```

---

# 🏗️ Architecture

PageMemory is built as a modern Chrome Manifest V3 extension.

```text
                     Chrome Browser
                           │
                           ▼
                  ┌─────────────────┐
                  │ Popup / Options │
                  │   React UI      │
                  └────────┬────────┘
                           │ Typed messages
                           ▼
                  ┌─────────────────┐
                  │ Service Worker  │
                  │ Message router │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │ Content Script  │
                  │ Page metadata   │
                  └─────────────────┘
```

The extension uses a centralized typed request/reply protocol. The service worker
routes page metadata requests to the content script. Persistent page and settings
data are accessed through repositories backed by a schema-versioned
`chrome.storage.local` service; UI code does not access Chrome storage directly.

---

# 🛠️ Tech Stack

| Technology         | Purpose               |
| ------------------ | --------------------- |
| React              | User interface        |
| TypeScript         | Type-safe development |
| Vite               | Build tooling         |
| Tailwind CSS       | UI styling            |
| Chrome Manifest V3 | Extension platform    |
| Chrome Storage API | Local data storage    |
| Content Scripts    | Webpage interaction   |
| Service Worker     | Background processing |
| Vitest             | Unit testing          |
| Playwright         | Browser testing       |

---

# 📁 Project Structure

```text
PageMemory/
│
├── src/
│   ├── background/
│   │   └── index.ts
│   ├── content/
│   │   └── index.ts
│   ├── hooks/
│   │   └── useCurrentPage.ts
│   ├── messaging/
│   │   ├── chrome.ts
│   │   ├── client.ts
│   │   └── protocol.ts
│   ├── popup/
│   │   ├── main.tsx
│   │   └── Popup.tsx
│   ├── options/
│   │   └── main.tsx
│   ├── storage/
│   │   ├── models.ts
│   │   ├── PageRepository.ts
│   │   ├── SettingsRepository.ts
│   │   ├── StorageService.ts
│   │   ├── errors.ts
│   │   ├── validation.ts
│   │   └── repositories.test.ts
│   └── types/
│       └── index.ts
│
├── public/
│   └── manifest.json
├── popup.html
├── options.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

# 🚀 Development

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* Google Chrome
* Git

Check your versions:

```bash
node --version
npm --version
```

---

## Installation

Clone the repository:

```bash
git clone https://github.com/BITSANDBYTESDUDE/PageMemory.git
```

Navigate into the project:

```bash
cd PageMemory
```

Install dependencies:

```bash
npm install
```

---

## Development

Start the development build:

```bash
npm run dev
```

Depending on the project's Vite configuration, load the generated extension directory through Chrome's extension developer tools.

---

## Build

Create a production build:

```bash
npm run build
```

---

## Type Checking

```bash
npm run typecheck
```

---

## Linting

```bash
npm run lint
```

---

## Testing

Run the test suite:

```bash
npm test
```

---

# 🌐 Load PageMemory Locally

1. Build the project.

```bash
npm run build
```

2. Open Google Chrome.

3. Navigate to:

```text
chrome://extensions
```

4. Enable **Developer mode**.

5. Click **Load unpacked**.

6. Select the generated production extension directory.

7. Pin PageMemory to the Chrome toolbar.

8. Open a webpage and start using PageMemory.

---

# 🔒 Privacy

Privacy is a fundamental part of PageMemory.

PageMemory is designed around a **local-first architecture**.

### What PageMemory stores

Depending on enabled features, PageMemory may store:

* Saved webpage URLs
* Page titles
* Website/domain information
* Reading progress
* Scroll position
* Favorites
* Tags
* Collections
* Personal notes
* Local timestamps

### What PageMemory does NOT collect

PageMemory does not intentionally collect:

* Passwords
* Authentication tokens
* Credit card information
* Form values
* Cookies
* Private account credentials
* Keystrokes
* Personal browsing data unrelated to PageMemory functionality

PageMemory does not require an account or external server for its core functionality.

---

# 🔐 Permissions

PageMemory follows a **minimum-permission approach**.

Every Chrome permission used by the extension should have a direct relationship with an actual feature.

The project does not request permissions simply because they might be useful in the future.

---

# 🧪 Testing

PageMemory is intended to be tested against a variety of websites, including:

* Documentation websites
* Blogs
* Long-form articles
* React applications
* Next.js applications
* Vue applications
* Dynamic webpages
* Single-page applications
* Long scrolling pages

Important areas tested include:

* Page detection
* URL normalization
* Reading progress
* Scroll tracking
* Position restoration
* SPA navigation
* Storage reliability
* Search
* Tags
* Collections
* Notes
* Import/export
* Privacy controls

---

# 🗺️ Roadmap

## Version 1.0

* [x] Chrome Manifest V3 foundation
* [x] React + TypeScript architecture
* [x] Local storage
* [x] Page saving
* [x] Reading progress
* [x] Scroll position restoration
* [x] Page library
* [x] Search
* [x] Favorites
* [x] Tags
* [x] Collections
* [x] Personal notes
* [x] Reading statistics
* [x] Import/export
* [x] Privacy controls
* [x] Dark mode
* [x] Accessibility
* [x] Production testing

## Future

Potential future improvements:

* [ ] Keyboard shortcuts
* [ ] Context-menu integration
* [ ] Advanced highlights
* [ ] Reading goals
* [ ] Cross-device synchronization
* [ ] Optional account system
* [ ] Firefox support
* [ ] Microsoft Edge support
* [ ] Advanced reading analytics

Future features will only be added when they provide meaningful value to users.

---

# 🤝 Contributions

PageMemory is currently developed as a proprietary project.

The repository is public for **transparency, portfolio presentation, and educational reference**.

Unless explicitly authorized by the copyright holder, copying, modifying, redistributing, sublicensing, or commercially using the source code is not permitted.

For collaboration or permission requests, please contact the project owner.

---

# 📄 License

**No open-source license is currently granted.**

Copyright © 2026 **BITSANDBYTESDUDE**

All rights reserved.

The source code is publicly visible, but public visibility does not grant permission to copy, modify, distribute, sublicense, or commercially use the software.

For permission requests, contact the copyright holder.

---

# 🏢 Developed By

**BITSANDBYTESDUDE**

Building practical software, developer tools, and digital products.

---

# ⭐ Support

If you find PageMemory useful, you can support the project by:

* ⭐ Star the repository
* 🐛 Report reproducible bugs
* 💡 Suggest useful improvements
* 📖 Share PageMemory with others

---

## PageMemory

> **Remember where you left off.**
