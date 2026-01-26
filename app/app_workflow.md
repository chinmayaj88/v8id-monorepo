# Android App Workflow: First-Time Login & Home Page

This document explains the data flow when a user logs in for the first time and lands on the Home Page, comparing the current implementation with the planned offline-first optimization.

## 1. Current Approach (API-First / Online Only)

Direct network dependency for all dashboard data.

- **Trigger:** User logs in -> Home Page opens -> `init { loadDashboardData() }` in `HomeViewModel`.
- **API Call:** `GET /backend/api/files/dashboard`
- **Data Handling:**
  - App fetches storage stats (total/used) and recent files (top 20).
  - Data is stored in-memory (StateFlow).
  - If offline or API fails, the Home Page remains empty or shows an error.
- **Result:** Slow initial load, no offline support.

---

## 2. Optimized Approach (Offline-First / Sync Architecture)

Reactive UI driven by local SQLite (Room) with background synchronization.

- **Trigger:** User logs in for the first time.
- **Step 1: The Initial Sync**
  - App calls `GET /backend/api/sync` (Full Sync).
  - Server returns **all** user files and folders metadata.
  - App inserts this entire "universe" of metadata into the **SQLite Database**.
- **Step 2: Home Page Display**
  - `HomeViewModel` observes the local SQLite database.
  - **Query:** `SELECT * FROM files ORDER BY updatedAt DESC LIMIT 20`.
  - **Result:** Recent files populate the screen automatically as they are saved to the database.
- **Step 3: Subsequent Visits**
  - User re-opens the app.
  - **Instant UI:** Files appear instantly from SQLite (0ms wait).
  - **Silent Sync:** App calls `GET /backend/api/sync?since=last_timestamp` (Delta Sync).
  - Only changes are downloaded and patched into SQLite.

---

## Comparison Summary

| Feature                 | Current Workflow             | Optimized (Offline-First) |
| :---------------------- | :--------------------------- | :------------------------ |
| **Primary Data Source** | Network API                  | **Local SQLite (Room)**   |
| **Main Endpoint**       | `/api/files/dashboard`       | `/api/sync`               |
| **Speed (Subsequent)**  | Limited by Network (~500ms+) | **Instant (0-10ms)**      |
| **Offline Handling**    | Shows Error/Empty            | Shows Cached Data         |
| **Battery Impact**      | Higher (full re-fetch)       | Lower (Delta sync only)   |

---

## 3. Files Tab Structure (2-Tab Layout)

When the user navigates to the **Files** tab from the main navigation, they see a screen with a **Search Bar** at the top and two sub-tabs: **"Folders"** and **"Files"**.

### Sub-Tab: Folders

- **Goal:** Show only root-level folders.
- **Optimal Query:** `SELECT * FROM folders WHERE parentId IS NULL AND isDeleted = 0 ORDER BY name ASC`
- **Behavior:** This list is pulled instantly from SQLite.

### Sub-Tab: Files

- **Goal:** Show only root-level files (files not belonging to any folder).
- **Optimal Query:** `SELECT * FROM files WHERE folderId IS NULL AND isDeleted = 0 ORDER BY name ASC`
- **Behavior:** This list is pulled instantly from SQLite.

---

## 4. SQLite Storage (The Database Schema)

To power the entire app (Home, Files, Search) with zero network lag, we use **two main tables**.

> [!TIP]
> We do **NOT** need a separate "Recent Files" table. "Recent" is just a way to sort the main `files` table.

### Table Name: `files`

| Column      | Type        | Description                                    |
| :---------- | :---------- | :--------------------------------------------- |
| `id`        | String (PK) | Unique File ID                                 |
| `name`      | String      | Filename                                       |
| `folderId`  | String?     | Null if root, otherwise parent folder ID       |
| `size`      | Long        | File size in bytes                             |
| `mimeType`  | String      | e.g., "image/jpeg", "application/pdf"          |
| `updatedAt` | Long (TS)   | Last modified time (used for "Recent" sorting) |
| `isDeleted` | Boolean     | Whether it is in trash                         |

### Table Name: `folders`

| Column      | Type        | Description                              |
| :---------- | :---------- | :--------------------------------------- |
| `id`        | String (PK) | Unique Folder ID                         |
| `name`      | String      | Folder name                              |
| `parentId`  | String?     | Null if root, otherwise parent folder ID |
| `updatedAt` | Long (TS)   | Last modified time                       |
| `isDeleted` | Boolean     | Whether it is in trash                   |
| `color`     | String?     | Hex code for folder icon                 |

---

## Conclusion: How "Recent Files" Works

On the **Home Page**, we don't call a new API. We simply ask the `files` table:
`SELECT * FROM files WHERE isDeleted = 0 ORDER BY updatedAt DESC LIMIT 20`

This ensures that the **same data** is used across the whole app, keeping it perfectly in sync.

