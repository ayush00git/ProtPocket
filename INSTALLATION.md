## Installation

### Prerequisites

- Go 1.21+
- Node.js 18+
- fpocket (`sudo apt-get install fpocket` on Debian/Ubuntu, or build from [source](https://github.com/Discngine/fpocket))
- Open Babel (`sudo apt-get install openbabel`)

### Backend

```bash
# Clone the repository
git clone https://github.com/ayush00git/ProtPocket.git
cd ProtPocket

# Run the backend (port 8000)
go run main.go
```

### Frontend

```bash
cd app
npm install
npm run dev
# Runs at localhost:5173
# Proxies /api/* to localhost:8000
```

---
