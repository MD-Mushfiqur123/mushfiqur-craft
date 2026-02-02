import * as THREE from 'three';
import { Player } from './Entities/Player.js';
import { World } from './World/World.js';
import { EntityManager } from './Entities/EntityManager.js';

export class Game {
    constructor() {
        this.container = document.getElementById('game-container');

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: false }); // Voxel games don't strictly need AA, saves perf
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 10, 60);

        // Camera & Player
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.player = new Player(this.camera, this.container);

        // World
        this.world = new World(this.scene);

        // Mobs
        this.entityManager = new EntityManager(this.scene, this.world, this.player);

        // Lighting
        this.setupLights();

        // Stats
        this.lastTime = 0;
        this.fpsCounter = document.getElementById('fps-counter');
        this.coordsDisplay = document.getElementById('coords');

        // Resize Listener
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 100, 50);
        dirLight.castShadow = true;
        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;
        this.scene.add(dirLight);
    }

    start() {
        this.renderer.setAnimationLoop(this.animate.bind(this));
    }

    animate(time) {
        const dt = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Update Player (Physics, Input)
        this.player.update(dt, this.world);

        // Update World (Chunk loading, procedural gen)
        this.world.update(this.player.position);

        // Update Mobs
        this.entityManager.update(dt);

        // Render
        this.renderer.render(this.scene, this.camera);

        // UI Updates
        this.updateUI();
    }

    updateUI() {
        this.fpsCounter.innerText = Math.round(1 / ((performance.now() - this.lastTime + 16) / 1000)); // Rough approximation or use actual DT

        const p = this.player.position;
        this.coordsDisplay.innerText = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    get controls() {
        return this.player.controls;
    }
}
