# 📁 IntegramindDmng - Document Management System

🔗 **Live Demo:** [dms-frontend-theta.vercel.app](https://dms-frontend-theta.vercel.app/)  
🔗 **Backend Repo:** [DMS-Backend GitHub](https://github.com/RahulPathak17072005/DMS-Backend)

IntegramindDmng is a **secure document management system** built with **React (Vite)** for the frontend and **Node.js + Express** for the backend. It enables users to **upload, preview, and download documents**, with files stored in **Dropbox** and metadata saved in **MongoDB**.

---

## ✅ Features

- 🔐 Role-based access (Admin/User)
- 📤 Upload documents (PDF, DOCX, PNG, etc.)
- 🔍 In-browser preview & secure download
- ☁️ Dropbox storage integration
- ⚙️ Private/Public file access control
- 🛠️ Backend health check API

---

## 💻 Tech Stack

| Layer       | Technology                     |
|-------------|--------------------------------|
| Frontend    | React, Vite, React Router DOM  |
| Backend     | Node.js, Express.js            |
| Database    | MongoDB                        |
| Storage     | Dropbox API                    |
| Auth        | JWT (JSON Web Tokens)          |
| Uploads     | Multer                         |

---

## 🚀 How It Works

1. User logs in → receives JWT token  
2. Upload file → saved in Dropbox  
3. Metadata (name, size, access level) → stored in MongoDB  
4. Files can be listed, previewed, or downloaded based on user role & access rights

---

## 🔁 API Endpoints

| Method | Endpoint                 | Description                     |
|--------|--------------------------|---------------------------------|
| GET    | `/documents/health`      | Check if backend is running     |
| GET    | `/documents/list-all`    | Fetch all uploaded documents    |
| POST   | `/documents/upload`      | Upload a document (auth needed) |
| GET    | `/documents/preview/:id` | Preview file (auth needed)      |
| GET    | `/documents/download/:id`| Download file (auth needed)     |
| GET    | `/documents/test-document/:id` | Check Dropbox file existence |

---

## 🔐 Security

- **JWT Authentication** for protected routes  
- **Role-Based Access Control (RBAC)**  
- **Error-handling with clear responses**

---

## 🎥 Demo Flow

1. ✅ Check backend: `/documents/health`  
2. 📄 List all files  
3. ⬆️ Upload a document  
4. 🔍 Preview it in-browser  
5. ⬇️ Download  
6. 🚫 Try accessing private file as non-owner → denied

---

