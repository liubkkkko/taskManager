#!/bin/bash

# ============================================================================
# TaskManager - Kubernetes Cluster Setup Script
# ============================================================================
# Usage: ./setup-k3d.sh [clean|install|start|stop|logs]
# ============================================================================

set -e

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
K3D_CLUSTER_NAME="taskmanager"
NAMESPACE="taskmanager"
DOCKER_REGISTRY_PATH="${PROJECT_ROOT}/backend ${PROJECT_ROOT}/frontend"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# Functions
# ============================================================================

log_info() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
    exit 1
}

check_dependencies() {
    log_info "Перевіряємо залежності..."
    
    command -v k3d >/dev/null 2>&1 || log_error "k3d не встановлено. Встановіть з https://k3d.io"
    command -v kubectl >/dev/null 2>&1 || log_error "kubectl не встановлено"
    command -v docker >/dev/null 2>&1 || log_error "docker не встановлено"
    
    log_info "Всі залежності знайдені ✓"
}

build_docker_images() {
    log_info "Збудовуємо Docker образи..."
    
    # Backend
    log_info "Будуємо backend..."
    docker build -t taskapi:local "${PROJECT_ROOT}/backend" \
        || log_error "Помилка при бідленні backend образу"
    
    # Frontend
    log_info "Будуємо frontend..."
    docker build -t taskfrontend:local "${PROJECT_ROOT}/frontend" \
        || log_error "Помилка при бідленні frontend образу"
    
    log_info "Docker образи готові"
}

cleanup_cluster() {
    log_warn "Видаляємо старий кластер '$K3D_CLUSTER_NAME'..."
    
    # Kill port-forward процеси
    pkill -f "kubectl port-forward.*ingress-nginx" || true
    
    # Видалимо кластер
    k3d cluster delete "$K3D_CLUSTER_NAME" 2>/dev/null || true
    
    log_info "Кластер видалено"
}

create_cluster() {
    log_info "Створюємо k3d кластер '$K3D_CLUSTER_NAME'..."
    
    k3d cluster create "$K3D_CLUSTER_NAME" \
        --agents 0 \
        --wait \
        --api-port 6550 \
        || log_error "Помилка при створенні кластеру"
    
    log_info "Кластер створений ✓"
}

import_images() {
    log_info "Імпортуємо Docker образи в k3d..."
    
    k3d image import taskapi:local taskfrontend:local -c "$K3D_CLUSTER_NAME" \
        || log_error "Помилка при імпорті образів"
    
    log_info "Образи імпортовані ✓"
}

install_ingress_nginx() {
    log_info "Встановлюємо ingress-nginx контролер..."
    
    kubectl apply -f "${PROJECT_ROOT}/infra/k8s/ingress-nginx.yaml" \
        || log_error "Помилка при встановленні ingress-nginx"
    
    log_info "Створюємо IngressClass для nginx..."
    kubectl apply -f - <<'EOF'
apiVersion: networking.k8s.io/v1
kind: IngressClass
metadata:
  name: nginx
spec:
  controller: k8s.io/ingress-nginx
EOF
    
    log_info "Чекаємо поки ingress-nginx запуститься..."
    kubectl wait --for=condition=Ready pod \
        -l app.kubernetes.io/name=ingress-nginx \
        -n ingress-nginx \
        --timeout=300s \
        || log_error "ingress-nginx не запустився вчасно"
    
    log_info "ingress-nginx готовий ✓"
}

deploy_app() {
    log_info "Розгорнемо приложення..."
    
    kubectl apply -f "${PROJECT_ROOT}/infra/k8s/all-in-one.yaml" \
        || log_error "Помилка при розгортанні приложення"
    
    log_info "Чекаємо поки поди запустяться..."
    kubectl wait --for=condition=Ready pod \
        -l app=frontend,app=backend \
        -n "$NAMESPACE" \
        --timeout=300s \
        || log_warn "Деякі поди не запустилися вчасно (це нормально, можуть запуститися пізніше)"
    
    log_info "Приложення розгорнуто ✓"
}

