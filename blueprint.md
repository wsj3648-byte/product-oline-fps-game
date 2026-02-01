# Oline FPS Game with 3D Scene

## 개요 (Overview)

이 프로젝트는 Three.js를 사용하여 브라우저 기반의 3D 경험을 제공하는 것을 목표로 합니다. 초기 단계에서는 Counter-Strike의 'de_dust2' 맵 이미지를 참조하여 단순화된 3D 장면을 구현합니다.

## 구현된 기능 (Implemented Features)

*   `three` 라이브러리 설치
*   `index.html`에 3D 렌더링을 위한 `<canvas>` 요소 추가
*   `style.css`를 전체 화면 캔버스 스타일로 업데이트
*   `game.js`에서 de_dust2 스타일의 3D 씬 (바닥, 벽, 상자) 구현
*   씬에 기본 조명 (`AmbientLight`, `DirectionalLight`) 추가
*   마우스로 씬을 탐색할 수 있는 `OrbitControls` 구현
*   지속적인 렌더링을 위한 애니메이션 루프 생성

## 현재 계획 (Current Plan)

*   **1단계: Three.js 설치 (Completed)**
    *   `npm`을 사용하여 `three` 라이브러리를 프로젝트에 추가했습니다.

*   **2단계: 기본 환경 구성 (Completed)**
    *   `index.html`에 3D 렌더링을 위한 `<canvas>` 요소를 추가했습니다.
    *   `style.css`를 수정하여 캔버스가 전체 화면을 차지하도록 설정했습니다.
    *   `game.js`에서 Three.js 씬, 카메라, 렌더러를 초기화하고 de_dust2 스타일의 지오메트리를 생성했습니다.

*   **3단계: 조명 및 카메라 제어 설정 (Completed)**
    *   `AmbientLight`와 `DirectionalLight`를 장면에 추가했습니다.
    *   사용자가 마우스로 씬을 탐색할 수 있도록 `OrbitControls`를 구현했습니다.

*   **4단계: 애니메이션 루프 및 렌더링 (Completed)**
    *   `requestAnimationFrame`을 사용하여 렌더링 루프를 생성하고 씬을 지속적으로 렌더링하도록 구현했습니다.
