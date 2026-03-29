import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ViewerState } from '../types/bim.types';

export class BIMRenderer {
  private container: HTMLDivElement;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private controls!: OrbitControls;
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

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d0f1a);

    this.camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 5000);
    this.camera.position.set(10, 10, 10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(w, h);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;

    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(50, 100, 50);
    dir.castShadow = true;
    this.scene.add(ambient, dir);

    const grid = new THREE.GridHelper(100, 50, 0x1a1d33, 0x1a1d33);
    this.scene.add(grid);

    const ro = new ResizeObserver(() => this.onResize());
    ro.observe(this.container);

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
      const expressId = (hit.object as any).userData?.expressId;
      if (expressId !== undefined) this.onSelectCallback(expressId);
    }
  };

  /**
   * Load an IFC file from a URL using web-ifc directly.
   * Builds Three.js meshes from the geometry data.
   */
  async loadIFC(url: string, modelKey: string): Promise<void> {
    // Dynamically import web-ifc to avoid bundling issues
    const WebIFC = await import('web-ifc');
    const ifcApi = new WebIFC.IfcAPI();
    ifcApi.SetWasmPath('/wasm/');
    await ifcApi.Init();

    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const data = new Uint8Array(buffer);
    const modelId = ifcApi.OpenModel(data);

    const group = new THREE.Group();
    group.name = modelKey;

    // Get all meshes from the model
    ifcApi.StreamAllMeshes(modelId, (mesh) => {
      const placedGeometries = mesh.geometries;
      for (let i = 0; i < placedGeometries.size(); i++) {
        const placedGeom = placedGeometries.get(i);
        const geomData = ifcApi.GetGeometry(modelId, placedGeom.geometryExpressID);
        const verts = ifcApi.GetRawLineData(modelId, placedGeom.geometryExpressID);

        // Build BufferGeometry from flat arrays
        const vertices = ifcApi.GetVertexArray(geomData.GetVertexData(), geomData.GetVertexDataSize());
        const indices = ifcApi.GetIndexArray(geomData.GetIndexData(), geomData.GetIndexDataSize());

        const geometry = new THREE.BufferGeometry();
        // vertices array is [x,y,z, nx,ny,nz, ...] interleaved
        const posArr = new Float32Array(vertices.length / 2);
        const normArr = new Float32Array(vertices.length / 2);
        for (let j = 0; j < vertices.length; j += 6) {
          const k = j / 2;
          posArr[k] = vertices[j];
          posArr[k + 1] = vertices[j + 1];
          posArr[k + 2] = vertices[j + 2];
          normArr[k] = vertices[j + 3];
          normArr[k + 1] = vertices[j + 4];
          normArr[k + 2] = vertices[j + 5];
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
        geometry.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));

        const color = placedGeom.color;
        const material = new THREE.MeshLambertMaterial({
          color: new THREE.Color(color.x, color.y, color.z),
          transparent: color.w !== 1,
          opacity: color.w,
          side: THREE.DoubleSide,
        });

        const matrix = new THREE.Matrix4().fromArray(placedGeom.flatTransformation);
        const meshObj = new THREE.Mesh(geometry, material);
        meshObj.applyMatrix4(matrix);
        meshObj.userData.expressId = mesh.expressID;

        group.add(meshObj);
        geomData.delete();
      }
    });

    ifcApi.CloseModel(modelId);

    this.scene.add(group);
    this.loadedModels.set(modelKey, group);
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
            mat.wireframe = true; mat.transparent = false; mat.opacity = 1; break;
          case 'transparent':
            mat.wireframe = false; mat.transparent = true; mat.opacity = 0.4; break;
          case 'xray':
            mat.wireframe = false; mat.transparent = true; mat.opacity = 0.15; break;
          default:
            mat.wireframe = false; mat.transparent = false; mat.opacity = 1;
        }
      }
    });
  }

  setBackground(bg: ViewerState['background']): void {
    const colors: Record<string, number> = { dark: 0x0d0f1a, light: 0xf0f4f8, gradient: 0x1a1d33 };
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
    this.scene.traverse((obj) => { if (obj instanceof THREE.Mesh) box.expandByObject(obj); });
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
