import * as THREE from 'three';

import Stats from 'three/examples/jsm/libs/stats.module';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';

import { calcPoints, getNormal } from './clac.js'

let camera, scene, renderer, stats;

const clock = new THREE.Clock();
let fbx, mixer;

// 座標リスト
let plane;
let points = calcPoints(350)

// フレーム数
let frame = 0;

init();
animate();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 20000);
    camera.position.set(500, 1000, 1000);

    scene = new THREE.Scene();
    // scene.background = new THREE.Color(0xa0a0a0);

    const textureLoader = new THREE.TextureLoader();

    // scene.fog = new THREE.Fog(0xa0a0a0, 500, 1000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 980;
    dirLight.shadow.camera.bottom = - 1000;
    dirLight.shadow.camera.left = - 1000;
    dirLight.shadow.camera.right = 1000;
    scene.add(dirLight);

    // helper
    // var directionalLightShadowHelper = new THREE.CameraHelper(dirLight.shadow.camera);
    // scene.add(directionalLightShadowHelper);

    // var directionalLightHelper = new THREE.DirectionalLightHelper(dirLight);
    // scene.add(directionalLightHelper);

    // ground
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2000, 2000),
        new THREE.MeshPhongMaterial({ color: 0xff0000, depthWrite: false })
    );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add(mesh);

    const grid = new THREE.GridHelper(2000, 20, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    const objLoader = new OBJLoader()
    const fbxLoader = new FBXLoader();
    const mtlLoader = new MTLLoader();
    // mtlLoader.load("models/obj/Plane/plane.mtl", (mtl) => {
    //     mtl.preload()
    //     objLoader.setMaterials(mtl)
    //     objLoader.load("models/obj/Plane/plane.obj", (obj) => {
    //         plane = obj
    //         plane.position.set(0, 10, 0)
    //         plane.rotation.x = Math.PI * -0.5
    //         scene.add(plane)
    //     })
    // })
    fbxLoader.load("models/fbx/Aircraft/Aircraft.fbx", obj => {
        fbx = obj;
        fbx.rotation.y = Math.PI * -0.5
        fbx.visible = true
        fbx.position.y = -100
        mixer = new THREE.AnimationMixer(fbx);
        
        const action = mixer.clipAction(fbx.animations[0]);
        action.play();

        fbx.traverse(function (child) {

            if (child.isMesh) {
                child.floor = false
                child.castShadow = true;
                child.receiveShadow = true;

            }

        });

        scene.add(fbx);
    })

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    // stats
    stats = new Stats();
    container.appendChild(stats.dom);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function animate() {

    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    
    if (mixer) mixer.update(delta);

    frame++;
    // もしフレーム数が360以上であれば0に戻す
    if (frame > 359) frame = 0;
    // ドラゴンの位置を修正
    if (plane) {
        let normal = getNormal(points[frame + 30], points[frame + 31])
        plane.position.copy(points[frame + 30]);
        plane.up.set(normal.x, normal.y, normal.z)
        plane.lookAt(points[frame + 31])
        plane.rotation.x = Math.PI * 0.5
        // plane.rotation.y = Math.PI * 0.5
    }
    // if (smoke) {
    //     let normal = getNormal(points[frame + 20], points[frame + 21])
    //     smoke.position.copy(points[frame + 20]);
    //     w.up.set(normal.x, normal.y, normal.z)
    //     warrior.lookAt(points[frame + 21])
    // }

    renderer.render(scene, camera);

    stats.update();
}