---

## 5. Performance & Large Data (1,000+ Items)

If a user has 1,000 folders or 5,000 files, the app remains fast using two key techniques:

### A. Full Metadata Sync (Background)

- **Why:** File metadata is very small (text). Even 1,000 files only take about 500KB of data.
- **Action:** When the user logs in, the `/api/sync` endpoint sends ALL metadata. The app stores it all in SQLite.
- **Success:** This means the user can search and browse their entire cloud drive instantly, even if they go into a tunnel with no internet.

### B. UI Paging (The "Window" Approach)

- **Problem:** Even if we have 1,000 items in SQLite, loading 1,000 UI rows into Android's memory at once would crash the app.
- **Solution: Paging 3 Library.**
  1.  **SQLite to UI:** Instead of fetching the whole list, the app asks SQLite for only the first 30 items.
  2.  **On Scroll:** As the user scrolls down and reaches the end, the **Paging 3 Library** automatically asks SQLite for the next 30 items.
  3.  **Recycling:** Android "recycles" the rows that go off-screen to save RAM.
- **Result:** Whether you have 10 files or 10,000 files, the **UI performance stays exactly the same (60 FPS smoothness)**.

---

## Conclusion

The data is **fetched once** (Sync), **stored forever** (SQLite), and **rendered in chunks** (Paging 3).

---

## 6. Scenario: Opening a Huge Folder (e.g., 5,000 Images + 1,000 Folders)

When a user clicks on a folder that contains 6,000 total items, the app handles it flawlessly without making the user wait for a loading spinner.

### Step 1: Instant Database Load (0ms)

- Because of the **Initial Sync** done at login, the app _already knows_ most of these 6,000 items.
- **Query:** The app immediately runs:
  - `SELECT * FROM folders WHERE parentId = :targetId`
  - `SELECT * FROM files WHERE folderId = :targetId`
- **Result:** The first 20-30 items appear on the screen **immediately**.

### Step 2: Smooth Scrolling (The Paging Logic)

- The user starts scrolling. They don't feel the weight of 6,000 items.
- **Paging 3** fetches items from the local SQLite DB in batches as the user scrolls.
- Memory usage stays low because Android only renders the ~15 items visible on the screen.

### Step 3: Background Validation (The "Silent" Refresh)

- While the user is scrolling, the app triggers a silent API call: `GET /api/folders?parentId=targetId&limit=1`.
- **Check:** The app checks the server to see if anything has changed in this specific folder since the last sync.
- **Update:** If the server says there are new items, it downloads them in the background and patches the SQLite DB. The UI updates automatically.

### Summary

1.  **UI:** Always ready (Cached in SQLite).
2.  **RAM:** Fixed usage (Paging 3).
3.  **Network:** Only used to double-check for new changes.

---

## 7. Workflow: Viewing Full Files (Images, Videos, Docs)

When a user taps on a specific file to view it in full screen, the app does **not** download the file through our Node.js backend. Instead, it uses a **Pre-signed URL** for maximum speed.

### The Flow:

1.  **Tap:** User clicks on an image or video.
2.  **Request Link:** The app calls `POST /api/files/:id/link`.
3.  **Backend Logic:**
    - Backend verifies the user has permission to see that file.
    - Backend talks to OCI Object Storage and generates a **Pre-Authenticated Request (PAR)**.
    - This is a special, secure URL that is only valid for a short time (e.g., 1 hour).
4.  **Direct Download:** The backend sends this URL back to the Android app.
5.  **Render:** The Android app (using Coil for images or ExoPlayer for video) streams the file **directly from Oracle Cloud**.

### Why is this the "Optimal" approach?

- **Zero Server Load:** Our Node.js server doesn't have to "touch" the heavy file data. It only handles a tiny JSON request for the link.
- **High Performance:** Oracle Cloud's storage network is much faster at serving large files than a standard API server.
- **Security:** The URL expires automatically, so the file remains private.

### Optimization: PAR Link Caching (Mobile Side)

To avoid generating a new PAR every single time you click (especially if it's just 30 seconds apart), the Android app uses an **In-Memory Link Cache**.

- **First Click:** App has no link -> Calls `/api/files/:id/link` -> Receives URL (valid for 1hr) -> Stores in cache with its expiry time.
- **Second Click (after 30s / 15min / 20min):**
  - App checks cache for the `fileId`.
  - App checks if current time < `expiresAt - 5 minutes` (Safe buffer).
  - **Result:** App uses the **cached URL instantly**. No API call is made to the backend.
- **Expired Click (after 1hr+):**
  - App sees link is expired -> Clears cache -> Calls API again for a new fresh PAR.

---

## Conclusion

The app is a "Metadata First" machine. It keeps all the _names and dates_ locally in SQLite for instant browsing, and only fetches the _heavy file content_ (pre-signed URLs) when the user explicitly asks to see them.
