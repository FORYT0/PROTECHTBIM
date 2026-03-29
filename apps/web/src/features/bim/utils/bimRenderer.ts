import * as THREE from 'three';
import { IFCLoader } from 'web-ifc-three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ViewerState } from '../types/bim.types';

export class BIMRenderer {
  private container: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
  private ifcLoader!: IFCLoader;
  private loadedModels = new Map<string, THREE.Object3D>();
  private sectionPlane: THREE.Plane | null = null;
  private animFrameId = 0;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private onSelectCallback?: (expressId: number) => void;

  constructor(container: HTMLDivElement) {
    this.container = container;
  }

  async init(): Promise<void> {
    const w = this.container.clientWidth || 800;
    const h = this.container.clientHeight || 600;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0f1a);

    // Camera
    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 5000);
    this.camera.position.set(10, 10, 10);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 50);
    dir.castShadow = true;
    this.scene.add(ambient, dir);

    // Grid
    const grid = new THREE.GridHelper(100, 50, 0x1a1d33, 0x1a1d33);
    this.scene.add(grid);

    // IFC Loader
    this.ifcLoader = new IFCLoader();
    await this.ifcLoader.ifcManager.setWasmPath('/wasm/');
    await this.ifcLoader.ifcManager.applyWebIfcConfig({ USE_FAST_BOOLS: true });

    // Resize observer
    const ro = new ResizeObserver(() => this.onResize());
    ro.observe(this.container);

    // Click handler
    this.renderer.domElement.addEventListener('click', this.onClick);

    this.animate();
  }

  private animate = () => {
    this.animFrameId = requestAnimationFrame(this.animate);
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  private onClick = (e: MouseEvent) => {
    if (!this.onSelectCallback) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hits = this.raycaster.intersectObjects(this.scene.children, true);
    if (hits.length > 0) {
      const hit = hits[0];
      const modelId = this.getModelIdForObject(hit.object);
      if (modelId !== null) {
        this.ifcLoader.ifcManager.getExpressId(hit.object.geometry, hit.face!.a)
          .then((id) => { if (id !== undefined) this.onSelectCallback!(id); })
          .catch(() => {});
      }
    }
  };

  private getModelIdForObject(obj: THREE.Object3D): number | null {
    let current: THREE.Object3D | null = obj;
    while (current) {
      if ((current as any).modelID !== undefined) return (current as any).modelID;
      current = current.parent;
    }
    return null;
  }

  async loadIFC(url: string, modelKey: string): Promise<void> {
    const model = await this.ifcLoader.loadAsync(url);
    this.scene.add(model);
    this.loadedModels.set(modelKey, model);
    this.fitAll();
  }

  unloadModel(modelKey: string): void {
    const obj = this.loadedModels.get(modelKey);
    if (obj) {
      this.scene.remove(obj);
      this.loadedModels.delete(modelKey);
    }
  }

  setRenderMode(mode: ViewerState['renderMode']): void {
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        const mat = obj.material as THREE.MeshLambertMaterial;
        switch (mode) {
          case 'wireframe':
            mat.wireframe = true;
            mat.transparent = false;
            mat.opacity = 1;
            break;
          case 'transparent':
            mat.wireframe = false;
            mat.transparent = true;
            mat.opacity = 0.4;
            break;
          case 'xray':
            mat.wireframe = false;
            mat.transparent = true;
            mat.opacity = 0.15;
            break;
          default:
            mat.wireframe = false;
            mat.transparent = false;
            mat.opacity = 1;
        }
      }
    });
  }

  setBackground(bg: ViewerState['background']): void {
    const colors: Record<string, number> = {
      dark: 0x0d0f1a,
      light: 0xf0f4f8,
      gradient: 0x1a1d33,
    };
    this.scene.background = new THREE.Color(colors[bg] ?? 0x0d0f1a);
  }

  toggleSectionPlane(axis: 'x' | 'y' | 'z', constant: number): boolean {
    if (this.sectionPlane) {
      this.renderer.clippingPlanes = [];
      this.sectionPlane = null;
      return false;
    }
    const normal = axis === 'x' ? new THREE.Vector3(-1, 0, 0)
      : axis === 'y' ? new THREE.Vector3(0, -1, 0)
      : new THREE.Vector3(0, 0, -1);
    this.sectionPlane = new THREE.Plane(normal, constant);
    this.renderer.clippingPlanes = [this.sectionPlane];
    this.renderer.localClippingEnabled = true;
    return true;
  }

  fitAll(): void {
    const box = new THREE.Box3();
    this.scene.traverse((obj) => {
      if (obj instanceof THREE.Mesh) box.expandByObject(obj);
    });
    if (box.isEmpty()) return;
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    this.camera.position.set(center.x + maxDim, center.y + maxDim * 0.8, center.z + maxDim);
    this.controls.target.copy(center);
    this.controls.update();
  }

  takeScreenshot(): string {
    this.renderer.render(this.scene, this.camera);
    return this.renderer.domElement.toDataURL('image/png');
  }

  onSelect(cb: (expressId: number) => void): void {
    this.onSelectCallback = cb;
  }

  dispose(): void {
    cancelAnimationFrame(this.animFrameId);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
}
