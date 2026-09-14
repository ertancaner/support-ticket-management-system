# 🎫 Destek Talebi Yönetim Sistemi / Support Ticket Management System

[![Türkçe](https://img.shields.io/badge/Language-T%C3%BCrk%C3%A7e-blue.svg)](#-t%C3%BCrk%C3%A7e)
[![English](https://img.shields.io/badge/Language-English-red.svg)](#-english)

---

# 🇹🇷 Türkçe

Kullanıcıların destek talepleri (ticket) oluşturabildiği, taleplerine yorum ekleyebildiği; yöneticilerin (Admin) ise bu talepleri durum makinelerine (state machine) göre yönetebildiği, kategorileri ve kullanıcı hesaplarını idare edebildiği modern, kurumsal standartlarda bir web uygulamasıdır.

Uygulama; katmanlı mimariye (N-Tier) sahip bir **ASP.NET Core Web API** backend'i, modern **React 19 + TypeScript + Vite + Tailwind CSS** frontend'i ve **PostgreSQL** veritabanı ile tam konteynerize edilmiş (Docker Compose) olarak çalışmaktadır.

---

## 📑 İçindekiler
1. [Kullanılan Teknolojiler ve Tercih Gerekçeleri](#-kullanılan-teknolojiler-ve-tercih-gerekçeleri)
2. [Sistem Mimarisi ve Katmanlar](#-sistem-mimarisi-ve-katmanlar)
3. [Proje Klasör Yapısı](#-proje-klasör-yapısı)
4. [Docker ile Hızlı Kurulum ve Çalıştırma](#-docker-ile-hızlı-kurulum-ve-çalıştırma)
5. [Ortam Değişkenleri (.env)](#-ortam-değişkenleri-env)
6. [İlk Admin Hesabı ve Tohumlama (Seeding)](#-i̇lk-admin-hesabı-ve-tohumlama-seeding)
7. [Veritabanı Migration ve Tohumlama Stratejisi](#-veritabanı-migration-ve-tohumlama-stratejisi)
8. [Erişim Adresleri ve Portlar](#-erişim-adresleri-ve-portlar)
9. [Güvenlik ve Kimlik Doğrulama Mimarisi](#-güvenlik-ve-kimlik-doğrulama-mimarisi)
   - [JWT ve HttpOnly Cookie Yaklaşımı](#jwt-ve-httponly-cookie-yaklaşımı)
   - [Refresh Token Rotasyonu (RTR)](#refresh-token-rotasyonu-rtr)
   - [CSRF (Cross-Site Request Forgery) Koruması](#csrf-cross-site-request-forgery-koruması)
   - [Anında Oturum İptali (Session Invalidation)](#anında-oturum-i̇ptali-session-invalidation)
   - [Token Süreleri ve Seçim Gerekçeleri](#token-süreleri-ve-seçim-gerekçeleri)
10. [Roller ve Yetkilendirme Kuralları](#-roller-ve-yetkilendirme-kuralları)
11. [Manuel Doğrulama ve Test Senaryoları](#-manuel-doğrulama-ve-test-senaryoları)
12. [Bilinen Sınırlar ve Kapsam Dışı Konular](#-bilinen-sınırlar-ve-kapsam-dışı-konular)

---

## 🛠 Kullanılan Teknolojiler ve Tercih Gerekçeleri

### Backend
| Teknoloji | Sürüm | Tercih Gerekçesi |
| :--- | :--- | :--- |
| **.NET / ASP.NET Core** | 10.0 (Preview) | Yüksek performans, yerleşik DI konteyneri, zengin middleware desteği ve tip güvenliği. |
| **Entity Framework Core** | 10.0 | Code-First yaklaşımı, otomatik migration desteği, Global Query Filters (Soft Delete) ve Interceptor mimarisi. |
| **PostgreSQL** | 16-Alpine | Güvenilirlik, ACID uyumluluğu, gelişmiş JSON/indeksleme kabiliyetleri ve açık kaynak ekosistemi. |
| **BCrypt.Net-Next** | 4.0.3 | Güvenli tek yönlü parola hashleme (work factor: 11) ile brute-force saldırılarına karşı yüksek direnç. |
| **Swagger / OpenAPI** | Swashbuckle | Dokümantasyon, interaktif API testi ve OpenAPI spesifikasyonu standardı. |

### Frontend
| Teknoloji | Sürüm | Tercih Gerekçesi |
| :--- | :--- | :--- |
| **React** | 19.x | Bileşen tabanlı modern deklaratif arayüz geliştirme. |
| **TypeScript** | 5.x | Derleme anında tip güvenliği, kod okunabilirliği ve refactor kolaylığı. |
| **Vite** | 6.x | Ultra hızlı HMR (Hot Module Replacement) ve optimize edilmiş production derleme süreci. |
| **Tailwind CSS** | 4.x | Utility-first CSS yaklaşımı, sıfır runtime maliyeti ve responsive/modern UI tasarımı. |
| **Lucide React** | - | Modern, tutarlı ve hafif SVG ikon kütüphanesi. |
| **TanStack Query (React Query)**| 5.x | Sunucu durumu (server state) yönetimi, akıllı önbellekleme (caching) ve otomatik arka plan yenileme. |
| **Axios** | 1.x | Otomatik cookie aktarımı (`withCredentials: true`), HTTP request/response interceptor'ları ve 401 yenileme kuyruğu. |

### Dağıtım & Altyapı
| Bileşen | Detay |
| :--- | :--- |
| **Docker & Docker Compose** | Çok aşamalı (Multi-stage) derleme ile minimum imaj boyutu ve izole ortam çalıştırması. |
| **Nginx (Alpine)** | Frontend SPA statik dosya sunumu (`try_files`) ve `/api/` yönlendirmesi için yerleşik Reverse Proxy. |

---

## 🏛 Sistem Mimarisi ve Katmanlar

Uygulama, sorumlulukların net olarak ayrıldığı **N-Tier (Çok Katmanlı) Mimari** prensiplerine göre inşa edilmiştir:

```text
[ React 19 Frontend (Port 3000) ]
              │ (HTTP / JSON / HttpOnly Cookies)
              ▼
    [ Nginx Reverse Proxy ]
              │ /api/* proxy pass
              ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND API                        │
│                                                         │
│  [ Controllers ]      -> HTTP Request/Response, DTO     │
│          │               Validasyonu, HTTP Status Codes │
│          ▼                                              │
│  [ Services ]         -> İş Mantığı (Business Logic),   │
│          │               Yetki Kontrolleri, Durum       │
│          │               Makineleri, Domain Invariant'lar│
│          ▼                                              │
│  [ Repositories ]     -> EF Core Soyutlaması, CRUD,     │
│          │               Özel Sorgular, Eager Loading   │
│          ▼                                              │
│  [ DataContext & DB ] -> Interceptors (Audit), Global   │
│                          Query Filters (Soft Delete)    │
└─────────────────────────────────────────────────────────┘
              │
              ▼
   [ PostgreSQL 16 Veritabanı ]
```

### Katman Sorumlulukları ve Temel Tercihler

1. **Controllers**:
   - Yalnızca HTTP isteklerini karşılar, parametreleri doğrular ve servis katmanına iletir.
   - Veritabanı veya iş kuralları ile doğrudan temas etmez.
   - Yanıtları standart DTO formatında ve uygun HTTP durum kodlarıyla (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`) döner.

2. **Services**:
   - Tüm iş kuralları, iş akışları ve durum geçiş mantığı bu katmanda yer alır.
   - Kullanıcının yalnızca kendi taleplerine erişebilmesi, admin durum geçiş kuralları gibi tüm domain kuralları burada işletilir.

3. **Repositories**:
   - Veri erişim mantığını soyutlar.
   - Sayfalama (Pagination), sıralama (Sorting), filtreleme (Filtering) ve ilişkisel varlıkların yüklenmesi (`Include`) işlemlerini yürütür.

4. **DTO (Data Transfer Object) Yaklaşımı**:
   - Veritabanı entity'leri asla doğrudan istemciye açılmaz.
   - Over-posting ve Under-posting riskleri DTO modelleri ile tamamen engellenmiştir.

5. **Soft Delete & Audit Interceptor**:
   - Silinen kayıtlar fiziksel olarak silinmez; `IsDeleted = true`, `DeletedAt` ve `DeletedBy` alanları doldurulur.
   - EF Core `Global Query Filter` sayesinde silinmiş kayıtlar varsayılan olarak tüm sorgulardan gizlenir.
   - `AuditableEntitySaveChangesInterceptor` ile her ekleme/güncelleme işleminde audit alanları otomatik set edilir.

---

## 📁 Proje Klasör Yapısı

```text
ticket-management-system/
├── backend/
│   ├── Controllers/             # REST API Controller sınıfları
│   ├── Data/                    # AppDbContext, Seed ve Migration dosyaları
│   ├── DTOs/                    # Request/Response veri transfer nesneleri
│   ├── Entities/                # Veritabanı entity modelleri
│   ├── Enums/                   # Rol, Bilet Durumu ve Öncelik enum'ları
│   ├── Extensions/              # ServiceCollection ve Middleware konfigürasyon eklentileri
│   ├── Interceptors/            # EF Core SaveChanges audit interceptor'ı
│   ├── Middlewares/             # Global Exception Handling ve Security header'ları
│   ├── Repositories/            # Veri erişim arayüzleri ve EF Core implementasyonları
│   ├── Services/                # İş mantığı servis arayüzleri ve implementasyonları
│   ├── Dockerfile               # Backend çok aşamalı Dockerfile (.NET SDK + Runtime)
│   ├── Program.cs               # Uygulama başlangıç ve DI yapılandırması
│   └── backend.csproj           # Proje bağımlılıkları ve konfigürasyonu
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios istemcisi ve API endpoint fonksiyonları
│   │   ├── components/          # Ortak UI bileşenleri (Navbar, Modal, Toast vb.)
│   │   ├── context/             # AuthContext ve global oturum yönetimi
│   │   ├── pages/               # Sayfa bileşenleri (Login, Tickets, Detail, Admin vb.)
│   │   ├── types/               # TypeScript tip tanımları ve arayüzler
│   │   ├── App.tsx              # Ana yönlendirme ve Route Guard bileşeni
│   │   └── main.tsx             # React DOM kök başlangıç noktası
│   ├── nginx.conf               # SPA routing ve /api reverse proxy konfigürasyonu
│   ├── Dockerfile               # Frontend çok aşamalı Dockerfile (Node derleme + Nginx)
│   ├── package.json             # Frontend kütüphane bağımlılıkları
│   └── vite.config.ts           # Vite ve Tailwind yapılandırması
│
├── docker-compose.yml           # Çoklu servis orkestrasyonu (Postgres, Backend, Frontend)
├── .env.example                 # Örnek ortam değişkenleri şablonu
├── .gitignore                   # Git yoksayma listesi
├── TODO.md                      # Faz bazlı geliştirme takip listesi
└── README.md                    # Proje ana dokümantasyonu
```

---

## 🚀 Docker ile Hızlı Kurulum ve Çalıştırma

### 1. Gereksinimler
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (veya Docker Engine + Docker Compose eklentisi)
- Terminal / Komut Satırı

### 2. Kurulum Adımları

1. **Depoyu klonlayın veya proje dizinine gidin:**
   ```bash
   cd /path/to/ticket-management-system
   ```

2. **Ortam değişkenleri dosyasını oluşturun:**
   ```bash
   cp .env.example .env
   ```

3. **Konteynerleri derleyin ve arka planda başlatın:**
   ```bash
   docker compose up --build -d
   ```

4. **Konteynerlerin durumunu kontrol edin:**
   ```bash
   docker compose ps
   ```

5. **Konteynerleri durdurmak için:**
   ```bash
   docker compose down
   ```

---

## ⚙️ Ortam Değişkenleri (.env)

| Değişken Adı | Varsayılan Değer | Açıklama |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `ticket_management_db` | PostgreSQL veritabanı adı |
| `POSTGRES_USER` | `postgres` | Veritabanı yönetici kullanıcısı |
| `POSTGRES_PASSWORD` | `SuperSecretPostgresPassword123!` | Veritabanı yönetici parolası |
| `POSTGRES_PORT` | `5432` | Host makinede açılacak PostgreSQL portu |
| `ADMIN_USERNAME` | `admin` | Otomatik tohumlanan ilk Admin kullanıcı adı |
| `ADMIN_TEMP_PASSWORD`| `AdminTempPassword123!` | İlk Admin hesabı için geçici parola |
| `JWT_SECRET_KEY` | *(32+ karakter uzun gizli anahtar)* | JWT token imzalama simetrik anahtarı |
| `JWT_ISSUER` | `TicketManagementApi` | JWT Issuer (Veren) değeri |
| `JWT_AUDIENCE` | `TicketManagementClient` | JWT Audience (Hedef) değeri |
| `JWT_ACCESS_TOKEN_EXPIRATION_MINUTES` | `15` | Access Token geçerlilik süresi (dakika) |
| `JWT_REFRESH_TOKEN_EXPIRATION_DAYS` | `7` | Refresh Token geçerlilik süresi (gün) |
| `PORT_BACKEND` | `5001` | Host makinede açılacak Backend API portu |
| `PORT_FRONTEND` | `3000` | Host makinede açılacak Frontend web portu |

---

## 👤 İlk Admin Hesabı ve Tohumlama (Seeding)

- **Kullanıcı Adı:** `.env` dosyasındaki `ADMIN_USERNAME` değeri (Varsayılan: `admin`)
- **Geçici Parola:** `.env` dosyasındaki `ADMIN_TEMP_PASSWORD` değeri (Varsayılan: `AdminTempPassword123!` veya sistem default'u `Admin123!`)
- **Zorunlu Parola Değişikliği:** Tohumlanan ilk admin kullanıcısının `MustChangePassword` bayrağı `true` olarak oluşturulur. Admin sisteme ilk kez giriş yaptığında doğrudan `/change-password` ekranına yönlendirilir ve parolasını değiştirmeden menülere erişemez.
- **Kategoriler:** `Yazılım`, `Donanım`, `Ağ / Altyapı`, `Erişim & Yetkilendirme` varsayılan olarak tohumlanır.

---

## 🗄 Veritabanı Migration ve Tohumlama Stratejisi

- **Otomatik Uygulama:** Backend konteyneri her başlatıldığında `app.ApplyMigrationsAsync()` metodu çalıştırılır. Bekleyen EF Core migration'ları veritabanına otomatik uygulanır.
- **Hazır Olma Kontrolü:** `docker-compose.yml` dosyasında PostgreSQL için `pg_isready` kontrolü tanımlıdır. Backend yalnızca PostgreSQL hazır olduğunda (`service_healthy`) başlatılır.

---

## 🌐 Erişim Adresleri ve Portlar

| Servis | Adres | Açıklama |
| :--- | :--- | :--- |
| **Frontend Web Uygulaması** | [http://localhost:3000](http://localhost:3000) | Kullanıcı ve Admin web arayüzü |
| **Backend API Kök** | [http://localhost:5001](http://localhost:5001) | RESTful API doğrudan erişim portu |
| **Swagger UI Dokümantasyonu** | [http://localhost:5001/swagger](http://localhost:5001/swagger) | İnteraktif API test arayüzü |
| **PostgreSQL Veritabanı** | `localhost:5432` | Doğrudan veritabanı bağlantısı |

---

## 🔒 Güvenlik ve Kimlik Doğrulama Mimarisi

### JWT ve HttpOnly Cookie Yaklaşımı
- Token'lar `localStorage` veya `sessionStorage` gibi XSS saldırılarına açık alanlarda tutulmaz.
- `HttpOnly`, `SameSite=Lax` ve dinamik `Secure` bayraklarına sahip çerezler olarak saklanır.
- **Dinamik Secure Cookie Desteği:** `Request.IsHttps || X-Forwarded-Proto: https` denetlenerek hem yerel testlerde (HTTP localhost) oturum düşmesi engellenir hem de canlı TLS ortamlarında zorunlu kılınır.

### Refresh Token Rotasyonu (RTR)
- Her refresh token tek kullanımlıktır (`Single-Use`).
- Token'lar veritabanında `SHA-256` hash formatında saklanır.
- Kullanılmış/iptal edilmiş bir refresh token ile tekrar istek gelirse sistem token hırsızlığı algılar ve kullanıcının **tüm token ailesini (tüm oturumlarını)** iptal eder.

### CSRF Koruması
- Durum değiştiren istekler (`POST`, `PUT`, `PATCH`, `DELETE`) için Double Submit Cookie / Antiforgery Token deseni uygulanır.
- Axios interceptor'ı isteklere `X-XSRF-TOKEN` başlığını otomatik ekler. Eksik/hatalı token'lar `400 Bad Request` ile reddedilir.

### Anında Oturum İptali (Session Invalidation)
- Kullanıcı entity'sindeki `SessionVersion` (Security Stamp) GUID değeri JWT claim'i olarak tutulur.
- Parola değiştirildiğinde, parola sıfırlandığında veya kullanıcı pasife alındığında `SessionVersion` yenilenir ve mevcut tüm JWT'ler anında geçersiz hale gelir.

### Token Süreleri ve Seçim Gerekçeleri
- **Access Token (15 Dakika):** Olası sızıntılarda saldırganın elinde kalma süresini en aza indirir. Arka planda sessizce yenilendiği için kullanıcı deneyimini etkilemez.
- **Refresh Token (7 Gün):** Kullanıcının her gün tekrar şifre girmesini önler. RTR ve anında oturum iptali ile güvenli tutulur.

---

## 👥 Roller ve Yetkilendirme Kuralları

- **Kullanıcı (`User`):** Destek talebi açabilir, yalnızca kendi taleplerini ve yorumlarını görebilir, yorum ekleyebilir. Kendi talebini düzenleyemez veya silemez.
- **Yönetici (`Admin`):** Tüm talepleri ve yorumları görür, durum geçişlerini yönetir, soft delete yapabilir, kategori ve kullanıcı yönetimi yapabilir. Admin destek talebi oluşturamaz.

---

## 🧪 Manuel Doğrulama ve Test Senaryoları

| # | Senaryo | Beklenen Davranış | Durum |
| :-: | :--- | :--- | :-: |
| **1** | İlk admin login & zorunlu parola değişikliği | Admin geçici parola ile girer, zorunlu şifre değiştirme ekranına düşer. Şifre değişmeden menülere erişemez. | ✅ Başarılı |
| **2** | Admin yeni kullanıcı oluşturma | Admin panelinden geçici parolalı yeni kullanıcı tanımlanır. | ✅ Başarılı |
| **3** | Yeni kullanıcının ilk girişi | Kullanıcı ilk girişinde parola değiştirmeden uygulamaya devam edemez. | ✅ Başarılı |
| **4** | Kullanıcı talep oluşturma & izolasyon | Kullanıcı talep açar; yalnızca kendi açtığı talepleri listeler. | ✅ Başarılı |
| **5** | Başka kullanıcının talebine doğrudan erişim | Kullanıcı URL üzerinden başka talebin ID'sini yazarsa backend isteği engeller (403/404). | ✅ Başarılı |
| **6** | Talep değiştirilemezliği | Kullanıcının kendi talebini düzenleme veya silme yetkisi yoktur. | ✅ Başarılı |
| **7** | Admin talep durum geçişleri | Admin tüm talepleri görür ve geçerli adımlarla durum geçişlerini uygular. | ✅ Başarılı |
| **8** | Geçersiz durum geçişi engeli | Backend kural dışı durum geçişini (örn: Closed -> Open) `400 Bad Request` ile reddeder. | ✅ Başarılı |
| **9** | Talep yorumlaşma | User kendi talebine, Admin tüm taleplere yorum ekleyebilir. | ✅ Başarılı |
| **10** | Admin soft delete | Admin talep veya yorumu sildiğinde arayüzden kaybolur; DB'de `IsDeleted=true` işaretlenir. | ✅ Başarılı |
| **11** | Arama, filtreleme, sayfalama | Kategori, durum, öncelik filtreleri ve metin araması sayfalama ile uyumlu çalışır. | ✅ Başarılı |
| **12** | CSRF Token koruması | `X-XSRF-TOKEN` başlığı olmadan atılan mutasyon istekleri `400 Bad Request` alır. | ✅ Başarılı |
| **13** | Sessiz token yenileme (Refresh) | Access token süresi dolduğunda Axios arka planda refresh yaparak oturumu sürdürür. | ✅ Başarılı |
| **14** | RTR & Replay attack tespiti | Kullanılmış eski refresh token ile istek yapıldığında kullanıcının tüm oturumları iptal edilir. | ✅ Başarılı |
| **15** | Çıkış yapma (Logout) | Çıkış yapıldığında çerezler temizlenir ve token DB'de iptal edilir. | ✅ Başarılı |
| **16** | Admin parola sıfırlama & oturum düşürme | Admin bir kullanıcının şifresini sıfırladığında açık tüm oturumlar anında düşer. | ✅ Başarılı |
| **17** | Pasif kullanıcı engelleme | Pasife alınan kullanıcı giriş yapamaz, token yenileyemez ve mevcut token'ı geçersiz kalır. | ✅ Başarılı |
| **18** | Yetki hata kodları (401/403) | Giriş yapmamış istekler `401 Unauthorized`, yetkisiz kaynak istekleri `403 Forbidden` alır. | ✅ Başarılı |
| **19** | Docker Compose orkestrasyonu | `docker compose up --build` ile üç servis (DB, Backend, Frontend) birlikte açılır. | ✅ Başarılı |

---

## 📌 Bilinen Sınırlar ve Kapsam Dışı Konular

1. **Halka Açık Kayıt (Public Registration):** Kullanıcı hesapları güvenlik gereği yalnızca Admin tarafından oluşturulabilir.
2. **E-posta ile Parola Sıfırlama:** Harici SMTP yerine kurumsal model gereği geçici parola atama yöntemi uygulanmıştır.
3. **Dosya Eki (Attachment) Yükleme:** Yalnızca metin tabanlı iletişim desteklenmektedir.
4. **Gerçek Zamanlı Bildirimler (WebSocket / SignalR):** HTTP tabanlı reaktif sorgulama (TanStack Query) kullanılmıştır.
5. **Kalıcı Fiziksel Silme (Hard Delete):** Denetim izi için tüm silmeler soft delete olarak gerçekleştirilir.

---
---

# 🇬🇧 English

A modern, enterprise-grade web application where users can create support tickets and add comments, while administrators (Admins) manage tickets according to a strict state machine, manage categories, and administer user accounts.

The system features an **N-Tier ASP.NET Core Web API** backend, a modern **React 19 + TypeScript + Vite + Tailwind CSS** frontend, and a **PostgreSQL** database, fully containerized and orchestrated via **Docker Compose**.

---

## 📑 Table of Contents
1. [Technologies Used & Architectural Rationale](#-technologies-used--architectural-rationale)
2. [System Architecture & Layers](#-system-architecture--layers)
3. [Project Directory Structure](#-project-directory-structure)
4. [Quick Start with Docker Compose](#-quick-start-with-docker-compose)
5. [Environment Variables (.env)](#-environment-variables-env)
6. [Initial Admin Account & Seeding](#-initial-admin-account--seeding)
7. [Database Migration & Seeding Strategy](#-database-migration--seeding-strategy)
8. [Service Endpoints & Port Mappings](#-service-endpoints--port-mappings)
9. [Security & Authentication Architecture](#-security--authentication-architecture)
   - [JWT in HttpOnly Cookies](#jwt-in-httponly-cookies)
   - [Refresh Token Rotation (RTR)](#refresh-token-rotation-rtr-1)
   - [CSRF Protection](#csrf-protection)
   - [Immediate Session Invalidation](#immediate-session-invalidation)
   - [Token Lifespans & Security Justifications](#token-lifespans--security-justifications)
10. [Roles & Authorization Rules](#-roles--authorization-rules)
11. [Manual Verification & Test Scenarios](#-manual-verification--test-scenarios)
12. [Known Limitations & Deliberate Scope Exclusions](#-known-limitations--deliberate-scope-exclusions)

---

## 🛠 Technologies Used & Architectural Rationale

### Backend
| Technology | Version | Rationale |
| :--- | :--- | :--- |
| **.NET / ASP.NET Core** | 10.0 (Preview) | High performance, native DI container, robust middleware pipeline, and strong type safety. |
| **Entity Framework Core** | 10.0 | Code-First migrations, automated schema synchronization, Global Query Filters (Soft Delete), and Interceptors. |
| **PostgreSQL** | 16-Alpine | Industry-proven reliability, ACID compliance, advanced indexing capabilities, and open-source ecosystem. |
| **BCrypt.Net-Next** | 4.0.3 | Secure one-way password hashing (work factor: 11) providing strong brute-force resistance. |
| **Swagger / OpenAPI** | Swashbuckle | Interactive API exploration, documentation, and OpenAPI 3.0 specification generation. |

### Frontend
| Technology | Version | Rationale |
| :--- | :--- | :--- |
| **React** | 19.x | Modern component-based declarative UI development. |
| **TypeScript** | 5.x | Compile-time type safety, developer ergonomics, self-documenting code, and safe refactoring. |
| **Vite** | 6.x | Lightning-fast Hot Module Replacement (HMR) and optimized Rollup-based production builds. |
| **Tailwind CSS** | 4.x | Utility-first styling, zero-runtime overhead, modern aesthetics, and responsive layout primitives. |
| **Lucide React** | - | Consistent, lightweight, accessible SVG icon set. |
| **TanStack Query** | 5.x | Server-state management, intelligent cache invalidation, and seamless background data refetching. |
| **Axios** | 1.x | Automatic cookie credential forwarding (`withCredentials: true`), request/response interceptors, and 401 refresh queue. |

### Deployment & Infrastructure
| Component | Details |
| :--- | :--- |
| **Docker & Docker Compose** | Multi-stage Docker builds ensuring minimal image sizes, reproducible environments, and single-command orchestration. |
| **Nginx (Alpine)** | Static SPA file delivery (`try_files`) and internal reverse proxying for `/api/` traffic. |

---

## 🏛 System Architecture & Layers

The solution strictly adheres to **N-Tier Layered Architecture** with distinct separation of concerns:

```text
[ React 19 Frontend (Port 3000) ]
              │ (HTTP / JSON / HttpOnly Cookies)
              ▼
    [ Nginx Reverse Proxy ]
              │ /api/* proxy pass
              ▼
┌─────────────────────────────────────────────────────────┐
│                      BACKEND API                        │
│                                                         │
│  [ Controllers ]      -> HTTP Request/Response handling,│
│          │               DTO validation, HTTP status    │
│          ▼                                              │
│  [ Services ]         -> Business logic, Authorization  │
│          │               checks, State machines,        │
│          │               Domain invariants              │
│          ▼                                              │
│  [ Repositories ]     -> EF Core abstraction, CRUD,     │
│          │               Pagination, Sorting, Eager load│
│          ▼                                              │
│  [ DataContext & DB ] -> Interceptors (Audit), Global   │
│                          Query Filters (Soft Delete)    │
└─────────────────────────────────────────────────────────┘
              │
              ▼
   [ PostgreSQL 16 Database ]
```

### Layer Responsibilities

1. **Controllers**:
   - Receive HTTP requests, validate input contracts, and delegate to domain services.
   - Do not perform direct database operations or hold business logic.
   - Return clean DTOs with standardized HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).

2. **Services**:
   - Encapsulate business logic, workflow execution, and ticket state transitions.
   - Enforce domain rules (e.g., standard users can only read/comment on their own tickets, closed tickets cannot be reopened arbitrarily).

3. **Repositories**:
   - Abstract data access details away from business logic.
   - Handle dynamic sorting, filtering, pagination, and relational loading (`Include`).

4. **DTO (Data Transfer Object) Pattern**:
   - Domain entities are never exposed directly to the client, guarding against over-posting and under-posting vulnerabilities.

5. **Soft Delete & Audit Interceptor**:
   - Soft-deleted entities retain audit history with `IsDeleted = true`, `DeletedAt`, and `DeletedBy`.
   - EF Core `Global Query Filters` transparently filter out deleted records across all standard queries.
   - `AuditableEntitySaveChangesInterceptor` populates timestamps and actor IDs automatically upon every `SaveChanges` call.

---

## 📁 Project Directory Structure

```text
ticket-management-system/
├── backend/
│   ├── Controllers/             # API Controllers (Auth, Ticket, User, Category, Csrf)
│   ├── Data/                    # AppDbContext, Seeders, and EF Core Migrations
│   ├── DTOs/                    # Request/Response Data Transfer Objects
│   ├── Entities/                # Database entities (User, Ticket, Comment, Category, RefreshToken)
│   ├── Enums/                   # Role, TicketStatus, and Priority enumerations
│   ├── Extensions/              # DI and Middleware configuration extensions
│   ├── Interceptors/            # EF Core SaveChanges audit interceptor
│   ├── Middlewares/             # Global exception handling and security headers
│   ├── Repositories/            # Repository interfaces and EF Core implementations
│   ├── Services/                # Business service interfaces and implementations
│   ├── Dockerfile               # Multi-stage backend build (.NET 10 SDK + ASP.NET Runtime)
│   ├── Program.cs               # Host configuration and pipeline setup
│   └── backend.csproj           # NuGet dependencies and build settings
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Axios client, interceptors, and API caller functions
│   │   ├── components/          # Reusable UI components (Navbar, Modals, Toasts)
│   │   ├── context/             # AuthContext and state management
│   │   ├── pages/               # Views (Login, TicketList, TicketDetail, Admin panels)
│   │   ├── types/               # TypeScript interfaces and type definitions
│   │   ├── App.tsx              # Routing and ProtectedRoute guards
│   │   └── main.tsx             # Application bootstrap
│   ├── nginx.conf               # SPA routing and /api reverse proxy configuration
│   ├── Dockerfile               # Multi-stage frontend build (Node build + Nginx Alpine)
│   ├── package.json             # NPM package declarations
│   └── vite.config.ts           # Vite and Tailwind CSS plugins configuration
│
├── docker-compose.yml           # Multi-container orchestration
├── .env.example                 # Environment configuration blueprint
├── .gitignore                   # Git ignore specifications
├── TODO.md                      # Phase-based development tracker
└── README.md                    # Project documentation
```

---

## 🚀 Quick Start with Docker Compose

### 1. Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (or Docker Engine with Compose plugin)
- A terminal / command-line shell

### 2. Execution Steps

1. **Clone or navigate into the repository root:**
   ```bash
   cd /path/to/ticket-management-system
   ```

2. **Generate your local `.env` file:**
   ```bash
   cp .env.example .env
   ```

3. **Build and start all services:**
   ```bash
   docker compose up --build -d
   ```

4. **Verify container health:**
   ```bash
   docker compose ps
   ```
   All 3 services (`ticket_system_postgres`, `ticket_system_backend`, `ticket_system_frontend`) should report healthy/running status.

5. **Stop services when finished:**
   ```bash
   docker compose down
   ```
   *(To wipe volumes and start from clean database: `docker compose down -v`)*

---

## ⚙️ Environment Variables (.env)

| Key | Default Value | Description |
| :--- | :--- | :--- |
| `POSTGRES_DB` | `ticket_management_db` | PostgreSQL database name |
| `POSTGRES_USER` | `postgres` | Database administrator user |
| `POSTGRES_PASSWORD` | `SuperSecretPostgresPassword123!` | Database password |
| `POSTGRES_PORT` | `5432` | Exposed PostgreSQL port on host |
| `ADMIN_USERNAME` | `admin` | Username for the seeded initial Admin account |
| `ADMIN_TEMP_PASSWORD`| `AdminTempPassword123!` | Temporary initial password for seeded Admin |
| `JWT_SECRET_KEY` | *(32+ characters long string)* | HMAC-SHA256 signing secret key |
| `JWT_ISSUER` | `TicketManagementApi` | Expected JWT Issuer claim |
| `JWT_AUDIENCE` | `TicketManagementClient` | Expected JWT Audience claim |
| `JWT_ACCESS_TOKEN_EXPIRATION_MINUTES` | `15` | Lifetime of JWT Access Token (minutes) |
| `JWT_REFRESH_TOKEN_EXPIRATION_DAYS` | `7` | Lifetime of Refresh Token (days) |
| `PORT_BACKEND` | `5001` | Host port mapped to Backend API |
| `PORT_FRONTEND` | `3000` | Host port mapped to Frontend Web UI |

---

## 👤 Initial Admin Account & Seeding

- **Username:** Value of `ADMIN_USERNAME` in `.env` (Default: `admin`)
- **Temporary Password:** Value of `ADMIN_TEMP_PASSWORD` in `.env` (Default: `AdminTempPassword123!` or fallback `Admin123!`)
- **Mandatory Password Change:** The seeded admin account is initialized with `MustChangePassword = true`. Upon first login, the application redirects the user directly to `/change-password`. No other functionality can be accessed until a new password is set.
- **Pre-seeded Categories:** 4 base categories are automatically created: `Yazılım` (Software), `Donanım` (Hardware), `Ağ / Altyapı` (Network / Infrastructure), and `Erişim & Yetkilendirme` (Access & Authorization).

---

## 🗄 Database Migration & Seeding Strategy

- **Zero-Touch Automated Migrations:** On container startup, the backend invokes `app.ApplyMigrationsAsync()`, which automatically executes `Database.MigrateAsync()` to bring the database schema to the latest state.
- **Readiness Healthchecks:** The backend container depends on PostgreSQL's health condition (`condition: service_healthy`), verified via `pg_isready`.

---

## 🌐 Service Endpoints & Port Mappings

| Service | URL | Description |
| :--- | :--- | :--- |
| **Frontend Web Application** | [http://localhost:3000](http://localhost:3000) | Main user and administrator UI |
| **Backend API Root** | [http://localhost:5001](http://localhost:5001) | Direct RESTful API port |
| **Swagger UI Documentation** | [http://localhost:5001/swagger](http://localhost:5001/swagger) | Interactive API documentation |
| **PostgreSQL Database** | `localhost:5432` | Database direct connection |

---

## 🔒 Security & Authentication Architecture

### JWT in HttpOnly Cookies
- Tokens are never exposed to browser storage (`localStorage` / `sessionStorage`), eliminating token theft via Cross-Site Scripting (XSS).
- Both `access_token` and `refresh_token` are transmitted as `HttpOnly`, `SameSite=Lax` cookies.
- **Dynamic Secure Cookie Flag:** The cookie builder checks `Request.IsHttps || X-Forwarded-Proto == "https"`, ensuring cookies are accepted over plain HTTP during local development while strictly requiring HTTPS in production.

### Refresh Token Rotation (RTR)
- Each refresh token is strictly **single-use**.
- Tokens are stored hashed using **SHA-256** in the database.
- **Replay Attack Detection:** If an already consumed or revoked refresh token is presented, the system flags a potential theft and revokes the user's entire active token family.

### CSRF Protection
- Implements the Double-Submit Cookie pattern for all state-changing HTTP verbs (`POST`, `PUT`, `PATCH`, `DELETE`).
- Frontend fetches the Antiforgery cookie and token via `GET /api/csrf/token` and attaches the `X-XSRF-TOKEN` header on modifying requests. Requests lacking valid CSRF verification fail with `400 Bad Request`.

### Immediate Session Invalidation
- Each user record contains a `SessionVersion` (Security Stamp) GUID, embedded into JWT claims.
- The JWT middleware's `OnTokenValidated` event inspects this claim against the database.
- When an admin resets a password, or a user changes their password, or an account is deactivated, `SessionVersion` is regenerated, immediately invalidating all active JWTs on the very next request.

### Token Lifespans & Security Justifications
- **Access Token (15 Minutes):** Short lifespan minimizes the window of opportunity if a token is intercepted. Silent background refresh via Axios interceptors ensures zero UX friction.
- **Refresh Token (7 Days):** Provides a seamless user experience without requiring daily logins. Security is maintained through RTR and immediate session invalidation.

---

## 👥 Roles & Authorization Rules

- **User (`User`):** Can create tickets, view exclusively their own tickets, and add comments to their own tickets. Cannot edit or delete tickets once created.
- **Admin (`Admin`):** Can view all tickets and comments across the system, transition ticket states, soft-delete tickets and comments, and manage categories and user accounts. Admins cannot create tickets.

---

## 🧪 Manual Verification & Test Scenarios

| # | Scenario | Expected Behavior | Status |
| :-: | :--- | :--- | :-: |
| **1** | Initial admin login & mandatory password change | Admin logs in with temporary password, is forced to `/change-password`, cannot navigate elsewhere until changed. | ✅ Passed |
| **2** | Admin user creation | Admin creates a new user with a temporary password from Admin panel. | ✅ Passed |
| **3** | New user first login | User is forced to change temporary password before accessing the system. | ✅ Passed |
| **4** | User ticket creation & isolation | User creates ticket; can only list and see their own tickets. | ✅ Passed |
| **5** | Direct ID access to another user's ticket | Attempting to access another user's ticket ID returns 403 or 404. | ✅ Passed |
| **6** | Ticket immutability for users | Users have no capability or endpoints to edit or delete submitted tickets. | ✅ Passed |
| **7** | Admin ticket state transitions | Admin views all tickets and executes valid transitions according to state machine. | ✅ Passed |
| **8** | Invalid state transition prevention | Backend blocks invalid transitions (e.g., Closed -> Open) with `400 Bad Request`. | ✅ Passed |
| **9** | Commenting workflow | Users can comment on their own tickets; Admins can comment on all tickets. | ✅ Passed |
| **10** | Admin soft delete | Soft-deleted tickets and comments disappear from UI; DB records mark `IsDeleted = true`. | ✅ Passed |
| **11** | Search, filter, and pagination | Category, status, priority filters, and search queries work cohesively with pagination. | ✅ Passed |
| **12** | CSRF Token enforcement | State-changing requests lacking `X-XSRF-TOKEN` are rejected with `400 Bad Request`. | ✅ Passed |
| **13** | Silent token refresh | Upon access token expiration, Axios interceptor transparently refreshes session. | ✅ Passed |
| **14** | RTR & Replay detection | Re-using an expired/consumed refresh token revokes all user sessions immediately. | ✅ Passed |
| **15** | Logout invalidation | Logging out removes cookies and marks tokens as revoked in the database. | ✅ Passed |
| **16** | Admin password reset & session drop | Admin resetting a user's password immediately invalidates all active sessions for that user. | ✅ Passed |
| **17** | Deactivated user enforcement | Deactivated users cannot log in, cannot refresh tokens, and active tokens fail immediately. | ✅ Passed |
| **18** | Proper HTTP status codes | Unauthenticated requests receive 401; unauthorized resource access receives 403. | ✅ Passed |
| **19** | Docker Compose orchestration | `docker compose up --build` brings up DB, Backend, and Frontend without manual intervention. | ✅ Passed |

---

## 📌 Known Limitations & Deliberate Scope Exclusions

1. **Public Registration:** User registration is intentionally restricted to Admins to align with corporate internal support helpdesk scenarios.
2. **Email Password Reset:** Password resets are performed by Admins with temporary credentials; external SMTP integration is omitted.
3. **File Attachments:** The system supports rich textual communications; binary file attachments are excluded by design.
4. **Real-Time WebSockets:** Uses reactive TanStack Query cache invalidation instead of persistent WebSocket/SignalR connections.
5. **Physical Hard Deletion:** All delete operations are strictly soft deletes to preserve auditability and data integrity.
