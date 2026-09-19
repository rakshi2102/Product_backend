# Product Rate Rules & Audit Engine API (Backend)

An Enterprise Node.js & Express REST API for managing **Product Catalogs, General Ledger (GL) Account Mappings, Rate Rules, and Ledger Transaction Diagnostics**.

## 🚀 Features & Modules

- **Audit Engine**: Runs diagnostic checks against ledger transactions (Rate Deviations, Sales Ledger Mismatches, Invalid UOMs).
- **Rate Rules API**: Full CRUD management of category price boundaries and percentage tolerance limits.
- **Product & Mapping API**: General Ledger account mapping and catalog management.
- **Export Engine**: Real-time generation and streaming of `.xlsx`, `.csv`, and `.pdf` reports.

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/health` | Server status and uptime |
| `GET`  | `/api/audit/summary` | Live Audit Intelligence summary metrics |
| `GET`  | `/api/audit/errors` | Validation errors and exception rows |
| `POST` | `/api/audit/upload` | File upload handler (`.xlsx`, `.csv`) for automated audit |
| `POST` | `/api/audit/run` | Execute rule audit manually |
| `PATCH`| `/api/audit/errors/:id/resolve` | Mark validation error as Resolved |
| `PATCH`| `/api/audit/errors/:id/ignore` | Mark validation error as Ignored |
| `GET`  | `/api/products` | Product catalog with filters |
| `POST` | `/api/products` | Add new product to catalog |
| `GET`  | `/api/rate-rules` | List all active rate rules |
| `GET`  | `/api/export/excel` | Stream downloadable Excel audit report |
| `GET`  | `/api/export/csv` | Stream downloadable CSV exception list |
| `GET`  | `/api/export/pdf` | Stream downloadable PDF summary |

## 💻 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Backend Server
```bash
node server.js
```
Server runs by default on `http://localhost:5000`.
