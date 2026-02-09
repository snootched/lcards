/**
 * WebGL Background Renderer
 * 3D grid + volumetric nebula + interactive controls using Three.js
 * 
 * @module components/backgrounds/WebGLBackgroundRenderer
 */
import * as THREE from 'three';
import { lcardsLog } from '../../utils/lcards-logging.js';

export class WebGLBackgroundRenderer {
  constructor(container, config) {
    this.container = container;
    this.config = config;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrame = null;
    this.gridLayers = [];
    this.nebulaParticles = null;
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    
    // Performance constants
    this.PARTICLE_REDUCTION_FACTOR = 0.5; // Reduce to 50% on low FPS
  }

  /**
   * Check if WebGL is supported
   * @returns {boolean} True if WebGL is available
   */
  static isSupported() {
    try {
      const canvas = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && 
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
    } catch (e) {
      return false;
    }
  }

  /**
   * Initialize Three.js scene and renderer
   * @returns {boolean} True if initialization succeeded
   */
  init() {
    if (!WebGLBackgroundRenderer.isSupported()) {
      lcardsLog.warn('[WebGL] Not supported, fallback required');
      return false;
    }

    try {
      // Setup scene
      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.FogExp2(0x000000, 0.0008);

      // Setup camera
      const aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 2000);
      this.camera.position.z = this.config.params?.grid?.perspective || 1000;

      // Setup renderer
      this.renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap for performance
      this.container.appendChild(this.renderer.domElement);

      // Create 3D grid layers
      this._createGrid();

      // Create volumetric nebula if enabled
      if (this.config.params?.nebula?.volumetric) {
        this._createVolumetricNebula();
      }

      // Setup interactive controls
      if (this.config.params?.interactive) {
        this._setupInteractiveControls();
      }

      // Setup parallax effect
      if (this.config.params?.parallax) {
        this._setupParallax();
      }

      // Listen for performance events
      this._setupPerformanceListener();

      // Start render loop
      this.animate();
      
      lcardsLog.info('[WebGL] Background renderer initialized successfully');
      return true;
    } catch (error) {
      lcardsLog.error('[WebGL] Initialization failed:', error);
      return false;
    }
  }

  /**
   * Create 3D grid with depth layers
   * @private
   */
  _createGrid() {
    const depth = this.config.params?.grid?.depth || 5;
    const spacing = 100;
    const gridSize = 10;

    for (let z = 0; z < depth; z++) {
      const geometry = new THREE.BufferGeometry();
      const positions = [];
      
      // Generate grid lines
      for (let i = -gridSize; i <= gridSize; i++) {
        // Horizontal lines
        positions.push(-gridSize * spacing, i * spacing, -z * 200);
        positions.push(gridSize * spacing, i * spacing, -z * 200);
        // Vertical lines
        positions.push(i * spacing, -gridSize * spacing, -z * 200);
        positions.push(i * spacing, gridSize * spacing, -z * 200);
      }

      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      
      const material = new THREE.LineBasicMaterial({ 
        color: 0x333333,
        opacity: 1 - (z / depth) * 0.5,
        transparent: true
      });

      const grid = new THREE.LineSegments(geometry, material);
      this.scene.add(grid);
      this.gridLayers.push(grid);
    }
  }

  /**
   * Create volumetric nebula particle system
   * @private
   */
  _createVolumetricNebula() {
    const preset = this.config.params?.nebula?.preset || 'default';
    const particleCount = this.config.params?.nebula?.particle_count || 5000;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    // Nebula color palette based on preset
    const palettes = {
      default: [
        { r: 0.4, g: 0.3, b: 0.8 }, // Purple
        { r: 0.3, g: 0.4, b: 0.9 }, // Blue
        { r: 0.8, g: 0.3, b: 0.6 }  // Pink
      ],
      orion: [
        { r: 1.0, g: 0.7, b: 0.3 }, // Orange
        { r: 1.0, g: 0.85, b: 0.0 }, // Gold
        { r: 0.7, g: 0.85, b: 0.9 }  // Light blue
      ],
      cosmic_embers: [
        { r: 1.0, g: 0.27, b: 0.0 }, // OrangeRed
        { r: 1.0, g: 0.85, b: 0.0 }, // Gold
        { r: 0.55, g: 0.0, b: 0.0 }  // DarkRed
      ]
    };

    const palette = palettes[preset] || palettes.default;

    for (let i = 0; i < particleCount * 3; i += 3) {
      // Position (spherical distribution)
      const radius = Math.random() * 800 + 200;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      
      positions[i] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i + 2] = radius * Math.cos(phi) - 500;

      // Color (pick from palette with variation)
      const colorIdx = Math.floor(Math.random() * palette.length);
      const baseColor = palette[colorIdx];
      colors[i] = baseColor.r + (Math.random() - 0.5) * 0.2;
      colors[i + 1] = baseColor.g + (Math.random() - 0.5) * 0.2;
      colors[i + 2] = baseColor.b + (Math.random() - 0.5) * 0.2;

      // Size variation
      sizes[i / 3] = Math.random() * 4 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      size: 3,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });

    this.nebulaParticles = new THREE.Points(geometry, material);
    this.scene.add(this.nebulaParticles);
  }

  /**
   * Setup drag-to-rotate controls
   * @private
   */
  _setupInteractiveControls() {
    const canvas = this.renderer.domElement;

    canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      const deltaY = e.clientY - this.previousMousePosition.y;

      this.scene.rotation.y += deltaX * 0.005;
      this.scene.rotation.x += deltaY * 0.005;

      // Clamp x rotation to prevent flipping
      this.scene.rotation.x = Math.max(-Math.PI / 4, Math.min(Math.PI / 4, this.scene.rotation.x));

      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    const stopDragging = () => {
      this.isDragging = false;
      canvas.style.cursor = 'grab';
    };

    canvas.addEventListener('mouseup', stopDragging);
    canvas.addEventListener('mouseleave', stopDragging);

    canvas.style.cursor = 'grab';
  }

  /**
   * Setup parallax mouse tracking
   * @private
   */
  _setupParallax() {
    this.container.addEventListener('mousemove', (e) => {
      if (this.isDragging) return; // Don't parallax while dragging

      const rect = this.container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      this.camera.position.x = x * 100;
      this.camera.position.y = -y * 100;
      this.camera.lookAt(this.scene.position);
    });
  }

  /**
   * Setup performance degradation listener
   * @private
   */
  _setupPerformanceListener() {
    window.addEventListener('lcards:performance-check', (e) => {
      if (e.detail.shouldDisable3D) {
        lcardsLog.warn('[WebGL] Low FPS detected, falling back to canvas');
        this.destroy();
        // Emit event to trigger canvas fallback
        const fallbackEvent = new CustomEvent('lcards:webgl-fallback-required', {
          detail: { reason: 'low_fps', fps: e.detail.fps }
        });
        window.dispatchEvent(fallbackEvent);
      } else if (e.detail.shouldReduceEffects && this.nebulaParticles) {
        // Reduce particle count
        const currentCount = this.nebulaParticles.geometry.attributes.position.count;
        const reducedCount = Math.floor(currentCount * this.PARTICLE_REDUCTION_FACTOR);
        lcardsLog.info(`[WebGL] Reducing nebula particles: ${currentCount} → ${reducedCount}`);
        this._updateParticleCount(reducedCount);
      }
    });
  }

  /**
   * Reduce particle count for performance
   * @private
   */
  _updateParticleCount(newCount) {
    if (!this.nebulaParticles) return;
    
    const geometry = this.nebulaParticles.geometry;
    geometry.setDrawRange(0, newCount);
    geometry.attributes.position.needsUpdate = true;
  }

  /**
   * Animation loop
   */
  animate() {
    this.animationFrame = requestAnimationFrame(() => this.animate());

    // Auto-rotate if not interactive
    if (!this.config.params?.interactive) {
      this.scene.rotation.y += 0.0005;
    }

    // Animate nebula particles (slow drift)
    if (this.nebulaParticles) {
      this.nebulaParticles.rotation.y += 0.0002;
    }

    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Handle window resize
   */
  handleResize() {
    if (!this.camera || !this.renderer) return;

    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /**
   * Clean up resources
   */
  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }

    // Dispose geometries and materials
    this.gridLayers.forEach(grid => {
      grid.geometry.dispose();
      grid.material.dispose();
    });

    if (this.nebulaParticles) {
      this.nebulaParticles.geometry.dispose();
      this.nebulaParticles.material.dispose();
    }

    // Dispose renderer
    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
  }
}
