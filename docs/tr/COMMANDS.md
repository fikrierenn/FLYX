# FLYX Platform - Komutlar ve Script'ler

---

## 1. Gereksinimler

```bash
Node.js >= 20.x
npm >= 11.x
```

---

## 2. Ilk Kurulum

```bash
# Repo klonla
git clone <repo-url>
cd FLYX

# Bagimliliklari yukle (tum workspace'ler dahil)
npm install

# Tum paketleri derle
npx turbo run build
```

---

## 3. Root Script'ler (package.json)

| Komut | Aciklama |
|---|---|
| `npm run build` | Tum paketleri derle (`turbo run build`) |
| `npm run dev` | Tum dev server'lari baslat (`turbo run dev --parallel`) |
| `npm run test` | Tum testleri calistir (`turbo run test`) |
| `npm run test:all` | Tum testleri calistir (alias) |
| `npm run build:all` | Tum paketleri derle (alias) |
| `npm run lint` | Tum paketlerde lint calistir |
| `npm run format` | Prettier ile kod formatla |

---

## 4. Turborepo Komutlari

### 4.1 Tum Paketlerde Build

```bash
npx turbo run build
```

Cikti:
```
Packages in scope: @flyx/api, @flyx/database-engine, @flyx/fsl-compiler,
                   @flyx/platform-core, @flyx/runtime-engine, @flyx/web
Running build in 6 packages

@flyx/fsl-compiler:build → tsc
@flyx/database-engine:build → tsc  (fsl-compiler'a bagimli)
@flyx/runtime-engine:build → tsc
@flyx/platform-core:build → tsc
@flyx/api:build → tsc
@flyx/web:build → vite build

Tasks: 6 successful, 6 total
```

### 4.2 Tek Paket Build

```bash
# Sadece fsl-compiler (ve bagimliliklari)
npx turbo run build --filter=@flyx/fsl-compiler

# Sadece web app (ve bagimliliklari)
npx turbo run build --filter=@flyx/web

# Sadece API (ve bagimliliklari)
npx turbo run build --filter=@flyx/api
```

### 4.3 Cache Atlama (Temiz Build)

```bash
npx turbo run build --force
```

---

## 5. Test Komutlari

### 5.1 Tum Testler

```bash
npx turbo run test
```

### 5.2 Tek Paket Testi

```bash
# FSL Compiler testleri (17 test)
cd packages/fsl-compiler
npx vitest run

# Database Engine testleri (8 test)
cd packages/database-engine
npx vitest run
```

### 5.3 Watch Mode

```bash
cd packages/fsl-compiler
npx vitest        # Degisikliklerde otomatik calistir
```

### 5.4 Belirli Test Dosyasi

```bash
cd packages/fsl-compiler
npx vitest run tests/compiler.test.ts
```

---

## 6. Gelistirme (Development)

### 6.1 Web App Dev Server

```bash
# Yontem 1: Root'tan
npm run dev

# Yontem 2: Dogrudan
cd apps/web
npx vite
```

Vite dev server `http://localhost:5173` adresinde baslar.

### 6.2 API Dev Server

```bash
cd apps/api
npm run start:dev
```

NestJS API `http://localhost:3000` adresinde baslar.

### 6.3 Paralel Gelistirme

```bash
# Root'tan tum dev server'lar
npm run dev
# Bu komut turbo run dev --parallel calistirir
# Web (5173) + API (3000) ayni anda baslar
```

---

## 7. Paket Bazli Script'ler

### 7.1 @flyx/fsl-compiler

| Komut | Aciklama |
|---|---|
| `npm run build` | TypeScript → JavaScript derle (`tsc`) |
| `npm run dev` | Watch mode ile derle (`tsc --watch`) |
| `npm run test` | Vitest testlerini calistir |
| `npm run test:watch` | Watch mode ile test |

### 7.2 @flyx/database-engine

| Komut | Aciklama |
|---|---|
| `npm run build` | TypeScript → JavaScript derle |
| `npm run dev` | Watch mode |
| `npm run test` | Schema generator testleri |

### 7.3 @flyx/api (NestJS)

| Komut | Aciklama |
|---|---|
| `npm run build` | TypeScript → JavaScript derle |
| `npm run dev` | Watch mode |
| `npm run start` | Production server baslat |
| `npm run start:dev` | Development server (ts-node) |

### 7.4 @flyx/web (React + Vite)

| Komut | Aciklama |
|---|---|
| `npm run build` | Production build (vite build) |
| `npm run dev` | Dev server baslat (vite) |
| `npm run preview` | Production build'i onizle |

---

## 8. Kod Kalitesi

### 8.1 Formatlama

```bash
# Tum dosyalari formatla
npm run format

# Kontrol et (degistirmeden)
npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"
```

### 8.2 Lint

```bash
npx turbo run lint
```

---

## 9. Build Ciktilari

Her paketin build ciktisi `dist/` dizininde olusur:

```
packages/fsl-compiler/dist/
  ├── index.js          # Ana modul
  ├── index.d.ts        # TypeScript type'lar
  ├── compiler.js
  ├── errors.js
  ├── lexer/
  │   ├── tokens.js
  │   └── lexer.js
  ├── parser/
  │   ├── parser.js
  │   └── cst-visitor.js
  └── ast/
      └── nodes.js

apps/web/dist/
  ├── index.html
  └── assets/
      ├── index-XXXXX.js    # ~445 KB (bundled)
      └── index-XXXXX.css   # ~14 KB
```

---

## 10. Swagger API Dokumantasyonu

API calisirken `http://localhost:3000/api/docs` adresinden Swagger UI'a erisebilirsiniz.

Swagger sema otomatik olarak NestJS decorator'larindan uretilir:
- `@ApiTags()` - Endpoint gruplama
- `@ApiOperation()` - Endpoint aciklamasi
- `@ApiBearerAuth()` - JWT auth

---

## 11. Hizli Referans

```bash
# Kurulum
npm install

# Build (tum paketler)
npx turbo run build

# Test (tum paketler)
npx turbo run test

# Dev server (web + api)
npm run dev

# Tek paket build
npx turbo run build --filter=@flyx/fsl-compiler

# Tek paket test
cd packages/fsl-compiler && npx vitest run

# Temiz build (cache'siz)
npx turbo run build --force

# Kod formatlama
npm run format
```
