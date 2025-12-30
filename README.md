# TaskManager - Full Stack Application

Complete task management system with Go backend, React frontend, and Kubernetes deployment.

## 📦 Project Structure

```
taskManager/
├── backend/              # Go Echo API
│   ├── main.go
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── .env.example
│   └── api/
│
├── frontend/             # React Web App
│   ├── package.json
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── .env.example
│   └── src/
│
├── infra/                # Infrastructure & Kubernetes
│   ├── k8s/              # Kubernetes manifests
│   │   ├── all-in-one-dev.yaml
│   │   ├── all-in-one-prod.yaml
│   │   └── ingress-nginx.yaml
│   ├── scripts/
│   │   └── setup-k3d.sh
│   └── docs/
│       ├── KUBERNETES.md
│       └── PROXMOX_SETUP.md
│
└── .github/workflows/    # GitHub Actions CI/CD
    ├── backend.yml
    └── frontend.yml
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- kubectl
- k3d
- Go 1.24+ (for backend development)
- Node.js 18+ (for frontend development)

### Setup & Run

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/taskManager.git
cd taskManager

# Copy environment templates
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Update .env files with your settings
nano backend/.env
nano frontend/.env

# Run everything with one command
./infra/scripts/setup-k3d.sh start

# Open in browser
open http://localhost:8080
```

## 🛠️ Available Commands

### Kubernetes Management
```bash
# Start complete cluster
./infra/scripts/setup-k3d.sh start

# Check status
./infra/scripts/setup-k3d.sh status

# View logs
./infra/scripts/setup-k3d.sh logs backend
./infra/scripts/setup-k3d.sh logs frontend

# Stop & cleanup
./infra/scripts/setup-k3d.sh stop
```

### Local Development (without Kubernetes)
```bash
# Backend
cd backend
go mod download
go run main.go

# Frontend (new terminal)
cd frontend
npm install
npm start
```

## 📚 Documentation

- **[Kubernetes Setup](infra/docs/KUBERNETES.md)** - Local K3D development
- **[Proxmox Home Server](infra/docs/PROXMOX_SETUP.md)** - Production deployment on home server
- **[Backend API](backend/README.md)** - Go API documentation
- **[Frontend](frontend/README.md)** - React app documentation

## 🔄 Architecture

```
┌─────────────────────────────────────────────────┐
│                   Internet                      │
│           (Proxmox / Home Server)               │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
        ┌────────────────────────────┐
        │    Ingress Controller      │
        │    (nginx)                 │
        │    Port 80, 443            │
        └────────────┬───────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
   ┌─────────────┐        ┌──────────────┐
   │  Frontend   │        │   Backend    │
   │  (React)    │        │  (Go Echo)   │
   │  Port 80    │        │  Port 8080   │
   └─────────────┘        └──────────────┘
        │                         │
        │                    ┌────┴─────┐
        │                    │           │
        │                    ▼           ▼
        │            ┌──────────────┬──────────────┐
        │            │  PostgreSQL  │    Redis     │
        │            │  Port 5432   │  Port 6379   │
        │            └──────────────┴──────────────┘
        │
        └──────────────────────────────────────────→ Static Files
                     (HTML/JS/CSS)
```

## 🔐 Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=taskmanager_db
DB_USER=postgres
DB_PASSWORD=your_password
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_secret_key
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:8080
```

## 🧪 Testing

### Backend Tests
```bash
cd backend
go test ./... -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🐳 Docker Images

The project builds and publishes Docker images to GitHub Container Registry:

- **Backend**: `ghcr.io/YOUR_USERNAME/taskapi:latest`
- **Frontend**: `ghcr.io/YOUR_USERNAME/taskfrontend:latest`

These are automatically built on every push to `main` branch (see `.github/workflows/`).

## 📝 CI/CD Pipeline

GitHub Actions workflows automatically:

1. **Backend CI** (on `backend/` changes)
   - Run Go tests
   - Run linters (golangci-lint)
   - Build Docker image
   - Push to GitHub Container Registry
   - Scan for vulnerabilities (Trivy)

2. **Frontend CI** (on `frontend/` changes)
   - Install dependencies
   - Run linting
   - Run tests
   - Build optimized bundle
   - Build Docker image
   - Push to GitHub Container Registry
   - Scan for vulnerabilities (Trivy)

## 🌐 Deployment Options

### 1. Local Development (K3D)
```bash
./infra/scripts/setup-k3d.sh start
```

### 2. Proxmox Home Server
See [PROXMOX_SETUP.md](infra/docs/PROXMOX_SETUP.md)

### 3. Cloud Providers (AWS/GCP/Azure)
Coming soon - see [Terraform documentation](infra/docs/TERRAFORM.md)

## 🔧 Development Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes in `backend/` or `frontend/`
3. Commit: `git commit -m "feat: describe your changes"`
4. Push: `git push origin feature/your-feature`
5. Create Pull Request
6. GitHub Actions automatically tests your code
7. Merge to main when tests pass

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
3. Make sure tests pass locally
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

- **Port 8080 already in use**: `lsof -i :8080` and kill the process
- **Kubernetes pods not starting**: `./infra/scripts/setup-k3d.sh logs backend`
- **Frontend can't reach API**: Check `frontend/.env` REACT_APP_API_URL
- **Database connection fails**: Verify `backend/.env` database credentials

See full troubleshooting in [KUBERNETES.md](infra/docs/KUBERNETES.md#troubleshooting).

## � Security Notes

### Known CVEs

**CVE-2025-30204** (golang-jwt/jwt v3.2.2 - HIGH)
- Indirect dependency pulled in via echo framework
- Impact: Excessive memory allocation during JWT header parsing
- **Status**: NOT EXPLOITABLE in this application
- **Reason**: This application does NOT use JWT middleware from echo
- **Authentication**: Uses custom JWT token handling with `github.com/golang-jwt/jwt/v5` (v5.3.0)
- **Mitigation**: If JWT middleware is enabled in future, upgrade to patched version

Trivy vulnerability scans are run on every build via GitHub Actions.

## �📞 Support

For issues and questions, create an issue in the repository.

---

**Happy coding!** 🚀
