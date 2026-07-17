# 🚀 Ahrefs Keyword Scraper

A modern **Next.js + Tailwind CSS** application that discovers the top-ranking websites for any keyword using the **Ahrefs API v3**, enriches each result with powerful SEO metrics, and exports everything as structured JSON.

---

## ✨ Features

- 🔑 Secure Ahrefs API authentication (server-side only)
- 🔍 Search any keyword across multiple countries
- 🌐 Fetch the top-ranking websites from Google SERPs
- 🎯 Optional URL/domain keyword filtering
- 📊 Enrich domains with Ahrefs Site Explorer metrics
- 📈 Live progress & status updates
- 📥 Export results as JSON
- ⚡ Built with Next.js App Router & Tailwind CSS

---

## 📸 Workflow

```text
Connect API
      │
      ▼
 Search Keyword
      │
      ▼
 Discover SERP Results
      │
      ▼
 Enrich Domains
      │
      ▼
 Export JSON
```

---

## ⚙️ How It Works

### 1. Connect

Provide your **Ahrefs API v3 Bearer Token**.

You can either:

- Add it to `.env.local`
- Paste it directly into the application

> Your token is **never exposed to the browser**. All Ahrefs requests are made securely from the server.

---

### 2. Search

Enter:

- Keyword
- Country
- Number of websites to retrieve (1–50)

Optionally enable:

- **Only include domains/URLs containing the keyword**

---

### 3. Discover

The app queries **Ahrefs SERP Overview** to retrieve the highest-ranking pages for the selected keyword.

---

### 4. Enrich

Every unique domain is enriched using **Ahrefs Site Explorer**.

Metrics include:

- Organic Traffic
- Organic Keywords
- Traffic Value
- Backlinks
- Referring Domains
- Top Traffic Country

---

### 5. Export

Download all collected data as a clean, structured **JSON** file.

---

## 📡 Live Status

While scraping, the UI streams real-time events including:

- ℹ️ Information
- ✅ Success
- ⚠️ Warnings
- ❌ Errors

making it easy to monitor the entire scraping process.

---

# 🔐 Ahrefs API

This project uses the **Ahrefs API v3**.

Requirements:

- Personal **Bearer Token**
- Active **Ahrefs API Subscription**
- API usage consumes available units

Use the built-in **Test Connection** feature to:

- Validate your token
- Check your remaining API units

---

# 🚀 Getting Started

### 1. Clone the project

```bash
git clone <repository-url>
cd ahrefs-keyword-scraper
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure your API token

```bash
cp .env.example .env.local
```

Add your Ahrefs token:

```env
AHREFS_API_TOKEN=your_token_here
```

### 4. Start the development server

```bash
npm run dev
```

Visit:

```
http://localhost:3000
```

---

# 📜 Available Scripts

| Command | Description |
|----------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build production application |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |

---

# 📁 Project Structure

```text
src/
│
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   └── api/
│       ├── config/
│       ├── scrape/
│       └── test-connection/
│
├── lib/
│   ├── ahrefs.ts
│   └── types.ts
```

### Directory Overview

| Directory | Purpose |
|-----------|---------|
| `app/page.tsx` | Main application UI |
| `api/config` | Detects server-side token |
| `api/test-connection` | Validates Ahrefs credentials |
| `api/scrape` | Streams scraping progress & enrichment |
| `lib/ahrefs.ts` | Ahrefs API client |
| `lib/types.ts` | Shared TypeScript types |

---

# 🛠 Tech Stack

- **Next.js (App Router)**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **Ahrefs API v3**

---

# 📦 Output

Each result contains rich SEO metrics, including:

```json
{
  "domain": "example.com",
  "organicTraffic": 15432,
  "organicKeywords": 2380,
  "trafficValue": 12500,
  "backlinks": 8562,
  "referringDomains": 412,
  "topCountry": "United States"
}
```

---

## 💡 Notes

- API requests are processed **server-side only**.
- Duplicate domains are automatically removed before enrichment.
- Results are streamed live to provide immediate feedback during scraping.
- Exported JSON is ready for further analysis or integration into other tools.

---

## 📄 License

This project is intended for educational and internal use. Please ensure your usage complies with the **Ahrefs API Terms of Service**.