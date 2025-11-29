# FitTable

AI 기반 맛집 추천 서비스

## 1. 간략한 설명

FitTable은 사용자의 검색 의도를 AI가 이해하여 적합한 맛집을 추천하는 웹 애플리케이션입니다. 자연어 검색어를 입력하면 AI가 의도를 분석하고, 카카오 로컬 API와 연동하여 실제 맛집 정보를 검색합니다. 검색 결과는 지도와 카드 형태로 제공되며, 각 맛집에 대한 AI 추천 코멘트를 확인할 수 있습니다.

### 주요 기능

- 🤖 **AI 기반 검색어 분석**: 자연어 검색어를 AI가 이해하여 위치, 음식 종류, 분위기 등을 추출
- 📍 **위치 기반 검색**: 현재 위치 또는 검색어에서 추출된 위치를 기반으로 맛집 검색
- 🗺️ **인터랙티브 지도**: 카카오맵을 활용한 지도에서 맛집 위치 확인 및 상세 정보 확인
- 🎨 **다크 모드 지원**: 시스템 설정에 따른 자동 테마 전환
- 📱 **반응형 디자인**: 모바일, 태블릿, 데스크톱 등 다양한 화면 크기 지원
- 🎬 **홍보 영상**: 로고 클릭 시 홍보 영상 팝업

## 2. 구조

```
FitTable/
├── front-end/                 # 프론트엔드 (React + Vite)
│   ├── src/
│   │   ├── components/        # 재사용 가능한 컴포넌트
│   │   │   ├── HeroSection.jsx      # 메인 검색 섹션
│   │   │   ├── MapSection.jsx       # 카카오맵 지도
│   │   │   ├── ResultCards.jsx      # 맛집 결과 카드
│   │   │   ├── SettingsModal.jsx    # 설정 모달
│   │   │   └── VideoModal.jsx       # 홍보 영상 모달
│   │   ├── pages/             # 페이지 컴포넌트
│   │   │   ├── SearchPage.jsx       # 검색 페이지 (메인)
│   │   │   └── ResultsPage.jsx      # 결과 페이지
│   │   ├── utils/             # 유틸리티 함수
│   │   │   ├── api.js               # API 호출 함수
│   │   │   └── theme.js             # 테마 관리
│   │   ├── data/              # 데이터
│   │   │   └── mockData.js          # 목 데이터
│   │   ├── App.jsx            # 메인 앱 컴포넌트
│   │   ├── main.jsx           # 진입점
│   │   └── index.css          # 글로벌 스타일
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
├── back-end/                  # 백엔드 (Cloudflare Workers + Hono)
│   ├── src/
│   │   └── index.js           # API 서버 엔트리 포인트
│   ├── package.json
│   └── wrangler.toml          # Cloudflare Workers 설정
├── document/                  # 문서 및 자료
│   └── ad-video.mp4           # 홍보 영상
└── README.md
```

### 아키텍처

- **프론트엔드**: React 18 + Vite를 사용한 SPA (Single Page Application)
- **백엔드**: Cloudflare Workers에서 실행되는 서버리스 API
- **AI 모델**: Cloudflare AI Workers의 Llama 3.1 8B 모델
- **외부 API**: 카카오 로컬 API (맛집 검색)

## 3. 로컬 실행 방법

### 사전 요구사항

- Node.js 18 이상
- npm 또는 yarn
- Cloudflare 계정 (백엔드 배포 시)

### 프론트엔드 실행

```bash
# front-end 디렉토리로 이동
cd front-end

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드는 기본적으로 `http://localhost:5173`에서 실행됩니다.

### 백엔드 실행

```bash
# back-end 디렉토리로 이동
cd back-end

# 의존성 설치
npm install

# 로컬 개발 서버 실행
npm start
```

백엔드는 기본적으로 `http://localhost:8787`에서 실행됩니다.

### 환경 변수 설정

#### 프론트엔드

