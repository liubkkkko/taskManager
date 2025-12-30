# TaskManager - Quick Start Guide

## 🚀 Найшвидший старт (3 команди)

```bash
# 1. Однієї команді - все буде встановлено
./setup-k3d.sh start

# 2. Перевірити статус
./setup-k3d.sh status

# 3. Тестувати
curl http://localhost:8080/          # Frontend
curl http://localhost:8080/api/health  # API: {"status":"ok"}
```

## 📚 Структура команд

```bash
./setup-k3d.sh start        # 🚀 Повна настройка з нуля
./setup-k3d.sh stop         # 🛑 Видалити кластер
./setup-k3d.sh status       # 📊 Статус
./setup-k3d.sh logs backend # 📝 Логи
./setup-k3d.sh logs frontend
```

## 📂 Файли конфігурації

- `setup-k3d.sh` - Скрипт для автоматизації
- `KUBERNETES_SETUP.md` - Повна документація
- `infra/k8s/all-in-one-dev.yaml` - DEV конфіг
- `infra/k8s/all-in-one-prod.yaml` - PROD конфіг
- `infra/k8s/ingress-nginx.yaml` - Ingress контролер

## 🔧 PRODUCTION

1. Замініть паролі у `all-in-one-prod.yaml`:
   ```bash
   openssl rand -base64 32  # новий пароль
   ```

2. Залиймо образи у реєстр:
   ```bash
   docker build -t registry/taskapi:v1.0.0 taskAPI/
   docker build -t registry/taskfrontend:v1.0.0 taskAPI_front/
   docker push registry/taskapi:v1.0.0
   docker push registry/taskfrontend:v1.0.0
   ```

3. Оновіть образи у `all-in-one-prod.yaml`

4. Розгортаємо:
   ```bash
   kubectl apply -f infra/k8s/ingress-nginx.yaml
   kubectl apply -f infra/k8s/all-in-one-prod.yaml
   ```

## 🐛 Troubleshooting

```bash
# Переглянути поди
kubectl get pods -n taskmanager

# Логи контейнера
kubectl logs -n taskmanager <pod-name>

# Описання pod
kubectl describe pod -n taskmanager <pod-name>

# Перестартувати pod
kubectl delete pod -n taskmanager <pod-name>
```

## 📖 Більше інформації

Дивіться [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md) для повного гайда!
