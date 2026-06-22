# CareVale — Product Management Software

> Full-stack product management system for CareVale (carevale.co.in)
> **Stack:** React · Node.js/Express · PostgreSQL
> **Hosting:** Render.com (frontend + backend + database)

---

## 🚀 Deploy on Render (Step-by-Step)

### Step 1 — Create PostgreSQL Database
1. Go to [dashboard.render.com](https://dashboard.render.com)
2. Click **New → PostgreSQL**
3. Name: `carevale-db` | Region: Singapore | Plan: Free
4. Click **Create Database**
5. Copy the **Internal Database URL** — you will need it

### Step 2 — Deploy the Backend API
1. Click **New → Web Service**
2. Connect your GitHub repo: `Gchandu4/Product-Management-`
3. Settings:
   - **Name:** `carevale-api`
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `DATABASE_URL` = *(paste Internal Database URL from Step 1)*
   - `JWT_SECRET` = *(any long random string, e.g. 64 random characters)*
   - `JWT_EXPIRES_IN` = `7d`
   - `ALLOWED_ORIGINS` = `https://carevale-frontend.onrender.com`
5. Click **Create Web Service**
6. Wait for deploy. Copy your API URL e.g. `https://carevale-api.onrender.com`

### Step 3 — Run Database Migration
After the backend deploys:
1. Go to your `carevale-api` service on Render
2. Click **Shell** tab
3. Run:
```bash
npm run db:migrate
npm run db:seed
```
4. You should see: `✓ Migration complete` and `✓ Seed complete`

### Step 4 — Deploy the Frontend
1. Click **New → Static Site**
2. Connect same GitHub repo: `Gchandu4/Product-Management-`
3. Settings:
   - **Name:** `carevale-frontend`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Add Environment Variable:
   - `VITE_API_URL` = *(your API URL from Step 2)*
5. Add Redirect/Rewrite Rule:
   - Source: `/*` | Destination: `/index.html` | Type: Rewrite
6. Click **Create Static Site**

### Step 5 — Update CORS
1. Go back to `carevale-api` service
2. Environment Variables → edit `ALLOWED_ORIGINS`
3. Set value to your frontend URL e.g. `https://carevale-frontend.onrender.com`
4. Save → Render will auto-redeploy

---

## ✅ Login Credentials (after seed)

| Field    | Value                    |
|----------|--------------------------|
| Email    | admin@carevale.co.in     |
| Password | CareVale@2026            |

**Change this password immediately after first login.**

---

## 📁 Project Structure

```
/
├── render.yaml          ← Render Blueprint (auto-deploy config)
├── backend/
│   ├── package.json
│   ├── src/
│   │   ├── index.js     ← Express server
│   │   ├── config/
│   │   │   ├── db.js        ← PostgreSQL connection
│   │   │   ├── migrate.js   ← Create tables
│   │   │   └── seed.js      ← Sample data + admin user
│   │   ├── controllers/ ← Business logic
│   │   ├── middleware/  ← Auth + error handling
│   │   └── routes/      ← API endpoints
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── App.jsx
        ├── api/         ← Axios API calls
        ├── components/  ← Layout, sidebar
        ├── context/     ← Auth state
        ├── pages/       ← Dashboard, Products, Categories, Stock
        └── utils/       ← CSV export
```

---

## 🔑 API Endpoints

| Method | Endpoint                    | Auth  | Description           |
|--------|-----------------------------|-------|-----------------------|
| POST   | /api/auth/login             | No    | Login                 |
| GET    | /api/auth/me                | Yes   | Current user          |
| GET    | /api/products               | Yes   | List products         |
| POST   | /api/products               | Staff | Create product        |
| PUT    | /api/products/:id           | Staff | Update product        |
| DELETE | /api/products/:id           | Admin | Delete product        |
| GET    | /api/products/stats         | Yes   | Dashboard stats       |
| GET    | /api/categories             | Yes   | List categories       |
| POST   | /api/categories             | Admin | Create category       |
| GET    | /api/stock/history          | Yes   | Stock audit log       |
| POST   | /api/stock/adjust           | Staff | Adjust stock quantity |
| GET    | /api/stock/summary          | Yes   | Dashboard charts data |

---

## 💡 Local Development

```bash
# Backend
cd backend
cp .env.example .env      # fill in your local DB details
npm install
npm run db:migrate
npm run db:seed
npm run dev               # runs on http://localhost:4000

# Frontend (new terminal)
cd frontend
cp .env.example .env      # VITE_API_URL=http://localhost:4000
npm install
npm run dev               # runs on http://localhost:5173
```

---

*CareVale Product Management © 2026 | carevale.co.in*
