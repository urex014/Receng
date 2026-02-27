# AI-Powered Visual Search & Recommendation Engine

A full-stack e-commerce microservice architecture that enables **Snap & Shop reverse image search**, automated AI product tagging, and real-time visually similar recommendations.

Instead of relying on manual text tags, this platform uses a deep learning vision model to convert product images into mathematical arrays called feature vectors. These vectors are stored in a PostgreSQL vector database for fast similarity matching.

---

## Overview

The system uses computer vision to power product discovery.

When a product image is uploaded:

1. The AI model extracts visual features.
2. Those features are converted into a 1000-dimension vector.
3. The vector is stored in PostgreSQL using the `pgvector` extension.
4. Similarity is calculated using cosine distance `<=>`.

Everything runs in a decoupled microservice architecture.

---

## 🚀 Key Features

### Reverse Image Search (Snap & Shop)

Users upload a clothing image and the engine returns the closest matching inventory items in milliseconds.

### Automated Product Tagging

Admins upload a single product photo and the AI automatically:

- Extracts visual features  
- Cross-references ImageNet classes  
- Generates human-readable tags  

### Dynamic "Visually Similar" Carousels

Each product page automatically shows recommendations based on cosine distance proximity. No manual curation required.

### Microservice Architecture

The system is fully decoupled into:

- Frontend  
- Backend orchestrator  
- AI processing service  

---

## 🛠 Tech Stack

### Frontend
- Next.js  
- React  
- TypeScript  
- Tailwind CSS  

### Orchestrator API
- Node.js  
- Express  
- Prisma ORM  
- Multer  

### AI Microservice
- Python  
- FastAPI  
- ONNX Runtime  
- OpenCV  
- NumPy  

### Database
- PostgreSQL  
- pgvector extension  

### Machine Learning Model
- ResNet50 (Lightweight ONNX format)  

---

# ⚙️ Local Setup & Installation

This is a multi-service architecture. You must run three separate servers.

### Requirements

- Node.js  
- Python 3  
- PostgreSQL  

---

## 1️⃣ Database Setup (PostgreSQL + pgvector)

Ensure PostgreSQL is running and the `pgvector` extension is installed.

### Create the Database

```bash
sudo -u postgres createdb receng_db
```

### Enable Vector Extension

```bash
sudo -u postgres psql -d receng_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

### Update `.env` in Node.js Root

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/receng_db?schema=public"
```

### Sync Prisma Schema

```bash
npx prisma db push
```

### Force Vector Size to 1000 Dimensions

```bash
sudo -u postgres psql -d receng_db -c 'ALTER TABLE "Product" ALTER COLUMN "featureVector" TYPE vector(1000);'
```

---

## 2️⃣ AI Microservice (Python)

Navigate to your `ai-service` directory.

### Create Virtual Environment

```bash
python -m venv venv
```

### Activate Environment

Linux / macOS:
```bash
source venv/bin/activate
```

Windows:
```bash
venv\Scripts\activate
```

### Install Dependencies

```bash
pip install fastapi uvicorn onnxruntime opencv-python pillow numpy python-multipart
```

### ML Model Setup

The `resnet50-v1-7.onnx` model file is excluded due to size. Download it manually and place it in the Python directory before running.

### Start AI Service (Port 8000)

```bash
python main.py
```

---

## 3️⃣ Backend Orchestrator (Node.js)

Open a new terminal and navigate to your Node.js root directory.

### Install Dependencies

```bash
npm install express cors axios multer form-data @prisma/client
npm install prisma --save-dev
```

### Start Server (Port 5000)

```bash
node server.js
```

---

## 4️⃣ Frontend (Next.js)

Open another terminal and navigate to the frontend directory.

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

Frontend runs at:

```
http://localhost:3000
```

---

# 🚦 Usage Workflow

## 1. Populate the Database

Go to:

```
http://localhost:3000/admin/upload
```

Upload 4–5 product images to generate enough vectors for comparison.

---

## 2. View Recommendations

Click on any uploaded product.

Scroll down to see automatically generated "Visually Similar Items" based on cosine similarity.

---

## 3. Test Reverse Image Search

Navigate to:

```
http://localhost:3000/search
```

Upload a random clothing image and the engine will return the closest match from your database.

---

# 🧠 Architecture Summary

Frontend  
→ Node.js Orchestrator  
→ Python AI Microservice  
→ PostgreSQL with pgvector  

Each service is isolated, scalable, and independently deployable.

---

# 🔮 What's Next?

This engine serves as the foundational discovery layer for an upcoming Web3 peer-to-peer marketplace.

Planned upgrades:

- Smart contract integration  
- Solidity-based transactions  
- On-chain trustless commerce  
- AI-powered decentralized discovery  
