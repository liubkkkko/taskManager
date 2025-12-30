# TaskManager - Kubernetes Documentation

## 🚀 Quick Start

**3 команди щоб почати:**

```bash
./setup-k3d.sh start              # 🚀 Повна настройка
curl http://localhost:8080        # ✓ Frontend
curl http://localhost:8080/api/health  # ✓ API: {"status":"ok"}
```

## 📚 Документація

- **[QUICK_START.md](QUICK_START.md)** - Швидкий старт (3 команди)
- **[infra/k8s/README.md](infra/k8s/README.md)** - Про конфіг файли

## 🔧 Команди

```bash
./setup-k3d.sh start           # 🚀 Повна настройка з нуля
./setup-k3d.sh status          # 📊 Статус кластеру
./setup-k3d.sh logs backend    # 📝 Логи backend
./setup-k3d.sh logs frontend   # 📝 Логи frontend
./setup-k3d.sh stop            # 🛑 Видалити кластер
./setup-k3d.sh help            # 📖 Справка
```

## 📁 Структура

```
TaskManager/
├── setup-k3d.sh                ⚙️  Автоматизація запуску
├── QUICK_START.md              📖 Швидкий старт
├── KUBERNETES.md               📚 Це файл (основна документація)
│
└── infra/k8s/
    ├── README.md               📋 Про конфіг файли
    ├── all-in-one-dev.yaml     🚀 DEV конфіг (localhost:8080)
    ├── all-in-one-prod.yaml    🏢 PROD конфіг
    └── ingress-nginx.yaml      🌐 Ingress контролер
```

## 🏗️ Архітектура

```
localhost:8080
    ↓ (port-forward)
ingress-nginx:80
    ↓
frontend:80 (React App)
    ├→ /api/* → backend:8080 (Go API)
    │           ├→ PostgreSQL:5432
    │           └→ Redis:6379
    └→ /* → Static Files (HTML/JS/CSS)
```

## 📝 DEV vs PROD

| Параметр | DEV | PROD |
|----------|-----|------|
| **Образи** | taskapi:local | registry/taskapi:v1.0.0 |
| **БД версія** | latest | postgres:15-alpine |
| **Storage** | Ephemeral | PVC 50Gi |
| **Replicas Backend** | 1 | 3 |
| **Replicas Frontend** | 1 | 2 |
| **Resources** | Unlimited | Limited |
| **Domain** | localhost:8080 | yourdomain.com |
| **HTTPS** | ❌ | ✅ (Let's Encrypt) |

## 🏢 Production Setup

1. **Генеруємо паролі:**
   ```bash
   openssl rand -base64 32  # DB password
   ```

2. **Збудовуємо образи та виділяємо в реєстр:**
   ```bash
   docker build -t registry/taskapi:v1.0.0 taskAPI/
   docker build -t registry/taskfrontend:v1.0.0 taskAPI_front/
   docker push registry/taskapi:v1.0.0
   docker push registry/taskfrontend:v1.0.0
   ```

3. **Оновлюємо `infra/k8s/all-in-one-prod.yaml`:**
   - Замінюємо паролі
   - Замінюємо docker image paths
   - Замінюємо домен: `taskmanager.yourdomain.com`

4. **Розгортаємо:**
   ```bash
   kubectl apply -f infra/k8s/ingress-nginx.yaml
   kubectl apply -f infra/k8s/all-in-one-prod.yaml
   ```

## 🔍 Моніторинг

```bash
# Статус подів
kubectl get pods -n taskmanager

# Логи
kubectl logs -n taskmanager <pod-name>

# Описання pod
kubectl describe pod -n taskmanager <pod-name>

# Ingress
kubectl get ingress -n taskmanager
kubectl describe ingress taskmanager-ingress -n taskmanager
```

## 🐛 Troubleshooting

### Pod в стані Pending/CrashLoopBackOff

```bash
# Дивіться eventos та логи
kubectl describe pod -n taskmanager <pod-name>
kubectl logs -n taskmanager <pod-name> --previous
```

### Ingress повертає 404

```bash
# Перевіримо endpoints
kubectl get endpoints -n taskmanager

# Перевіримо IngressClass
kubectl get ingressclass

# Перестворимо ingress
kubectl delete ingress taskmanager-ingress -n taskmanager
kubectl apply -f infra/k8s/all-in-one-dev.yaml
```

### API недоступна з браузера

```bash
# Перевіримо port-forward
ps aux | grep "port-forward"

# Перестартуємо
pkill -f "port-forward"
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 &
```

## 📚 Корисні команди

```bash
# Масштабування
kubectl scale deployment backend --replicas=5 -n taskmanager

# Оновлення образу
kubectl set image deployment/backend backend=taskapi:v1.0.1 -n taskmanager

# Відкат
kubectl rollout undo deployment/backend -n taskmanager

# Видалення всіх ресурсів
kubectl delete all --all -n taskmanager
```

## 🔐 Безпека

### Генеруємо безпечні паролі

```bash
# Random password (32 chars)
openssl rand -base64 32

# Random username (16 chars)
openssl rand -hex 8
```

**Ніколи** не комітьте паролі в git. Використовуйте:
- Kubernetes Secrets
- External Secrets Operator
- Sealed Secrets (для PROD)

## 📖 Посилання

- [Kubernetes Official Docs](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [nginx-ingress Documentation](https://kubernetes.github.io/ingress-nginx/)
- [k3d Documentation](https://k3d.io/)
