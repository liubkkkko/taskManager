# Kubernetes Configuration Files

Kubernetes маніфести для запуску TaskManager приложення.

## 📁 Структура

```
infra/k8s/
├── all-in-one-dev.yaml       # DEV конфіг (локальна розробка з localhost:8080)
├── all-in-one-prod.yaml      # PROD конфіг (з persistent storage, HA, resource limits)
├── ingress-nginx.yaml        # Standalone nginx ingress контролер
└── README.md                 # Цей файл
```

## 🚀 Використання

### DEV (локально)

Для локальної розробки використовуйте `all-in-one-dev.yaml`:

```bash
# Встановити ingress-nginx
kubectl apply -f ingress-nginx.yaml

# Розгорнути приложення
kubectl apply -f all-in-one-dev.yaml

# Налаштувати port-forward
kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80

# Доступ на http://localhost:8080
```

### PRODUCTION

Для production використовуйте `all-in-one-prod.yaml` і **обов'язково** замініть:

1. **Passwords** - генеруйте безпечні паролі:
   ```bash
   openssl rand -base64 32  # для пароля БД
   openssl rand -hex 8      # для username
   ```

2. **Docker images** - замініть на реальні реєстри:
   ```yaml
   image: your-docker-username/taskapi:v1.0.0
   image: your-docker-username/taskfrontend:v1.0.0
   ```

3. **Domain** - замініть на реальний домен:
   ```yaml
   - host: taskmanager.yourdomain.com
   ```

## 📋 Основні компоненти

### all-in-one-dev.yaml

- **Namespace**: taskmanager
- **Database**: PostgreSQL (latest)
- **Cache**: Redis (latest)
- **Backend**: Go Echo API (taskapi:local)
- **Frontend**: React App (taskfrontend:local)
- **Ingress**: Simple prefix routing (/)
- **Replicas**: 1 для кожного сервісу

### all-in-one-prod.yaml

- **Database**: PostgreSQL 15 Alpine з PersistentVolume (50Gi)
- **Backend**: 3 replicas з pod anti-affinity
- **Frontend**: 2 replicas
- **Resources**: CPU/Memory requests and limits
- **Health Checks**: Liveness + Readiness probes
- **Ingress**: Доменне ім'я + TLS (Let's Encrypt)

### ingress-nginx.yaml

- RBAC permissions (ClusterRole + ClusterRoleBinding)
- Deployment з 1 replica
- Service (ClusterIP)
- ConfigMap

## 🔑 Секрети і конфіги

Всі секрети зберігаються у Kubernetes Secrets:

```bash
# Переглянути секрети
kubectl get secrets -n taskmanager

# Декодувати пароль
kubectl get secret backend-secrets -n taskmanager -o jsonpath='{.data.DB_PASSWORD}' | base64 -d
```

## 📊 Резюме: DEV vs PROD

| Параметр | DEV | PROD |
|----------|-----|------|
| **Образи** | local | registry/v1.0.0 |
| **БД** | latest | postgres:15-alpine |
| **Storage** | ephemeral | PVC 50Gi |
| **Replicas** | 1 | 2-3 |
| **Resources** | unlimited | limited |
| **Health Checks** | None | ✓ |
| **Domain** | localhost:8080 | yourdomain.com |
| **HTTPS** | ✗ | ✓ |

## 🛠️ Рекомендовані инструменты

```bash
# Переглянути логи
./setup-k3d.sh logs backend
./setup-k3d.sh logs frontend

# Статус
./setup-k3d.sh status

# Перезапуск
./setup-k3d.sh clean && ./setup-k3d.sh start
```

## 📚 Документація

- [KUBERNETES_SETUP.md](../../KUBERNETES_SETUP.md) - повний гайд з инструкціями
- [setup-k3d.sh](../../setup-k3d.sh) - скрипт для автоматизації

