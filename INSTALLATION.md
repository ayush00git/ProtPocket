# Installation

```bash
# Clone the repo
git clone https://github.com/ayush00git/ProtPocket
cd ProtPocket

# Backend (Go + Gin)
go mod tidy && go run main.go

# Frontend (React + Vite)
cd app && npm install && npm run dev

# Optional — AlphaMissense index (required for Mutation Impact Predictor)
go run ./cmd/alphamissense_import/   # ~15–30 min depending on disk
go run ./cmd/alphamissense_index/   # ~10–20 min
```