setup_port_forward() {
    log_info "Налаштовуємо port-forward..."
    
    # Kill старі процеси
    pkill -f "kubectl port-forward.*ingress-nginx" || true
    sleep 1
    
    # Стартуємо новий port-forward в фоні
    kubectl port-forward -n ingress-nginx svc/ingress-nginx-controller 8080:80 \
        >/dev/null 2>&1 &
    
    sleep 2
    
    log_info "Port-forward запущений (localhost:8080 -> ingress-nginx:80)"
}

show_status() {
    log_info "Статус кластеру:"
    echo ""
    
    echo "Поди в namespace '$NAMESPACE':"
    kubectl get pods -n "$NAMESPACE" || true
    
    echo ""
    echo "Сервіси:"
    kubectl get svc -n "$NAMESPACE" || true
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n "$NAMESPACE" || true
}

test_endpoints() {
    log_info "Тестуємо endpoints..."
    
    sleep 2
    
    # Frontend test
    log_info "Тестуємо frontend (http://localhost:8080/)..."
    if curl -s http://localhost:8080/ | grep -q "<!doctype html>" ; then
        log_info "Frontend working ✓"
    else
        log_warn "Frontend не відповідає правильно"
    fi
    
    # API test
    log_info "Тестуємо API (http://localhost:8080/api/health)..."
    if curl -s http://localhost:8080/api/health | grep -q "status" ; then
        log_info "API working ✓"
    else
        log_warn "API не відповідає правильно"
    fi
}

show_logs() {
    POD_NAME="${1:-backend}"
    log_info "Показуємо логи для $POD_NAME..."
    
    kubectl logs -n "$NAMESPACE" \
        $(kubectl get pods -n "$NAMESPACE" -l "app=$POD_NAME" -o jsonpath='{.items[0].metadata.name}') \
        --tail=50 \
        -f
}

show_help() {
    cat << EOF
TaskManager - K3D Kubernetes Setup Script

Використання: $0 [command]

Команди:
  clean       - Видалити старий кластер
  build       - Збудувати Docker образи
  create      - Створити k3d кластер
  install     - Встановити ingress-nginx та розгорнути приложення
  start       - Повна настройка: clean + build + create + install + port-forward
  stop        - Видалити кластер та зупинити port-forward
  status      - Показати статус кластеру
  test        - Тестувати endpoints
  logs        - Показати логи (use: logs <pod-name>, default: backend)
  help        - Показати цю справку

Примеры:
  $0 start             # Повна настройка
  $0 status            # Перевірити статус
  $0 logs backend      # Логи backend
  $0 logs frontend     # Логи frontend
  
EOF
}

# ============================================================================
# Main
# ============================================================================

COMMAND="${1:-help}"

case "$COMMAND" in
    clean)
        check_dependencies
        cleanup_cluster
        ;;
    build)
        check_dependencies
        build_docker_images
        ;;
    create)
        check_dependencies
        create_cluster
        ;;
    install)
        check_dependencies
        import_images
        install_ingress_nginx
        deploy_app
        ;;
    start)
        check_dependencies
        cleanup_cluster
        build_docker_images
        create_cluster
        import_images
        install_ingress_nginx
        deploy_app
        setup_port_forward
        show_status
        test_endpoints
        echo ""
        log_info "✓ Все готово! Приложення доступне на http://localhost:8080"
        ;;
    stop)
        check_dependencies
        cleanup_cluster
        ;;
    status)
        check_dependencies
        show_status
        ;;
    test)
        check_dependencies
        test_endpoints
        ;;
    logs)
        check_dependencies
        show_logs "${2:-backend}"
        ;;
    help)
        show_help
        ;;
    *)
        log_error "Невідома команда: $COMMAND"
        show_help
        ;;
esac

