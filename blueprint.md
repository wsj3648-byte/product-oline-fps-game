# Oline FPS Game with 3D Scene

## 개요 (Overview)

이 프로젝트는 Three.js를 사용하여 브라우저 기반의 3D 경험을 제공하는 것을 목표로 합니다. 현재는 de_dust2 맵에서 영감을 받은 3D 장면이 구현되어 있으며, 온라인 FPS 게임 기능을 통합할 것입니다. 백엔드는 Cloudflare Worker 환경에 맞게 재구축됩니다.

## 구현된 기능 (Implemented Features)

*   `three@0.128.0` 라이브러리 CDN 로드 (비모듈 방식)
*   `OrbitControls@0.128.0` 라이브러리 CDN 로드 (비모듈 방식)
*   `index.html`에 3D 렌더링을 위한 `<canvas>` 요소 추가
*   `style.css`를 전체 화면 캔버스 스타일로 업데이트
*   `game.js`에서 de_dust2 스타일의 3D 씬 (바닥, 벽, 상자) 구현
*   씬에 기본 조명 (`AmbientLight`, `DirectionalLight`, `HemisphereLight`) 추가
*   `game.js`에서 `THREE.BoxGeometry`를 사용하여 플레이어 모델 구현
*   렌더러 `pixelRatio` 설정, 그림자 맵 해상도 증가로 화질 개선
*   `favicon.ico` 404 오류 방지 (`index.html` 수정)
*   `index.html`에 체력 표시 (`healthDisplay`), 스코어보드 (`scoreboard`), 크로스헤어 (`crosshair`) UI 요소 재추가
*   `style.css`에 재추가된 UI 요소들을 위한 스타일 추가
*   `game.js`에 FPS 컨트롤 (마우스 시점, 키보드 이동) 구현
*   `game.js`에 플레이어 모델 (박스) 및 카메라 부착 로직 구현
*   `game.js`에 Socket.IO 클라이언트 통신 로직 재통합 (현재 Cloudflare Worker 연결 시도 중)
*   `game.js`에 발사 메커니즘 (총알 시각화, 서버 이벤트 전송) 구현
*   `game.js`에 체력 및 스코어보드 UI 업데이트 로직 재통합
*   `game.js`에 모든 게임 로직이 통합된 애니메이션 루프 구현

## 현재 계획 (Current Plan) - Cloudflare Worker 백엔드 재아키텍처 (옵션 B)

*   **1단계: `blueprint.md` 업데이트 (Completed)**
    *   새로운 아키텍처 변경 계획과 복잡성을 문서화했습니다.

*   **2단계: Cloudflare Worker 백엔드 재구축 (In Progress)**
    *   기존 `server.js`를 **Cloudflare Worker 환경에 맞게 완전히 재작성**할 것입니다.
    *   HTTP 요청을 WebSocket으로 업그레이드하는 로직을 구현합니다.
    *   게임 상태 관리를 위한 Cloudflare **Durable Objects**를 설계하고 구현합니다.
    *   Socket.IO 프로토콜 대신 **순수 WebSockets**를 사용하여 클라이언트-서버 통신을 처리합니다.
    *   **주의:** 이는 기존 코드의 거의 모든 부분을 변경해야 하는 **매우 복잡하고 광범위한 작업**입니다.

*   **3단계: 클라이언트(`game.js`) 수정 (Pending)**
    *   `socket.io-client` 대신 **네이티브 WebSocket 클라이언트**를 사용하여 Cloudflare Worker의 WebSocket 엔드포인트에 연결하도록 수정합니다.
    *   기존 Socket.IO 이벤트 핸들러를 WebSocket 메시지 핸들링 로직으로 전환합니다.

*   **4단계: 배포 설정 (Pending)**
    *   Cloudflare Worker 및 Durable Objects 배포를 위한 `wrangler.jsonc` 설정을 확인하고 업데이트합니다.