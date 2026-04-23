# DropSpace - Secure File & Text Sharing App

A fully functional, modern web application for sharing texts and files securely. Dropspace generates a temporary, unique 6-character code for uploads and automatically deletes them after 24 hours.

## Technologies Used
- **Backend:** Python (Flask), SQLAlchemy (SQLite Database), APScheduler (Auto-deletion)
- **Frontend:** HTML5, Tailwind CSS, Vanilla JS
- **Storage:** Local disk for files, SQLite for metadata/text.

---

## 🚀 End-to-End Deployment Guide (Render.com)

Render allows you to easily deploy this application directly from your GitHub repository for free. Follow these steps:

### Phase 1: Upload to GitHub
1. Create a GitHub account at [github.com](https://github.com) if you don't have one.
2. In your terminal or command prompt, navigate to this project folder.
3. Initialize the repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for DropSpace"
   ```
4. Create a new repository on GitHub (make it Public or Private).
5. Link it and push:
   ```bash
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Phase 2: Deploy on Render
1. Go to [Render.com](https://render.com) and create an account using your GitHub.
2. Click **New +** at the top right and select **Web Service**.
3. Under **Connect a repository**, find your newly created repository and click **Connect**.
4. Configure the service:
   - **Name:** dropspace (or whatever you prefer)
   - **Language:** Python 3
   - **Branch:** main
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn app:app` (This uses the included `Procfile` technically)
   - **Instance Type:** Free (if available) or Starter.
5. Setup Environment Variables:
   - Scroll down and click **Advanced**.
   - Click **Add Environment Variable**.
   - Key: `SECRET_KEY` | Value: (generate a random string of characters)
   - Keep `DATABASE_URL` empty, it will default to SQLite in the local directory.
6. **Important Note on Disks:**
   - Because Render's Free tier uses ephemeral storage, uploaded files will be lost if the server re-starts or goes to sleep.
   - For a production set-up to preserve files between restarts, you must attach a **Disk** using a paid instance:
     - Under "Disks" (in Advanced settings), add a mount path `uploads` and mount it to `/opt/render/project/src/uploads` (or the respective working directory `/uploads`).
7. Click **Create Web Service**.

Your app is now deploying! Once Render finishes building, it will provide a public URL like `https://dropspace.onrender.com`.

---

## Running Locally

1. Create a virtual environment: `python -m venv venv`
2. Activate it:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
3. Install requirements requirements: `pip install -r requirements.txt`
4. Run the app: `flask run` (or `python app.py`)
5. Open your browser and go to `http://127.0.0.1:5000`
