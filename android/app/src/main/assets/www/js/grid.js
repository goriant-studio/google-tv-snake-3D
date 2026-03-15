/**
 * grid.js — 3D Arena / Grid Rendering
 * Creates the neon grid floor and arena boundaries
 */
import * as THREE from 'three';

export class Grid {
    constructor(scene, gridSize = 20) {
        this.scene = scene;
        this.gridSize = gridSize;
        this.cellSize = 1;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        this._createFloor();
        this._createGridLines();
        this._createWalls();
        this._createCornerLights();
    }

    _createFloor() {
        const size = this.gridSize * this.cellSize;
        const geometry = new THREE.PlaneGeometry(size, size);
        const material = new THREE.MeshStandardMaterial({
            color: 0x050510,
            metalness: 0.8,
            roughness: 0.4,
            transparent: true,
            opacity: 0.9,
        });
        this.floor = new THREE.Mesh(geometry, material);
        this.floor.rotation.x = -Math.PI / 2;
        this.floor.position.set(0, -0.01, 0);
        this.floor.receiveShadow = true;
        this.group.add(this.floor);
    }

    _createGridLines() {
        const size = this.gridSize * this.cellSize;
        const half = size / 2;

        // Grid line material
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.12,
        });

        // Create grid lines
        for (let i = 0; i <= this.gridSize; i++) {
            const pos = -half + i * this.cellSize;

            // Z-axis lines
            const zGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(pos, 0.01, -half),
                new THREE.Vector3(pos, 0.01, half),
            ]);
            this.group.add(new THREE.Line(zGeom, lineMaterial));

            // X-axis lines
            const xGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-half, 0.01, pos),
                new THREE.Vector3(half, 0.01, pos),
            ]);
            this.group.add(new THREE.Line(xGeom, lineMaterial));
        }

        // Border lines (brighter)
        const borderMaterial = new THREE.LineBasicMaterial({
            color: 0x00f0ff,
            transparent: true,
            opacity: 0.5,
        });

        const borderPoints = [
            new THREE.Vector3(-half, 0.02, -half),
            new THREE.Vector3(half, 0.02, -half),
            new THREE.Vector3(half, 0.02, half),
            new THREE.Vector3(-half, 0.02, half),
            new THREE.Vector3(-half, 0.02, -half),
        ];
        const borderGeom = new THREE.BufferGeometry().setFromPoints(borderPoints);
        this.group.add(new THREE.Line(borderGeom, borderMaterial));
    }

    _createWalls() {
        const size = this.gridSize * this.cellSize;
        const half = size / 2;
        const wallHeight = 0.5;

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x00f0ff,
            emissive: 0x00f0ff,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.15,
            metalness: 0.9,
            roughness: 0.1,
        });

        const wallPositions = [
            { pos: [0, wallHeight / 2, -half], scale: [size, wallHeight, 0.05] },
            { pos: [0, wallHeight / 2, half], scale: [size, wallHeight, 0.05] },
            { pos: [-half, wallHeight / 2, 0], scale: [0.05, wallHeight, size] },
            { pos: [half, wallHeight / 2, 0], scale: [0.05, wallHeight, size] },
        ];

        wallPositions.forEach(({ pos, scale }) => {
            const geom = new THREE.BoxGeometry(1, 1, 1);
            const mesh = new THREE.Mesh(geom, wallMaterial.clone());
            mesh.position.set(...pos);
            mesh.scale.set(...scale);
            this.group.add(mesh);
        });
    }

    _createCornerLights() {
        const size = this.gridSize * this.cellSize;
        const half = size / 2;
        const corners = [
            [-half, 0.5, -half],
            [half, 0.5, -half],
            [-half, 0.5, half],
            [half, 0.5, half],
        ];

        corners.forEach(pos => {
            const light = new THREE.PointLight(0x00f0ff, 2, 8);
            light.position.set(...pos);
            this.group.add(light);

            // Small glowing sphere at corner
            const sphereGeom = new THREE.SphereGeometry(0.15, 8, 8);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: 0x00f0ff,
                transparent: true,
                opacity: 0.8,
            });
            const sphere = new THREE.Mesh(sphereGeom, sphereMat);
            sphere.position.set(...pos);
            this.group.add(sphere);
        });
    }

    /** Convert grid coordinates to world position */
    gridToWorld(gridX, gridZ) {
        const half = this.gridSize / 2;
        return new THREE.Vector3(
            (gridX - half + 0.5) * this.cellSize,
            0.5,
            (gridZ - half + 0.5) * this.cellSize
        );
    }

    /** Check if grid position is within bounds */
    isInBounds(gridX, gridZ) {
        return gridX >= 0 && gridX < this.gridSize && gridZ >= 0 && gridZ < this.gridSize;
    }
}
