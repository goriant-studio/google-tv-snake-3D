/**
 * snake.js — Snake Logic & 3D Rendering
 * Manages snake body, movement, growth, and collision detection
 */
import * as THREE from 'three';

// Direction vectors on the XZ grid
export const DIRECTION = {
    UP:    { x: 0, z: -1 },
    DOWN:  { x: 0, z: 1 },
    LEFT:  { x: -1, z: 0 },
    RIGHT: { x: 1, z: 0 },
};

export class Snake {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Snake state
        this.segments = [];       // Array of { gridX, gridZ, mesh }
        this.direction = DIRECTION.RIGHT;
        this.nextDirection = DIRECTION.RIGHT;
        this.growing = false;

        // Animation
        this.moveProgress = 1;    // 0..1, for smooth movement
        this.previousPositions = [];

        // Materials
        this.headMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ff88,
            emissive: 0x00ff88,
            emissiveIntensity: 0.6,
            metalness: 0.5,
            roughness: 0.3,
        });

        this.bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x00cc66,
            emissive: 0x00cc66,
            emissiveIntensity: 0.3,
            metalness: 0.4,
            roughness: 0.4,
        });

        this.tailMaterial = new THREE.MeshStandardMaterial({
            color: 0x009944,
            emissive: 0x009944,
            emissiveIntensity: 0.2,
            metalness: 0.3,
            roughness: 0.5,
        });

        this._init();
    }

    _init() {
        // Clear existing segments
        this.group.clear();
        this.segments = [];

        // Initial snake: 3 segments in the middle
        const mid = Math.floor(this.grid.gridSize / 2);
        const startPositions = [
            { gridX: mid, gridZ: mid },       // Head
            { gridX: mid - 1, gridZ: mid },   // Body
            { gridX: mid - 2, gridZ: mid },   // Tail
        ];

        startPositions.forEach((pos, i) => {
            const mesh = this._createSegmentMesh(i === 0 ? 'head' : (i === startPositions.length - 1 ? 'tail' : 'body'));
            const worldPos = this.grid.gridToWorld(pos.gridX, pos.gridZ);
            mesh.position.copy(worldPos);
            this.group.add(mesh);

            this.segments.push({
                gridX: pos.gridX,
                gridZ: pos.gridZ,
                mesh,
            });
        });

        this.direction = DIRECTION.RIGHT;
        this.nextDirection = DIRECTION.RIGHT;
        this.growing = false;
        this.moveProgress = 1;
        this.previousPositions = this.segments.map(s => ({
            x: s.mesh.position.x,
            z: s.mesh.position.z,
        }));
    }

    _createSegmentMesh(type = 'body') {
        let geometry, material;

        if (type === 'head') {
            geometry = new THREE.BoxGeometry(0.85, 0.85, 0.85);
            // Round the edges slightly
            material = this.headMaterial;
        } else if (type === 'tail') {
            geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
            material = this.tailMaterial;
        } else {
            geometry = new THREE.BoxGeometry(0.75, 0.75, 0.75);
            material = this.bodyMaterial;
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        return mesh;
    }

    /** Set next direction (prevents 180° reversal) */
    setDirection(newDir) {
        // Prevent reversing
        if (this.direction.x + newDir.x === 0 && this.direction.z + newDir.z === 0) {
            return;
        }
        this.nextDirection = newDir;
    }

    /** Discrete move on the grid — returns collision info */
    move() {
        this.direction = this.nextDirection;

        // Store previous positions for animation
        this.previousPositions = this.segments.map(s => ({
            x: s.mesh.position.x,
            z: s.mesh.position.z,
        }));

        // Calculate new head position
        const head = this.segments[0];
        const newGridX = head.gridX + this.direction.x;
        const newGridZ = head.gridZ + this.direction.z;

        // Check wall collision
        if (!this.grid.isInBounds(newGridX, newGridZ)) {
            return { collision: 'wall' };
        }

        // Check self collision
        for (let i = 0; i < this.segments.length - (this.growing ? 0 : 1); i++) {
            if (this.segments[i].gridX === newGridX && this.segments[i].gridZ === newGridZ) {
                return { collision: 'self' };
            }
        }

        // Move: shift all segments
        if (!this.growing) {
            // Remove tail
            const tail = this.segments.pop();
            this.group.remove(tail.mesh);
            tail.mesh.geometry.dispose();
        }
        this.growing = false;

        // Add new head
        const newMesh = this._createSegmentMesh('head');
        const newWorldPos = this.grid.gridToWorld(newGridX, newGridZ);
        // Set position to previous head position for animation
        const prevHeadWorld = this.grid.gridToWorld(head.gridX, head.gridZ);
        newMesh.position.copy(prevHeadWorld);
        this.group.add(newMesh);

        // Demote old head to body
        head.mesh.geometry.dispose();
        const bodyMesh = this._createSegmentMesh('body');
        bodyMesh.position.copy(head.mesh.position);
        this.group.remove(head.mesh);
        this.group.add(bodyMesh);
        head.mesh = bodyMesh;

        // Update last segment to tail
        if (this.segments.length > 1) {
            const last = this.segments[this.segments.length - 1];
            const tailMesh = this._createSegmentMesh('tail');
            tailMesh.position.copy(last.mesh.position);
            this.group.remove(last.mesh);
            last.mesh.geometry.dispose();
            this.group.add(tailMesh);
            last.mesh = tailMesh;
        }

        // Insert new head at front
        this.segments.unshift({
            gridX: newGridX,
            gridZ: newGridZ,
            mesh: newMesh,
        });

        // Recalculate previous positions for smooth lerp
        this.previousPositions = [];
        this.previousPositions.push({ x: prevHeadWorld.x, z: prevHeadWorld.z });
        for (let i = 1; i < this.segments.length; i++) {
            this.previousPositions.push({
                x: this.segments[i].mesh.position.x,
                z: this.segments[i].mesh.position.z,
            });
        }

        this.moveProgress = 0;

        return {
            collision: null,
            headX: newGridX,
            headZ: newGridZ,
        };
    }

    /** Smooth animation update, called each frame */
    updateAnimation(dt, moveInterval) {
        if (this.moveProgress >= 1) return;

        this.moveProgress = Math.min(1, this.moveProgress + dt / moveInterval);
        const t = this._easeInOutQuad(this.moveProgress);

        for (let i = 0; i < this.segments.length; i++) {
            const seg = this.segments[i];
            const targetPos = this.grid.gridToWorld(seg.gridX, seg.gridZ);
            const prevPos = this.previousPositions[i];
            if (prevPos) {
                seg.mesh.position.x = prevPos.x + (targetPos.x - prevPos.x) * t;
                seg.mesh.position.z = prevPos.z + (targetPos.z - prevPos.z) * t;
            }
        }

        // Subtle bob animation for head
        const head = this.segments[0];
        if (head) {
            head.mesh.position.y = 0.5 + Math.sin(this.moveProgress * Math.PI) * 0.05;
        }
    }

    _easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    /** Mark snake to grow on next move */
    grow() {
        this.growing = true;
    }

    /** Get head grid position */
    getHeadPosition() {
        return { gridX: this.segments[0].gridX, gridZ: this.segments[0].gridZ };
    }

    /** Get all occupied positions */
    getOccupiedPositions() {
        return this.segments.map(s => ({ gridX: s.gridX, gridZ: s.gridZ }));
    }

    /** Reset snake to initial state */
    reset() {
        this._init();
    }

    /** Dispose all resources */
    dispose() {
        this.segments.forEach(s => {
            s.mesh.geometry.dispose();
        });
        this.group.clear();
    }
}
