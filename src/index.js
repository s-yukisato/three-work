import * as THREE from 'three';

import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { Water } from 'three/examples/jsm/objects/Water'
import { Sky } from 'three/examples/jsm/objects/Sky'

import { ImprovedNoise } from 'three/examples/jsm/math/ImprovedNoise.js';

import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

let camera, controls, scene, renderer, water;

let mesh, texture;

let clock = new THREE.Clock();
let smokeParticles = [];

let house, alien, aircraft, mixer;

const worldWidth = 256, worldDepth = 256,
    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

init();
animate();

function init() {

    const container = document.createElement('div');
    document.body.appendChild(container);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    scene.fog = new THREE.Fog(0xffffff, 2000, 20000);

    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 10, 20000);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(10000, 1000, -10000);
    scene.add(hemiLight);


    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 1000;
    controls.maxDistance = 15000;
    controls.maxPolarAngle = Math.PI / 2;

    //

    const data = generateHeight(worldWidth, worldDepth);

    controls.target.y = data[worldHalfWidth + worldHalfDepth * worldWidth] + 500;
    camera.position.y = controls.target.y + 400;
    camera.position.x = -6000;
    camera.position.z = 6000;
    controls.update();

    const geometry = new THREE.PlaneGeometry(30000, 30000, worldWidth - 1, worldDepth - 1);
    geometry.rotateX(- Math.PI / 2);

    const vertices = geometry.attributes.position.array;

    for (let i = 0, j = 0, l = vertices.length; i < l; i++, j += 3) {
        vertices[j + 1] = data[i] * 10;
    }

    geometry.computeFaceNormals(); // needed for helper
    //
    const textureLoader = new THREE.TextureLoader();

    //Smoke
    textureLoader.load('textures/sky/cloud10.png', function (texture) {
        const smokeMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
        });

        for (let i = 0; i < 10; i++) {
            const particle = new THREE.Sprite(smokeMaterial);
            particle.scale.set(5000, 5000, 5000)

            particle.position.x = (Math.random() - 0.5) * 20000;
            particle.position.y = (Math.random() - 1) * 3 + 4000;
            particle.position.z = (Math.random() - 0.5) * 20000;
            particle.rotation.z = Math.random() * 360;

            smokeParticles.push(particle);
            scene.add(particle);
        }
    });


    texture = new THREE.CanvasTexture(generateTexture(data, worldWidth, worldDepth));
    texture.wrapS = THREE.ClampToEdgeWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;

    mesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: texture }));
    mesh.receiveShadow = true
    scene.add(mesh);

    // const geometryHelper = new THREE.ConeGeometry(20, 100, 3);
    // geometryHelper.translate(0, 50, 0);
    // geometryHelper.rotateX(Math.PI / 2);
    // helper = new THREE.Mesh(geometryHelper, new THREE.MeshNormalMaterial());
    // scene.add(helper);

    // container.addEventListener('pointermove', onPointerMove);

    // 水面
    const waterGeometry = new THREE.PlaneGeometry(30000, 30000);
    const flowMap = textureLoader.load('textures/water/Water_1_M_Flow.jpg');

    water = new Water(waterGeometry, {
        scale: 2,
        textureWidth: 1024,
        textureHeight: 1024,
        waterNormals: textureLoader.load('textures/water/Water_1_M_Normal.jpg', function (texture) {
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }),
        alpha: 1.0,
        waterColor: 0x3e89ce,
        flowMap: flowMap,
        distortionScale: 3.7,
        fog: scene.fog !== undefined
    });

    water.position.y = 300;
    water.rotation.x = Math.PI * - 0.5;
    scene.add(water);

    //Sky
    const sky = new Sky();
    sky.scale.setScalar(450000);
    scene.add(sky);

    //Skyの設定
    const sky_uniforms = sky.material.uniforms;
    sky_uniforms['turbidity'].value = 1;
    sky_uniforms['rayleigh'].value = 0.5;
    // sky_uniforms['luminance'].value = 1;
    sky_uniforms['mieCoefficient'].value = 0.005;
    sky_uniforms['mieDirectionalG'].value = 0.3;

    // Sun
    const sunSphere = new THREE.Mesh(
        new THREE.SphereGeometry(50, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0xFF0000 })
    );
    scene.add(sunSphere);

    // Sunの設定
    const sun_uniforms = sky.material.uniforms;
    sun_uniforms['turbidity'].value = 1;
    sun_uniforms['rayleigh'].value = 0.5;
    sun_uniforms['mieCoefficient'].value = 0.005;
    sun_uniforms['mieDirectionalG'].value = 0.7;
    // sun_uniforms['luminance'].value = 1;

    const theta = Math.PI * (-0.01);
    const phi = 2 * Math.PI * (-0.25);
    const distance = 40000;
    sunSphere.position.x = distance * Math.cos(phi);
    sunSphere.position.y = distance * Math.sin(phi) * Math.sin(theta);
    sunSphere.position.z = distance * Math.sin(phi) * Math.cos(theta);
    sunSphere.visible = true;
    sun_uniforms['sunPosition'].value.copy(sunSphere.position);

    // model
    const loader = new FBXLoader();

    // // 航空機
    // loader.load("models/fbx/Aircraft/Aircraft.fbx", obj => {
    //     aircraft = obj;
    //     aircraft.scale.set(5, 5, 5)
    //     aircraft.position.set(-2000, 500, 5000)
    //     aircraft.rotation.y = Math.PI * -0.5
    //     mixer = new THREE.AnimationMixer(aircraft);

    //     const action = mixer.clipAction(aircraft.animations[0]);
    //     action.play();

    //     aircraft.traverse(function (child) {

    //         if (child.isMesh) {

    //             child.castShadow = true;
    //             child.receiveShadow = true;

    //         }
    //     });
    //     scene.add(aircraft);
    // })

    let mat = new THREE.MeshPhongMaterial();
    const wallTexture = textureLoader.load('textures/wall/rough_block_wall.jpg');
    mat.map = wallTexture;

    // normal
    let nor = textureLoader.load('textures/wall/rough_block_wall_nor.jpg');
    mat.normalMap = nor;
    mat.normalScale = new THREE.Vector2(3, -3)

    function createCube(position) {
        var cubeGeometry = new THREE.BoxGeometry(6000, 3000, 8000, 16, 16);
        var cube = new THREE.Mesh(cubeGeometry, mat);
        cube.castShadow = true;
        cube.position.set(position.x, position.y, position.z)

        return cube
    }
    let cube = createCube({x: 0, y: 0, z: 0})
    scene.add(cube)

    loader.load('models/fbx/Wooden_House/Wooden_House.fbx', function (object) {
        house = object;
        house.position.y = 1500
        house.scale.set(2, 2, 2)
        const texture = textureLoader.load('models/fbx/Wooden_House/House_Texture.png');
        house.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                child.material.map = texture
            }
        });
        scene.add(house);
    });

    loader.load('models/fbx/Alien/Alien.fbx', function (object) {
        alien = object;
        alien.position.set(-2000, 2000, 2000)
        alien.scale.set(5, 5, 5)
        mixer = new THREE.AnimationMixer(alien);

        const action = mixer.clipAction(alien.animations[2]);
        action.play();
        alien.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(alien);
    });

    loader.load('models/fbx/Tree/Tree.fbx', function (object) {
        object.scale.set(1000, 1000, 1000)
        object.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        for (let i = 0; i < 10; i++) {
            let dupl = object.clone()
            dupl.position.set(Math.random() * 15000, 0, Math.random() * 15000)
            scene.add(dupl)
        }
    });

    window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}

