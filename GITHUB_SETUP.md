# 🚀 Додавання на GitHub

## Крок 1: Створи новий репозиторій на GitHub

1. Відкрий https://github.com/new
2. Назва: `taskManager`
3. Опис: `Full stack task management system`
4. **НЕ** ініціалізуй README, .gitignore, або LICENSE
5. Натисни "Create repository"

## Крок 2: Додай remote та push

```bash
cd /Users/dn210397pli/taskManager

# Додай GitHub репозиторій як remote
git remote add origin https://github.com/YOUR_USERNAME/taskManager.git

# Перейменуй гілку на main (якщо потрібно)
git branch -M main

# Push першого коміту
git push -u origin main
```

## Крок 3: Налаштування GitHub

1. Перейди на Settings репозиторія
2. **Secrets and variables** → **Actions**
3. Додай `GITHUB_TOKEN` (вже існує за замовчуванням)
4. Якщо потрібен Docker Hub push, додай:
   - `GHCR_PAT` - GitHub Personal Access Token

## ✅ Готово!

Тепер коли ти push-иш код на main:
- ✅ Автоматично запускаються GitHub Actions
- ✅ Backend будується та тестується
- ✅ Frontend будується та тестується  
- ✅ Docker образи публікуються на GitHub Container Registry

## 📝 Наступні push-и

```bash
# Зробити зміни
git add .
git commit -m "feat: описання змін"
git push origin main

# GitHub Actions автоматично:
# 1. Запускають тести
# 2. Будують образи
# 3. Пушать на registry
```
