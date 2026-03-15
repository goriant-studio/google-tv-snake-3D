/**
 * food.js — Food Spawning & 3D Rendering
 * Manages food placement, visual effects, and pickup detection
 */
import * as THREE from 'three';

export class Food {
    constructor(scene, grid) {
        this.scene = scene;
        this.grid = grid;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this.gridX = -1;
        this.gridZ = -1;
        this.mesh = null;
        this.glowLight = null;
        this.particles = [];
        this.time = 0;
    }

    /** Spawn food at a random position, avoiding occupied tiles */
    spawn(occupiedPositions) {
        // Remove old food
        this._clearMesh();

        // Find valid position
        let attempts = 0;
        do {
            this.gridX = Math.floor(Math.random() * this.grid.gridSize);
            this.gridZ = Math.floor(Math.random() * this.grid.gridSize);
            attempts++;
        } while (
            attempts < 200 &&
            occupiedPositions.some(p => p.gridX === this.gridX && p.gridZ === this.gridZ)
        );

        // Create food mesh — glowing icosahedron
        const geometry = new THREE.IcosahedronGeometry(0.35, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0xff00aa,
            emissive: 0xff00aa,
            emissiveIntensity: 0.8,
            metalness: 0.6,
            roughness: 0.2,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        const worldPos = this.grid.gridToWorld(this.gridX, this.gridZ);
        this.mesh.position.copy(worldPos);
        this.mesh.position.y = 0.5;
        this.mesh.castShadow = true;
        this.group.add(this.mesh);

        // Inner glow core
        const coreGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.6,
        });
        this.core = new THREE.Mesh(coreGeom, coreMat);
        this.mesh.add(this.core);

        // Point light for glow
        this.glowLight = new THREE.PointLight(0xff00aa, 3, 5);
        this.glowLight.position.copy(worldPos);
        this.glowLight.position.y = 0.5;
        this.group.add(this.glowLight);

        // Spawn ambient particles
        this._createAmbientParticles(worldPos);
    }

    _createAmbientParticles(center) {
        const particleCount = 8;
        const particleGeom = new THREE.SphereGeometry(0.04, 4, 4);
        const particleMat = new THREE.MeshBasicMaterial({
            color: 0xff00aa,
            transparent: true,
            opacity: 0.6,
        });

        for (let i = 0; i < particleCount; i++) {
            const particle = new THREE.Mesh(particleGeom, particleMat.clone());
            particle.userData = {
                angle: (i / particleCount) * Math.PI * 2,
                radius: 0.5 + Math.random() * 0.3,
                speed: 0.5 + Math.random() * 1,
                yOffset: Math.random() * 0.5,
            };
            particle.position.copy(center);
            this.group.add(particle);
            this.particles.push(particle);
        }
    }

    _clearMesh() {
        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.group.remove(this.mesh);
            this.mesh = null;
        }
        if (this.glowLight) {
            this.group.remove(this.glowLight);
            this.glowLight = null;
        }
        this.particles.forEach(p => {
            p.geometry.dispose();
            p.material.dispose();
            this.group.remove(p);
        });
        this.particles = [];
    }

    /** Update floating animation */
    update(dt) {
        this.time += dt;

        if (this.mesh) {
            // Float up and down
            this.mesh.position.y = 0.5 + Math.sin(this.time * 3) * 0.15;
            // Rotate
            this.mesh.rotation.y += dt * 2;
            this.mesh.rotation.x += dt * 0.5;

            // Pulse glow
            if (this.glowLight) {
                this.glowLight.intensity = 3 + Math.sin(this.time * 4) * 1.5;
                this.glowLight.position.y = this.mesh.position.y;
            }
        }

        // Animate particles
        this.particles.forEach(p => {
            const { angle, radius, speed, yOffset } = p.userData;
            const worldPos = this.grid.gridToWorld(this.gridX, this.gridZ);
            p.position.x = worldPos.x + Math.cos(angle + this.time * speed) * radius;
            p.position.z = worldPos.z + Math.sin(angle + this.time * speed) * radius;
            p.position.y = 0.3 + yOffset + Math.sin(this.time * speed * 2) * 0.2;
            p.material.opacity = 0.3 + Math.sin(this.time * speed * 3) * 0.3;
        });
    }

    /** Check if snake head is at food position */
    checkPickup(headX, headZ) {
        return headX === this.gridX && headZ === this.gridZ;
    }

    /** Get position */
    getPosition() {
        return { gridX: this.gridX, gridZ: this.gridZ };
    }

    /** Dispose resources */
    dispose() {
        this._clearMesh();
        this.group.clear();
    }
}
