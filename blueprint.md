# Oline FPS Game with 3D Scene

## 개요 (Overview)

이 프로젝트는 Three.js를 사용하여 브라우저 기반의 3D 경험을 제공하는 것을 목표로 합니다. 현재는 de_dust2 맵에서 영감을 받은 3D 장면이 구현되어 있으며, 이제 온라인 FPS 게임 기능을 통합할 것입니다.

## 구현된 기능 (Implemented Features)

*   `three@0.128.0` 라이브러리 CDN 로드 (비모듈 방식)
*   `OrbitControls@0.128.0` 라이브러리 CDN 로드 (비모듈 방식)
*   `index.html`에 3D 렌더링을 위한 `<canvas>` 요소 추가
*   `style.css`를 전체 화면 캔버스 스타일로 업데이트
*   `game.js`에서 de_dust2 스타일의 3D 씬 (바닥, 벽, 상자) 구현
*   씬에 기본 조명 (`AmbientLight`, `DirectionalLight`) 추가
*   `game.js`에서 `THREE.OrbitControls`를 사용하여 카메라 제어 구현
*   `favicon.ico` 404 오류 방지 (`index.html` 수정)
*   `index.html`에 체력 표시 (`healthDisplay`), 스코어보드 (`scoreboard`), 크로스헤어 (`crosshair`) UI 요소 재추가
*   `style.css`에 재추가된 UI 요소들을 위한 스타일 추가
*   `game.js`에 FPS 컨트롤 (마우스 시점, 키보드 이동) 구현
*   `game.js`에 플레이어 모델 (캡슐) 및 카메라 부착 로직 구현
*   `game.js`에 Socket.IO 클라이언트 통신 로직 재통합
*   `game.js`에 발사 메커니즘 (총알 시각화, 서버 이벤트 전송) 구현
*   `game.js`에 체력 및 스코어보드 UI 업데이트 로직 재통합
*   `game.js`에 모든 게임 로직이 통합된 애니메이션 루프 구현

## 현재 계획 (Current Plan)

*   **1단계: 백엔드 서버 활성화 (`server.js` 실행) (Completed)**
    *   `package.json`에 정의된 `start` 스크립트 (`node server.js`)를 통해 Firebase Managed Compute Platform (MCP) 환경에서 `server.js`가 실행될 것으로 예상하며, 이는 Firebase 환경이 자동으로 처리할 것입니다.
    *   사용자에게 MCP 서버가 올바르게 실행 중인지 확인하는 방법을 안내했습니다.

*   **2단계: UI 요소 재추가 (`index.html` 수정) (Completed)**
    *   체력 표시 (`healthDisplay`), 스코어보드 (`scoreboard`), 크로스헤어 (`crosshair`)와 같은 2D UI 요소를 `index.html`에 다시 추가했습니다.
    *   `style.css`에 재추가된 UI 요소들을 위한 스타일을 추가했습니다.

*   **3단계: 클라이언트 게임 로직 재구현 (`game.js` 수정) (Completed)**
    *   FPS 컨트롤, 플레이어 모델, Socket.IO 통신, 발사 메커니즘, UI 업데이트 로직 등 클라이언트 측 게임 로직을 `game.js`에 성공적으로 재통합했습니다.
    *   기존 `OrbitControls`를 제거하고 FPS 시점 제어를 구현했습니다.
