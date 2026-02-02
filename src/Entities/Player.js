import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { Physics } from '../Physics/Physics.js';

export class Player {
    constructor(camera, domElement) {
        this.camera = camera;
        this.controls = new PointerLockControls(camera, domElement);

        // Physics
        this.position = new THREE.Vector3(0, 40, 0);
        this.velocity = new THREE.Vector3();
        this.camera.position.copy(this.position);

        // Movement settings
        this.speed = 10;
        this.jumpForce = 12;
        // Gravity handled by Physics engine

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        this.canJump = false;

        this.physics = null; // Will init with world
        this.setupInput();
    }

    setupInput() {
        // ... input code same ...
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = true;
                    break;
                case 'Space':
                    if (this.canJump) {
                        this.velocity.y = this.jumpForce;
                        this.canJump = false;
                    }
                    break;
            }
        };

        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.moveForward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.moveLeft = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.moveBackward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.moveRight = false;
                    break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        document.addEventListener('mousedown', (event) => {
            if (!this.controls.isLocked) return;
            if (!this.physics) return;

            // 0 = Left (Mine), 2 = Right (Place)
            // Raycast from camera
            const origin = this.controls.getObject().position.clone();
            const direction = new THREE.Vector3();
            this.camera.getWorldDirection(direction);

            const hit = this.physics.raycast(origin, direction, 5); // 5 block reach

            if (hit) {
                if (event.button === 0) {
                    // Destroy
                    // We need to access the chunk and set 0
                    // TODO: expose World.setBlock
                    // For now directly accessing world from physics
                    this.physics.world.setBlock(hit.x, hit.y, hit.z, 0);
                } else if (event.button === 2) {
                    // Place
                    // Need previous position (normal)
                    // DDA doesn't give normal directly easily unless tracked, but we can infer
                    // Logic: step back one voxel in the direction we came from? 
                    // Actually DDA tracking 'face' helps.

                    let nx = hit.x;
                    let ny = hit.y;
                    let nz = hit.z;

                    // Re-calculate previous step based on face or just simple logic:
                    // The DDA snippet above returns 'face' index but not direction.
                    // Let's just use a simplified placement: 
                    // Re-cast slightly shorter? 
                    // Better: Pass `face` generic and use player pos vs hit pos?
                    // No, standard DDA `face` tells us which axis was crossed last. 

                    // Let's refine the Raycast return to includes normal or just use a helper
                    // Updating Raycast in Physics.js is best, but for now let's attempt to place at hit
                    // IF we had normals.

                    // Temporary: Just break for now, placing needs normal.
                    console.log("Place not implemented yet without normal");
                }
            }
        });
    }

    update(dt, world) {
        if (!this.controls.isLocked) return;
        if (!this.physics) this.physics = new Physics(world);

        // Friction
        this.velocity.x -= this.velocity.x * 10.0 * dt;
        this.velocity.z -= this.velocity.z * 10.0 * dt;

        // Input Direction
        const direction = new THREE.Vector3();
        direction.z = Number(this.moveForward) - Number(this.moveBackward);
        direction.x = Number(this.moveRight) - Number(this.moveLeft);
        direction.normalize();

        if (this.moveForward || this.moveBackward) this.velocity.z -= direction.z * this.speed * 100.0 * dt;
        if (this.moveLeft || this.moveRight) this.velocity.x -= direction.x * this.speed * 100.0 * dt;

        // Apply Physics Step
        this.physics.applyGravity(this, dt);
        this.physics.detectCollisions(this, dt);

        // Sync Camera
        this.controls.getObject().position.copy(this.position);
    }
}
