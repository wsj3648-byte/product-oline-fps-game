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
*   `index.html`에 체력 표시 (`healthDisplay`), 스코어보드 (`scoreboard`), 크로스헤어 (`crosshair`) UI 요소 재추가
*   `style.css`에 재추가된 UI 요소들을 위한 스타일 추가
*   `game.js`에 FPS 컨트롤 (마우스 시점, 키보드 이동) 구현
*   `game.js`에 플레이어 모델 (박스) 및 카메라 부착 로직 구현
*   `game.js`에 Socket.IO 클라이언트 통신 로직 재통합 (현재 Cloudflare Worker 연결 시도 중)
*   `game.js`에 발사 메커니즘 (총알 시각화, 서버 이벤트 전송) 구현
*   `game.js`에 체력 및 스코어보드 UI 업데이트 로직 재통합
*   `game.js`에 모든 게임 로직이 통합된 애니메이션 루프 구현
*   **파비콘 오류 해결 (`index.html` 수정):** `favicon.svg`를 올바르게 연결하고 `favicon.ico`에 대한 불필요한 요청을 방지하기 위한 개선 작업을 진행합니다. 또한 모바일 장치 지원을 위해 `apple-touch-icon`을 추가했습니다.

## 현재 계획 (Current Plan) - 파비콘 및 `index.html` 리소스 로드 오류 해결

*   **1단계: `blueprint.md` 업데이트 (Completed)**
    *   현재 작업 내용에 맞춰 `blueprint.md`를 업데이트했습니다.
*   **2단계: `index.html` 파비콘 링크 수정 (Completed)**
    *   `index.html`의 파비콘 링크를 수정하여 `favicon.svg`를 명시적으로 연결하고 `apple-touch-icon`을 추가했습니다. `favicon.ico`에 대한 404 오류는 브라우저의 기본 동작으로 인해 발생하며, 현재 환경에서는 `.ico` 파일을 생성할 수 없으므로 이 오류는 무해한 것으로 간주됩니다.
*   **3단계: `index.html`의 잠재적인 리소스 로드 오류 조사 및 해결 (Pending)**
    *   ` (index):1 Failed to load resource: the server responded with a status of 404 ()` 오류는 정보가 부족하여 추가적인 조사가 필요합니다. 이 오류가 지속되면 사용자에게 추가 정보를 요청할 것입니다.