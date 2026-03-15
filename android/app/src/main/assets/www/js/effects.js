/**
 * effects.js — Particle Effects & Post-Processing
 * Particle bursts, bloom, and screen effects
 */
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

export class Effects {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        this.particleSystems = [];

        this._setupComposer();
    }

    _setupComposer() {
        this.composer = new EffectComposer(this.renderer);

        // Main render pass
        const renderPass = new RenderPass(this.scene, this.camera);
        this.composer.addPass(renderPass);

        // Bloom pass for neon glow
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(window.innerWidth, window.innerHeight),
            0.8,    // strength
            0.4,    // radius
            0.85    // threshold
        );
        this.composer.addPass(this.bloomPass);
    }

    /** Resize composer on window resize */
    resize(width, height) {
        this.composer.setSize(width, height);
    }

    /** Create a burst of particles at a world position */
    createBurst(position, color = 0xff00aa, count = 20) {
        const particles = [];
        const geometry = new THREE.SphereGeometry(0.08, 4, 4);

        for (let i = 0; i < count; i++) {
            const material = new THREE.MeshBasicMaterial({
                color,
                transparent: true,
                opacity: 1,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(position);

            // Random velocity
            const speed = 2 + Math.random() * 4;
            const angle = Math.random() * Math.PI * 2;
            const upSpeed = 1 + Math.random() * 3;

            mesh.userData = {
                velocity: new THREE.Vector3(
                    Math.cos(angle) * speed,
                    upSpeed,
                    Math.sin(angle) * speed
                ),
                life: 0.5 + Math.random() * 0.5,
                maxLife: 0.5 + Math.random() * 0.5,
            };

            this.scene.add(mesh);
            particles.push(mesh);
        }

        this.particleSystems.push({ particles, time: 0 });
    }

    /** Update all particle systems */
    update(dt) {
        for (let i = this.particleSystems.length - 1; i >= 0; i--) {
            const system = this.particleSystems[i];
            system.time += dt;
            let allDead = true;

            for (let j = system.particles.length - 1; j >= 0; j--) {
                const p = system.particles[j];
                const { velocity, life, maxLife } = p.userData;

                p.userData.life -= dt;

                if (p.userData.life <= 0) {
                    this.scene.remove(p);
                    p.geometry.dispose();
                    p.material.dispose();
                    system.particles.splice(j, 1);
                    continue;
                }

                allDead = false;

                // Movement
                p.position.x += velocity.x * dt;
                p.position.y += velocity.y * dt;
                p.position.z += velocity.z * dt;

                // Gravity
                velocity.y -= 8 * dt;

                // Fade out
                const lifeRatio = p.userData.life / maxLife;
                p.material.opacity = lifeRatio;
                p.scale.setScalar(lifeRatio);
            }

            if (allDead || system.particles.length === 0) {
                this.particleSystems.splice(i, 1);
            }
        }
    }

    /** Render with post-processing */
    render() {
        this.composer.render();
    }

    /** Dispose */
    dispose() {
        this.particleSystems.forEach(system => {
            system.particles.forEach(p => {
                this.scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
            });
        });
        this.particleSystems = [];
    }
}
