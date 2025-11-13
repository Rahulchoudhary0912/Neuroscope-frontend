import { useEffect, useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";
import "../styles/model3d.css";

const Model3D = () => {
  const containerRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const currentModelRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastObjectUrlRef = useRef(null);
  const groundRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [modelInfo, setModelInfo] = useState(null);
  const [isWireframe, setIsWireframe] = useState(false);
  const [highlight, setHighlight] = useState(false);
  const [modelColor, setModelColor] = useState("#64b5f6");

  /** ------------------------
   *  Initialize Three.js scene
   * ------------------------ */
  useEffect(() => {
    const loadScript = (src) =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const el = document.createElement("script");
        el.src = src;
        el.onload = resolve;
        el.onerror = reject;
        document.head.appendChild(el);
      });

    const initScene = async () => {
      if (!window.THREE) {
        await loadScript("https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js");
      }

      // Load controls and loaders from examples if missing
      if (!window.THREE.OrbitControls) {
        await loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js");
      }
      if (!window.THREE.GLTFLoader) {
        await loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js");
      }
      if (!window.THREE.OBJLoader) {
        await loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js");
      }
      if (!window.THREE.STLLoader) {
        await loadScript("https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/STLLoader.js");
      }

      const { THREE } = window;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a1929);
      sceneRef.current = scene;

      const initialWidth = containerRef.current.clientWidth;
      const initialHeight = containerRef.current.clientHeight || window.innerHeight * 0.65;
      const camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 2000);
      camera.position.set(0, 1, 5);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(initialWidth, initialHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Lights
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      const dirLight = new THREE.DirectionalLight(0x64b5f6, 0.9);
      dirLight.position.set(3, 6, 3);
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 50;
      scene.add(dirLight);

      // Ground plane
      const planeGeo = new THREE.PlaneGeometry(200, 200);
      const planeMat = new THREE.MeshStandardMaterial({ color: 0x0f1f33, roughness: 0.85, metalness: 0.0 });
      const ground = new THREE.Mesh(planeGeo, planeMat);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;
      ground.receiveShadow = true;
      scene.add(ground);
      groundRef.current = ground;

      // Controls
      const controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Grid + Particles
      createParticles(scene);

      // Animation
      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      window.addEventListener("resize", handleResize);
    };

    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current || !containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const height = clientHeight || window.innerHeight * 0.65;
      cameraRef.current.aspect = clientWidth / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, height);
    };

    const createParticles = (scene) => {
      const { THREE } = window;
      const count = 800;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) pos[i] = (Math.random() - 0.5) * 20;
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.05,
        color: 0x64b5f6,
        transparent: true,
        opacity: 0.7,
      });
      scene.add(new THREE.Points(geo, mat));
    };

    initScene();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (rendererRef.current?.domElement)
        containerRef.current?.removeChild(rendererRef.current.domElement);
    };
  }, []);

  /** ------------------------
   *  File Handling
   * ------------------------ */
  const handleFileInputChange = (e) => setSelectedFiles(Array.from(e.target.files || []));
  const handleDrop = (e) => {
    e.preventDefault();
    setHighlight(false);
    setSelectedFiles(Array.from(e.dataTransfer.files || []));
  };

  /** ------------------------
   *  Load Model
   * ------------------------ */
  const loadModel = useCallback(async () => {
    const { THREE } = window;
    if (!selectedFiles.length) return;
    setLoading(true);
    setProgress(0);
    clearModel();

    const file = selectedFiles[0];
    const ext = file.name.split(".").pop().toLowerCase();
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
    const url = URL.createObjectURL(file);
    lastObjectUrlRef.current = url;

    const onProgress = (xhr) => {
      if (xhr.total) setProgress(((xhr.loaded / xhr.total) * 100).toFixed(1));
    };

    try {
      let loader;
      if (ext === "glb" || ext === "gltf") loader = new THREE.GLTFLoader();
      else if (ext === "obj") loader = new THREE.OBJLoader();
      else if (ext === "stl") loader = new THREE.STLLoader();
      else return alert("Unsupported format. Try .glb/.gltf/.obj/.stl");

      loader.load(
        url,
        (model) => {
          const root = model.scene || model;
          root.traverse((c) => {
            if (c.isMesh) {
              c.castShadow = true;
            }
          });
          sceneRef.current.add(root);
          currentModelRef.current = root;
          normalizeAndPlaceAboveGround(root);
          fitCamera(root);
          computeModelInfo(file, root);
          setLoading(false);
        },
        onProgress,
        (err) => {
          console.error(err);
          alert("Error loading model");
          setLoading(false);
        }
      );
    } catch (err) {
      console.error(err);
      alert("Model failed to load.");
      setLoading(false);
    }
  }, [selectedFiles]);

  /** ------------------------
   *  Helpers
   * ------------------------ */
  const clearModel = () => {
    if (currentModelRef.current && sceneRef.current) {
      sceneRef.current.remove(currentModelRef.current);
      currentModelRef.current.traverse((child) => {
        if (child.isMesh) {
          child.geometry.dispose();
          if (child.material.map) child.material.map.dispose();
          child.material.dispose();
        }
      });
      currentModelRef.current = null;
    }
    if (lastObjectUrlRef.current) {
      URL.revokeObjectURL(lastObjectUrlRef.current);
      lastObjectUrlRef.current = null;
    }
  };

  const fitCamera = (obj) => {
    const { THREE } = window;
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = cameraRef.current.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;
    cameraRef.current.position.set(center.x, center.y, center.z + cameraZ);
    controlsRef.current.target.copy(center);
    cameraRef.current.near = Math.max(0.1, cameraZ / 1000);
    cameraRef.current.far = cameraZ * 10;
    cameraRef.current.updateProjectionMatrix();
  };

  const toggleWireframe = () => {
    const model = currentModelRef.current;
    if (!model) return;
    model.traverse((child) => {
      if (child.isMesh) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => { if (m) m.wireframe = !m.wireframe; });
        } else if (child.material) {
          child.material.wireframe = !child.material.wireframe;
        }
      }
    });
    setIsWireframe((prev) => !prev);
  };

  const updateModelColor = (hexColor) => {
    const model = currentModelRef.current;
    if (!model || !window.THREE) return;
    const color = new window.THREE.Color(hexColor);
    model.traverse((child) => {
      if (child.isMesh) {
        const applyColor = (mat) => {
          if (!mat) return;
          if (mat.color) mat.color.copy(color);
          if (mat.emissive && isWireframe) {
            // Subtle emissive to keep visibility on dark backgrounds when wireframe
            mat.emissive.set(color.clone().multiplyScalar(0.15));
          }
        };
        if (Array.isArray(child.material)) child.material.forEach(applyColor);
        else applyColor(child.material);
      }
    });
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setModelColor(newColor);
    updateModelColor(newColor);
  };

  const takeScreenshot = () => {
    const link = document.createElement("a");
    link.download = "neuroscope_screenshot.png";
    link.href = rendererRef.current.domElement.toDataURL("image/png");
    link.click();
  };

  const resetView = () => controlsRef.current.reset();

  const computeModelInfo = (file, model) => {
    let vertices = 0, faces = 0;
    model.traverse((child) => {
      if (child.isMesh && child.geometry) {
        const posCount = child.geometry.attributes?.position?.count || 0;
        vertices += posCount;
        const faceCount = child.geometry.index ? child.geometry.index.count / 3 : Math.floor(posCount / 3);
        faces += faceCount;
      }
    });
    setModelInfo({
      name: file.name,
      format: file.name.split(".").pop().toUpperCase(),
      size: formatSize(file.size),
      vertices: vertices.toLocaleString(),
      faces: faces.toLocaleString(),
    });
  };

  const normalizeAndPlaceAboveGround = (obj) => {
    const { THREE } = window;
    // Compute initial bounding box
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    // Target size for largest dimension
    const targetSize = 2.0;
    const scaleFactor = targetSize / maxDim;
    obj.scale.setScalar(scaleFactor);

    // Recompute box after scaling
    const scaledBox = new THREE.Box3().setFromObject(obj);
    const minY = scaledBox.min.y;
    const lift = (groundRef.current?.position.y ?? 0) - minY + 0.05;
    obj.position.y += lift;
  };

  const formatSize = (bytes) => {
    const units = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
  };

  /** ------------------------
   *  JSX UI
   * ------------------------ */
  return (
    <div className="home-container">
      <Header show3DButton={true} />

      <main className="main-content">
        <div className="title-section">
          <div className="title-row">
           
            <h1 className="title">NeuroScope 3D</h1>
             <Link to="/" className="back-button"><i className="fas fa-arrow-left"></i> Model2D View</Link>
          </div>
          <p className="subtitle">Upload and explore your 3D brain model</p>
        </div>

        <div
          className={`upload-container ${highlight ? "highlight" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setHighlight(true); }}
          onDragLeave={() => setHighlight(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current.click(); }}
          aria-label="Upload 3D model files"
        >
          <i className="fas fa-brain brain-icon" aria-hidden="true"></i>
          <p className="upload-text"><b>Drag & Drop</b> or <b>Click</b> to Upload</p>
          <p className="upload-hint">Supported: .glb, .gltf, .obj, .stl</p>

          {/* Show selected file name (3D models don't have immediate image previews) */}
          {selectedFiles.length > 0 && (
            <div className="upload-preview-file">
              <strong>Selected:</strong> {selectedFiles[0].name}
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".glb,.gltf,.obj,.stl"
          style={{ display: "none" }}
          onChange={handleFileInputChange}
        />

        {selectedFiles.length > 0 && (
          <button
            className="load3d-button visible"
            onClick={loadModel}
            disabled={loading}
            aria-busy={loading}
            aria-label={loading ? 'Loading' : 'Load 3D Model'}
          >
            {loading ? <span className="button-spinner" aria-hidden="true" /> : 'Load 3D Model'}
          </button>
        )}

        {modelInfo && (
          <div className="analysis-section visible">
            <div className="info-box fade-in">
              <h3>{modelInfo.name}</h3>
              <p><b>Format:</b> {modelInfo.format}</p>
              <p><b>Size:</b> {modelInfo.size}</p>
              <p><b>Vertices:</b> {modelInfo.vertices}</p>
              <p><b>Faces:</b> {modelInfo.faces}</p>
            </div>

            <div className="tools">
              <button onClick={toggleWireframe}>Wireframe {isWireframe ? "On" : "Off"}</button>
              <label className="color-picker">
                <span>Color</span>
                <input
                  type="color"
                  value={modelColor}
                  onChange={handleColorChange}
                  aria-label="Model color"
                />
              </label>
              <button onClick={resetView}>Reset View</button>
              <button onClick={takeScreenshot}>📸 Screenshot</button>
            </div>
          </div>
        )}

        {/* 3D canvas area */}
        <div id="canvas-container" ref={containerRef} style={{ width: '100%', height: '60vh', marginTop: '1rem' }} />
      </main>
    </div>
  );
};

export default Model3D;