function generateHeight(width, height) {

    const size = width * height, data = new Uint8Array(size),
        perlin = new ImprovedNoise(), z = Math.random() * 100;

    let quality = 1;

    for (let j = 0; j < 4; j++) {

        for (let i = 0; i < size; i++) {

            const x = i % width, y = ~ ~(i / width);
            data[i] += Math.abs(perlin.noise(x / quality, y / quality, z) * quality * 1.75);

        }

        quality *= 5;

    }

    return data;

}

function generateTexture(data, width, height) {

    // bake lighting into texture

    let context, image, imageData, shade;

    const vector3 = new THREE.Vector3(0, 0, 0);

    const sun = new THREE.Vector3(1, 1, 1);
    sun.normalize();

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    context = canvas.getContext('2d');
    context.fillStyle = '#000';
    context.fillRect(0, 0, width, height);

    image = context.getImageData(0, 0, canvas.width, canvas.height);
    imageData = image.data;

    for (let i = 0, j = 0, l = imageData.length; i < l; i += 4, j++) {

        vector3.x = data[j - 2] - data[j + 2];
        vector3.y = 2;
        vector3.z = data[j - width * 2] - data[j + width * 2];
        vector3.normalize();

        shade = vector3.dot(sun);

        imageData[i] = (96 + shade * 128) * (0.5 + data[j] * 0.007);
        imageData[i + 1] = (32 + shade * 96) * (0.5 + data[j] * 0.007);
        imageData[i + 2] = (shade * 96) * (0.5 + data[j] * 0.007);

    }

    context.putImageData(image, 0, 0);

    // Scaled 4x

    const canvasScaled = document.createElement('canvas');
    canvasScaled.width = width * 4;
    canvasScaled.height = height * 4;

    context = canvasScaled.getContext('2d');
    context.scale(4, 4);
    context.drawImage(canvas, 0, 0);

    image = context.getImageData(0, 0, canvasScaled.width, canvasScaled.height);
    imageData = image.data;

    for (let i = 0, l = imageData.length; i < l; i += 4) {

        const v = ~ ~(Math.random() * 5);

        imageData[i] += v;
        imageData[i + 1] += v;
        imageData[i + 2] += v;

    }

    context.putImageData(image, 0, 0);

    return canvasScaled;

}

//

function animate() {

    const delta = clock.getDelta();
    let num = smokeParticles.length;

    while (num--) {
        if (num != 0) {
            smokeParticles[num].material.rotation += (delta * 0.005);
        }
    }

    if (mixer) mixer.update(delta);

    water.material.uniforms['time'].value += 1.0 / 30.0;

    requestAnimationFrame(animate);

    render();
}

function render() {

    renderer.render(scene, camera);

}

// function onPointerMove(event) {

//     pointer.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
//     pointer.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;
//     raycaster.setFromCamera(pointer, camera);

//     // See if the ray from the camera into the world hits one of our meshes
//     const intersects = raycaster.intersectObject(mesh);

//     // Toggle rotation bool for meshes that we clicked
//     if (intersects.length > 0) {

//         helper.position.set(0, 0, 0);
//         helper.lookAt(intersects[0].face.normal);

//         helper.position.copy(intersects[0].point);

//     }

// }