프론트엔드에서 백엔드 API URL을 지정하려면 `.env` 파일을 생성하세요:

```env
VITE_API_BASE_URL=http://localhost:8787
```

#### 백엔드

백엔드는 `wrangler.toml` 파일에서 환경 변수를 관리합니다:

```toml
[vars]
KAKAO_REST_API_KEY="your-kakao-rest-api-key"
```

카카오 로컬 API 키는 [카카오 개발자 콘솔](https://developers.kakao.com)에서 발급받을 수 있습니다.

### 전체 프로젝트 실행

1. 터미널 1: 백엔드 실행
   ```bash
   cd back-end
   npm start
   ```

2. 터미널 2: 프론트엔드 실행
   ```bash
   cd front-end
   npm run dev
   ```

3. 브라우저에서 `http://localhost:5173` 접속

## 4. 배포 방법

### 프론트엔드 배포

프론트엔드는 정적 사이트로 빌드되어 배포할 수 있습니다.

#### 빌드

```bash
cd front-end
npm run build
```

빌드된 파일은 `front-end/dist` 디렉토리에 생성됩니다.

#### 배포 옵션

- **Vercel**: Vercel CLI 또는 GitHub 연동
- **Netlify**: Netlify CLI 또는 GitHub 연동
- **Cloudflare Pages**: Wrangler CLI 사용
- **GitHub Pages**: GitHub Actions 사용

**Vercel 배포 예시:**

```bash
# Vercel CLI 설치
npm i -g vercel

# 배포
cd front-end
vercel
```

### 백엔드 배포

백엔드는 Cloudflare Workers로 배포됩니다.

#### 배포

```bash
cd back-end

# Cloudflare에 로그인
npx wrangler login

# 배포
npm run deploy
```

배포 전에 `wrangler.toml` 파일에서 환경 변수를 확인하고 설정하세요.

```toml
[vars]
KAKAO_REST_API_KEY="your-production-kakao-api-key"
```

#### 프로덕션 환경 변수 설정

프로덕션 환경에서는 Wrangler CLI로 환경 변수를 설정할 수 있습니다:

```bash
npx wrangler secret put KAKAO_REST_API_KEY
```

### 배포 후 프론트엔드 설정

배포된 백엔드 URL을 프론트엔드 환경 변수에 설정해야 합니다.

**Vercel 환경 변수 설정:**
1. Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
2. `VITE_API_BASE_URL` 변수 추가 (예: `https://your-worker.workers.dev`)

**Netlify 환경 변수 설정:**
1. Netlify 대시보드 → Site settings → Environment variables
2. `VITE_API_BASE_URL` 변수 추가

## 5. 사용한 기술

### 프론트엔드

- **React 18.2.0**: UI 라이브러리
- **Vite 4.4.5**: 빌드 도구 및 개발 서버
- **React Router DOM 6.30.2**: 클라이언트 사이드 라우팅
- **Tailwind CSS 3.3.3**: 유틸리티 기반 CSS 프레임워크
- **Lucide React**: 아이콘 라이브러리
- **React Kakao Maps SDK**: 카카오맵 통합

### 백엔드

- **Cloudflare Workers**: 서버리스 런타임 환경
- **Hono 4.4.6**: 경량 웹 프레임워크
- **Cloudflare AI Workers**: AI 모델 실행 환경
  - Llama 3.1 8B Instruct 모델

### 외부 서비스

- **카카오 로컬 API**: 맛집 검색 및 위치 정보
- **카카오맵**: 지도 표시 및 마커

### 개발 도구

- **Wrangler**: Cloudflare Workers 개발 및 배포 도구
- **PostCSS**: CSS 후처리
- **Autoprefixer**: CSS 벤더 프리픽스 자동 추가

---

## 기여하기

버그 리포트나 기능 제안은 GitHub Issues를 통해 제출해주세요.

## 라이선스

이 프로젝트는 개인 프로젝트입니다.

