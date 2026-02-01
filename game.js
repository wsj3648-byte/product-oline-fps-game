


function main() {
    const canvas = document.querySelector('#c');
    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
    renderer.shadowMap.enabled = true;

    const fov = 75;
    const aspect = window.innerWidth / window.innerHeight;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(15, 10, 20);

    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#AAAAAA');

    // Lighting
    {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 30, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        scene.add(directionalLight.target);
    }

    // Ground - Sand color
    {
        const groundGeometry = new THREE.PlaneGeometry(100, 100);
        const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xD2B48C }); // Sand color
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);
    }

    // Walls and Boxes - Inspired by de_dust2
    const createBox = (width, height, depth, color, position) => {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({ color });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(position);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        return mesh;
    };

    const wallColor = 0xBEB4A4; // A light stone/sand color for walls
    const boxColor = 0x8B4513;   // A brownish color for crates

    // Main wall structures
    createBox(20, 10, 1, wallColor, new THREE.Vector3(0, 5, -10));
    createBox(1, 10, 20, wallColor, new THREE.Vector3(10, 5, 0));
    createBox(15, 8, 1, wallColor, new THREE.Vector3(-2.5, 4, 5));
    createBox(1, 8, 10, wallColor, new THREE.Vector3(-10, 4, 0));


    // Crates/Boxes
    createBox(4, 4, 4, boxColor, new THREE.Vector3(0, 2, 0));
    createBox(3, 3, 3, boxColor, new THREE.Vector3(5, 1.5, -2));
    createBox(2, 2, 2, boxColor, new THREE.Vector3(-5, 1, 2));


    function resizeRendererToDisplaySize(renderer) {
        const canvas = renderer.domElement;
        const width = canvas.clientWidth;
        const height = canvas.clientHeight;
        const needResize = canvas.width !== width || canvas.height !== height;
        if (needResize) {
            renderer.setSize(width, height, false);
        }
        return needResize;
    }

    function animate() {
        if (resizeRendererToDisplaySize(renderer)) {
            const canvas = renderer.domElement;
            camera.aspect = canvas.clientWidth / canvas.clientHeight;
            camera.updateProjectionMatrix();
        }

        controls.update();
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
}

main();
