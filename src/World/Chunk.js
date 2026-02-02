import * as THREE from 'three';
import { BiomeGenerator } from './BiomeGenerator.js';

export class Chunk {
    constructor(cx, cz, size) {
        this.cx = cx;
        this.cz = cz;
        this.size = size;
        // this.noise = noise; // Removed, using BiomeGen internally or passed in
        this.biomeGen = new BiomeGenerator(); // ideally shared instance

        this.data = new Uint8Array(size * size * 256);
        this.mesh = null;
        this.waterMesh = null;
        this.isDirty = true;

        this.generateData();
    }

    generateData() {
        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                const worldX = this.cx * this.size + x;
                const worldZ = this.cz * this.size + z;

                const { elevation, temperature, humidity } = this.biomeGen.getBiome(worldX, worldZ);

                // Height: Map -1..1 to 10..60
                // Using power function to make mountains steeper
                let height = Math.floor((elevation + 1) * 20) + 10;
                if (elevation > 0.5) height += Math.floor((elevation - 0.5) * 40); // Mountain peaks

                const seaLevel = 20;

                for (let y = 0; y < 256; y++) {
                    let blockId = 0;

                    if (y < height) {
                        // Underground
                        if (y < height - 4) blockId = 3; // Stone
                        else if (y < height - 1) {
                            // Sub-surface
                            if (temperature > 0.5 && humidity < -0.2) blockId = 5; // Sand (Desert)
                            else blockId = 2; // Dirt
                        } else {
                            // Top Block
                            if (y < seaLevel + 2 && temperature > 0.5) blockId = 5; // Sand beaches
                            else if (temperature < -0.5) blockId = 6; // Snow
                            else if (humidity > 0.5) blockId = 7; // Jungle Grass (Darker)
                            else blockId = 1; // Grass
                        }
                    } else if (y < seaLevel) {
                        blockId = 4; // Water
                    }

                    this.setBlockId(x, y, z, blockId);
                }
            }
        }
    }

    getBlockId(x, y, z) {
        if (x < 0 || x >= this.size || y < 0 || y >= 256 || z < 0 || z >= this.size) return 0;
        return this.data[x + z * this.size + y * this.size * this.size];
    }

    setBlockId(x, y, z, id) {
        if (x < 0 || x >= this.size || y < 0 || y >= 256 || z < 0 || z >= this.size) return;
        this.data[x + z * this.size + y * this.size * this.size] = id;
        this.isDirty = true;
    }

    buildMesh(material, waterMaterial) {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            // this.scene.remove(this.mesh); // Need access to scene or return array
        }
        if (this.waterMesh) {
            this.waterMesh.geometry.dispose();
        }

        const geometry = new THREE.BoxGeometry(1, 1, 1);

        // Count
        let solidCount = 0;
        let waterCount = 0;
        for (let i = 0; i < this.data.length; i++) {
            if (this.data[i] === 4) waterCount++;
            else if (this.data[i] !== 0) solidCount++;
        }

        const mesh = new THREE.InstancedMesh(geometry, material, solidCount);
        const waterMesh = new THREE.InstancedMesh(geometry, waterMaterial, waterCount);

        const dummy = new THREE.Object3D();
        const _color = new THREE.Color();

        let solidIdx = 0;
        let waterIdx = 0;

        for (let x = 0; x < this.size; x++) {
            for (let z = 0; z < this.size; z++) {
                for (let y = 0; y < 256; y++) {
                    const id = this.getBlockId(x, y, z);
                    if (id !== 0) {
                        const worldX = this.cx * this.size + x;
                        const worldY = y;
                        const worldZ = this.cz * this.size + z;

                        dummy.position.set(worldX, worldY, worldZ);
                        dummy.updateMatrix();

                        if (id === 4) {
                            // Water
                            waterMesh.setMatrixAt(waterIdx++, dummy.matrix);
                            // Water usually uniform color, handled by material
                        } else {
                            mesh.setMatrixAt(solidIdx, dummy.matrix);

                            // Color palette
                            if (id === 1) _color.setHex(0x55aa55); // Grass
                            else if (id === 2) _color.setHex(0x8B4513); // Dirt
                            else if (id === 3) _color.setHex(0x808080); // Stone
                            // id 4 handled by waterMesh
                            else if (id === 5) _color.setHex(0xe0d879); // Sand
                            else if (id === 6) _color.setHex(0xffffff); // Snow
                            else if (id === 7) _color.setHex(0x228822); // Jungle Grass

                            mesh.setColorAt(solidIdx, _color);
                            solidIdx++;
                        }
                    }
                }
            }
        }

        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // Water doesn't cast shadow usually, but receives it
        waterMesh.receiveShadow = true;

        this.mesh = mesh;
        this.waterMesh = waterMesh;

        return { solid: mesh, water: waterMesh };
    }

    dispose() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
        }
        if (this.waterMesh) {
            this.waterMesh.geometry.dispose();
        }
    }
}
