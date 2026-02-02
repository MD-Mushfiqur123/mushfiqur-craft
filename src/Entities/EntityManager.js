import * as THREE from 'three';
import { MobEntity } from './MobEntity.js';

export class EntityManager {
    constructor(scene, world, player) {
        this.scene = scene;
        this.world = world;
        this.player = player;
        this.mobs = [];
        this.spawnTimer = 0;

        // "1M+ mobs" means we procedurally generate types on the fly
        this.mobTypes = [];
        this.generateSpecies(50); // Generate 50 unique species definitions to start
    }

    generateSpecies(count) {
        for (let i = 0; i < count; i++) {
            this.mobTypes.push({
                color: Math.random() * 0xffffff,
                size: 0.5 + Math.random() * 1.5, // 0.5x to 2.0x size
                speed: 1 + Math.random() * 4,
                name: `Species #${i}`
            });
        }
    }

    update(dt) {
        // Update existing mobs
        for (const mob of this.mobs) {
            mob.update(dt, this.world);
        }

        // Spawn logic
        this.spawnTimer += dt;
        if (this.spawnTimer > 2.0) { // Try spawn every 2 seconds
            this.spawnTimer = 0;
            if (this.mobs.length < 20) { // Limit for performance
                this.trySpawnMob();
            }
        }
    }

    trySpawnMob() {
        // Spawn near player
        const r = 20 + Math.random() * 20; // 20-40 blocks away
        const theta = Math.random() * Math.PI * 2;
        const x = this.player.position.x + r * Math.cos(theta);
        const z = this.player.position.z + r * Math.sin(theta);

        // Find ground y
        let y = 80;
        while (y > 0 && this.world.getBlock(x, y - 1, z) === 0) {
            y--;
        }

        if (y > 0 && y < 200) {
            // Pick random species
            const species = this.mobTypes[Math.floor(Math.random() * this.mobTypes.length)];

            const mob = new MobEntity(this.scene, new THREE.Vector3(x, y, z), species);
            this.mobs.push(mob);
        }
    }
}
