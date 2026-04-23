# 🚀 DropSpace AI

A fully functional, modern web application for sharing texts and files securely. Dropspace acts as a fast, temporary file and text drop. It generates a unique 6-character retrieval code for every upload and automatically securely deletes the contents after 24 hours.

## 🌟 Key Features
- **Dynamic File Sharing**: Upload files up to 10MB using a responsive, drag-and-drop animated interface.
- **Text Sharing Engine**: Securely stash text snippets and easily copy-paste them using an instant retrieval code.
- **Auto-Cleanup**: A built-in background task actively sweeps the server and safely deletes physical files and database logs older than 24 hours. 
- **Premium UI/UX**: Designed using modern **Tailwind CSS** protocols including dark/light mode memory, sleek glassmorphism overlays, and live progress bars for a premium feel.
- **Zero Setup Database**: Powered natively by SQLite for zero-hassle operations utilizing the intuitive SQLAlchemy ORM.

## 🛠️ Technologies Used
- **Backend:** Python 3 (Flask API), SQLAlchemy ORM, APScheduler
- **Frontend:** HTML5, Tailwind CSS, Vanilla Javascript (AJAX / Fetch API) 
- **Cloud-Ready**: Comes packaged with `Procfile` and `runtime.txt` tailored to seamlessly jump to platforms like Railway.


