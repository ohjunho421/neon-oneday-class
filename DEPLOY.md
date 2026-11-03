# 배포 절차

## 1. 구글 시트 + Apps Script (주최자가 직접, 5분)

1. [sheets.new](https://sheets.new)에서 새 시트를 만들고 이름을 `NEON 1114 신청`으로 바꾼다.
2. 메뉴 **확장 프로그램 → Apps Script**를 연다.
3. `Code.gs` 내용을 모두 지우고 [apps-script/Code.gs](apps-script/Code.gs)를 붙여넣은 뒤 저장한다.
4. **배포 → 새 배포 → 유형: 웹 앱**
   - 실행 사용자: **나**
   - 액세스 권한: **모든 사용자**
5. 권한 승인 창이 뜨면 본인 계정으로 허용한다("확인되지 않은 앱" 경고가 나오면 고급 → 이동).
6. 나온 **웹 앱 URL**(`https://script.google.com/macros/s/.../exec`)을 복사한다.
7. `index.html`의 `const API_URL = '';` 따옴표 안에 붙여넣는다.

- 신청이 들어오면 시트의 `signups` 탭에 1행씩 쌓인다(첫 신청 때 자동 생성).
- 시트에서 행을 직접 지우면 명단에서도 빠진다(다른 기기라 본인이 취소 못 할 때). `tokHash` 열은 수정하지 않는다.
- 이전 버전 시트를 쓰고 있었다면 `signups` 탭을 지우고 다시 시작한다(열 구성이 바뀜).
- 코드를 고친 뒤에는 **배포 → 배포 관리 → 수정 → 새 버전**으로 다시 배포해야 반영된다(URL은 그대로).

## 2. 개강 확정 공지

참가자 연락처를 받지 않으므로, 11/6 개강 확정·입금 안내는 `index.html`의 `const NOTICE = '';`에 문구를 넣어 페이지 상단에 띄운다.

## 3. GitHub Pages

```bash
gh repo create neon-oneday-class --public --source=. --push
```

이후 GitHub 저장소 **Settings → Pages → Branch: master / (root)** 저장.
주소: `https://ohjunho421.github.io/neon-oneday-class/` (OG 태그가 이 주소 기준)

저장소 이름이나 계정이 달라지면 `index.html`의 `og:url`, `og:image`를 같이 바꾼다.
