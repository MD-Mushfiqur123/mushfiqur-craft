import * as THREE from 'three';

export class MobEntity {
    constructor(scene, position, typeOpts = {}) {
        this.scene = scene;
        this.position = position.clone();
        this.velocity = new THREE.Vector3();

        // Procedural Attributes
        this.color = typeOpts.color || Math.random() * 0xffffff;
        this.size = typeOpts.size || (0.5 + Math.random());
        this.speed = typeOpts.speed || (2 + Math.random() * 3);
        this.name = typeOpts.name || "Unknown Specimen";

        this.mesh = this.createMesh();
        this.mesh.position.copy(this.position);
        this.scene.add(this.mesh);

        // State
        this.moveTimer = 0;
        this.targetDir = new THREE.Vector3();
    }

    createMesh() {
        const group = new THREE.Group();

        // Material
        const mat = new THREE.MeshLambertMaterial({ color: this.color });

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.6 * this.size, 0.9 * this.size, 0.4 * this.size);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.45 * this.size;
        group.add(body);

        // Head
        const headGeo = new THREE.BoxGeometry(0.5 * this.size, 0.5 * this.size, 0.5 * this.size);
        const head = new THREE.Mesh(headGeo, mat);
        head.position.y = (0.9 + 0.25) * this.size;
        group.add(head);

        // Cast shadow
        body.castShadow = true;
        head.castShadow = true;

        return group;
    }

    update(dt, world) {
        // Simple AI: Wander
        this.moveTimer -= dt;
        if (this.moveTimer <= 0) {
            this.moveTimer = 2 + Math.random() * 3;
            // new random direction
            const theta = Math.random() * Math.PI * 2;
            this.targetDir.set(Math.cos(theta), 0, Math.sin(theta));
        }

        // Apply movement
        // Very basic collision (just stop if inside block)
        // ideally share physics engine

        this.velocity.x = this.targetDir.x * this.speed;
        this.velocity.z = this.targetDir.z * this.speed;

        // Gravity
        this.velocity.y -= 30 * dt;

        // Apply
        this.position.x += this.velocity.x * dt;
        this.position.z += this.velocity.z * dt;
        this.position.y += this.velocity.y * dt;

        // Floor collision (Basic)
        // Check block at feet
        const bx = Math.floor(this.position.x);
        const by = Math.floor(this.position.y);
        const bz = Math.floor(this.position.z);

        const blockBelow = world.getBlock(bx, by, bz);
        if (blockBelow !== 0) {
            this.position.y = by + 1;
            this.velocity.y = 0;
        }

        this.mesh.position.copy(this.position);

        // Look at dir
        if (this.targetDir.lengthSq() > 0.1) {
            const lookPos = this.position.clone().add(this.targetDir);
            this.mesh.lookAt(lookPos);
        }
    }
}
