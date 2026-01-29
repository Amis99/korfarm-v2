# 로컬 개발 가이드

## 1) 필수 설치
- JDK 17 (PATH에 `java`가 잡혀 있어야 합니다)
- Docker Desktop (MySQL 실행용)

## 2) 데이터베이스 실행
```powershell
cd C:\Users\RENEWCOM PC\Documents\국어농장v2홈페이지
docker compose -f infra\local\docker-compose.yml up -d
```

## 3) 백엔드 실행
```powershell
cd backend
.\scripts\setup-gradle-wrapper.ps1
.\gradlew bootRun
```

## 4) 프런트엔드 실행
```powershell
cd frontend
npm install
npm run dev
```

## 5) 기본 접속
- 백엔드: `http://localhost:8080/v1/health`
- 프런트: `http://localhost:5173`
