import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { Chunk } from './Chunk.js';

export class World {
    constructor(scene) {
        this.scene = scene;
        this.chunks = new Map(); // "x,z" -> Chunk
        this.chunkSize = 16;
        this.renderDistance = 4;

        this.material = new THREE.MeshLambertMaterial({ color: 0xffffff }); // Use colors from instance
        this.waterMaterial = new THREE.MeshPhongMaterial({
            color: 0x2244bb,
            transparent: true,
            opacity: 0.7,
            shininess: 90
        });
    }

    update(playerPosition) {
        const centerChunkX = Math.floor(playerPosition.x / this.chunkSize);
        const centerChunkZ = Math.floor(playerPosition.z / this.chunkSize);

        // Load new chunks
        for (let x = -this.renderDistance; x <= this.renderDistance; x++) {
            for (let z = -this.renderDistance; z <= this.renderDistance; z++) {
                const chunkX = centerChunkX + x;
                const chunkZ = centerChunkZ + z;
                this.loadChunk(chunkX, chunkZ);
            }
        }
    }

    loadChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;

        const chunk = new Chunk(cx, cz, this.chunkSize, this.noise3D);
        const meshes = chunk.buildMesh(this.material, this.waterMaterial);

        this.scene.add(meshes.solid);
        this.scene.add(meshes.water);

        this.chunks.set(key, chunk);
    }

    getBlock(x, y, z) {
        if (y < 0 || y >= 256) return 0;

        const cx = Math.floor(x / this.chunkSize);
        const cz = Math.floor(z / this.chunkSize);
        const key = `${cx},${cz}`;

        const chunk = this.chunks.get(key);
        if (!chunk) return 0;

        const lx = Math.floor(x) - (cx * this.chunkSize);
        const lz = Math.floor(z) - (cz * this.chunkSize);
        const ly = Math.floor(y);

        return chunk.getBlockId(lx, ly, lz);
    }

    setBlock(x, y, z, id) {
        if (y < 0 || y >= 256) return;

        const cx = Math.floor(x / this.chunkSize);
        const cz = Math.floor(z / this.chunkSize);
        const key = `${cx},${cz}`;

        const chunk = this.chunks.get(key);
        if (chunk) {
            const lx = Math.floor(x) - (cx * this.chunkSize);
            const lz = Math.floor(z) - (cz * this.chunkSize);
            const ly = Math.floor(y);

            chunk.setBlockId(lx, ly, lz, id);

            // Rebuild mesh
            // Optimization: throttling this or using a dirty flag
            chunk.buildMesh(this.material);
        }
    }
}
