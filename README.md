# 웹드럼 (WebDrum)

브라우저에서 바로 두드리는 드럼머신.

- 16패드 (킥, 스네어, 햇, 탐, 퍼커션)
- 키보드: `1 2 3 4` / `Q W E R` / `A S D F` / `Z X C V`
- 스페이스: 재생 / 일시정지
- 16스텝 시퀀서, 스윙, 템포
- 프리셋: 붐뱃 · 하우스 · 리퀀드 · 라틴

소리는 Web Audio로 합성됩니다. 샘플 파일이 필요 없습니다.

## 요구 사항

- Node.js 22 이상
- npm 10 이상

## 설치

```bash
git clone https://github.com/hufs1986/Webdrum.git
cd Webdrum
npm install
```

## 실행 (개발)

```bash
npm run dev
```

브라우저에서 `http://localhost:8080` 을 엽니다.

## 빌드

```bash
npm run build
```

프로덕션 미리보기:

```bash
npm run preview
```

## 그 외 스크립트

| 명령 | 설명 |
|---|---|
| `npm run typecheck` | TypeScript 검사 |
| `npm run lint` | ESLint |
| `npm test` | 유닛 테스트 |

`.env` 나 API 키는 필요하지 않습니다.
