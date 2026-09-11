# Destek Talebi Yönetim Sistemi

Kullanıcıların destek talepleri oluşturabildiği ve yöneticilerin (Admin) bu talepleri ve kullanıcı hesaplarını yönetebildiği web tabanlı destek talebi yönetim sistemi.

Uygulama; birbirinden bağımsız bir frontend ve backend mimarisine sahip olup, REST prensiplerine uygun bir API üzerinden haberleşir ve tüm bileşenleri Docker Compose ile birlikte çalıştırılabilir.

---

## 🛠 Planlanan Teknolojiler

### Backend
- **Framework:** ASP.NET Core Web API
- **ORM:** Entity Framework Core (Code First & Migrations)
- **Veritabanı:** PostgreSQL
- **Mimari:** Controller - Service - Repository katmanları
- **Dokümantasyon:** Swagger / OpenAPI

### Frontend
- **Kütüphane & Dil:** React, TypeScript
- **Veri & Durum Yönetimi:** TanStack Query, Context API
- **HTTP İstemcisi:** Axios

### Çalıştırma Ortamı
- **Konteynerizasyon:** Docker & Docker Compose (Frontend, Backend, PostgreSQL)

---

## 📁 Proje Yapısı

```text
.
├── backend/            # ASP.NET Core Web API projesi
├── frontend/           # React + TypeScript web uygulaması
├── docker-compose.yml  # Docker Compose yapılandırması
├── .env.example        # Ortam değişkenleri şablonu
├── .gitignore          # Git yoksayma kuralları
└── README.md           # Proje dokümantasyonu
```

---

## 🚀 Çalıştırma (Docker Compose)

### 1. Ortam Değişkenleri
Örnek ortam değişkenleri dosyasını kopyalayarak yerel `.env` dosyanızı oluşturun:
```bash
cp .env.example .env
```

### 2. Uygulamayı Başlatma
Tüm servisleri tek komutla derleyip başlatabilirsiniz:
```bash
docker compose up --build
```

### 3. Servis Adresleri ve Portlar
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **Swagger UI:** http://localhost:5000/swagger
- **PostgreSQL:** localhost:5432

---

> **Not:** Mimari kararlar, oturum ve güvenlik mekanizmaları, token süreleri ve gerekçeleri, migration yönetimi ile manuel test senaryoları ilgili geliştirme adımları tamamlandıkça bu dokümana eklenecektir.
