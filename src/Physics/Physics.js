import * as THREE from 'three';

export class Physics {
    constructor(world) {
        this.world = world;
        this.gravity = 30;
        this.playerSize = { x: 0.6, y: 1.8, z: 0.6 }; // Width, Height, Depth
    }

    applyGravity(player, dt) {
        player.velocity.y -= this.gravity * dt;
    }

    detectCollisions(player, dt) {
        const pos = player.position.clone();

        // We update axes one by one to prevent getting stuck
        // X Axis
        const dx = player.velocity.x * dt;
        if (this.checkCollision(pos.x + dx, pos.y, pos.z)) {
            player.velocity.x = 0;
        } else {
            pos.x += dx;
        }

        // Z Axis
        const dz = player.velocity.z * dt;
        if (this.checkCollision(pos.x, pos.y, pos.z + dz)) {
            player.velocity.z = 0;
        } else {
            pos.z += dz;
        }

        // Y Axis (Gravity/Jumping)
        const dy = player.velocity.y * dt;
        if (this.checkCollision(pos.x, pos.y + dy, pos.z)) {
            if (player.velocity.y < 0) player.canJump = true; // Hit ground
            player.velocity.y = 0;
        } else {
            pos.y += dy;
            player.canJump = false; // In air
        }

        // Update player position directly
        // Note: In Player.js we sync controls to this, but here we update the source
        player.position.copy(pos);
    }

    checkCollision(x, y, z) {
        // Check bounding box corners
        // Center is x,z. Bottom is y - eyeHeight?
        // Player position is conventionally "feet" or "eyes". 
        // Three.js PointerLock usually uses eye level. Let's assume input x,y,z is FEET position for physics logic.
        // But player.position from PointerLock is Eye level (approx 1.6m).
        // Let's normalize: Input y is Eye Level. Feet = y - 1.6

        const feetY = y - 1.6;
        const headY = y + 0.2; // Top of head
        const halfW = this.playerSize.x / 2;

        const minX = x - halfW;
        const maxX = x + halfW;
        const minZ = z - halfW;
        const maxZ = z + halfW;

        // Check multiple points in the box
        // Grid align
        const minBx = Math.floor(minX);
        const maxBx = Math.floor(maxX);
        const minBy = Math.floor(feetY);
        const maxBy = Math.floor(headY);
        const minBz = Math.floor(minZ);
        const maxBz = Math.floor(maxZ);

        for (let bx = minBx; bx <= maxBx; bx++) {
            for (let by = minBy; by <= maxBy; by++) {
                for (let bz = minBz; bz <= maxBz; bz++) {
                    if (this.world.getBlock(bx, by, bz) !== 0) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    // fast voxel raycast (DDA Algorithm)
    raycast(origin, direction, range) {
        let t = 0;
        let ix = Math.floor(origin.x);
        let iy = Math.floor(origin.y);
        let iz = Math.floor(origin.z);

        const stepX = (direction.x > 0) ? 1 : -1;
        const stepY = (direction.y > 0) ? 1 : -1;
        const stepZ = (direction.z > 0) ? 1 : -1;

        const txDelta = Math.abs(1 / direction.x);
        const tyDelta = Math.abs(1 / direction.y);
        const tzDelta = Math.abs(1 / direction.z);

        const xDist = (stepX > 0) ? (ix + 1 - origin.x) : (origin.x - ix);
        const yDist = (stepY > 0) ? (iy + 1 - origin.y) : (origin.y - iy);
        const zDist = (stepZ > 0) ? (iz + 1 - origin.z) : (origin.z - iz);

        let txMax = (txDelta < Infinity) ? txDelta * xDist : Infinity;
        let tyMax = (tyDelta < Infinity) ? tyDelta * yDist : Infinity;
        let tzMax = (tzDelta < Infinity) ? tzDelta * zDist : Infinity;

        let steppedIndex = -1;

        while (t <= range) {
            const id = this.world.getBlock(ix, iy, iz);
            if (id !== 0) {
                return {
                    x: ix, y: iy, z: iz,
                    face: steppedIndex, // 0=x, 1=y, 2=z
                    distance: t
                };
            }

            if (txMax < tyMax) {
                if (txMax < tzMax) {
                    ix += stepX;
                    t = txMax;
                    txMax += txDelta;
                    steppedIndex = 0;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            } else {
                if (tyMax < tzMax) {
                    iy += stepY;
                    t = tyMax;
                    tyMax += tyDelta;
                    steppedIndex = 1;
                } else {
                    iz += stepZ;
                    t = tzMax;
                    tzMax += tzDelta;
                    steppedIndex = 2;
                }
            }
        }
        return null;
    }
}
