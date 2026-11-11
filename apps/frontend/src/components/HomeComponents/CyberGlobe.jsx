import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * CyberGlobe - Thinkwires Brand 3D Holographic Globe in Three.js
 * 
 * Styled with exact Thinkwires Brand Palette:
 * - Inside Core Sphere: Clean White (#FFFFFF)
 * - Coordinate Grid & Orbital Rings: Thinkwires Brand Blue (#0037B0 / #2563EB)
 * - Continental Landmass: Thinkwires Green (#22C55E Lime & #10B981 Emerald)
 * - Tech Corridor Beacons: White core with Green pulsing aura
 * - Polyhedral Nodes: Brand Blue wireframes with Green vertex nodes
 * - Infinite seamless 60fps rotation
 * - Zero watermarks!
 */
const CyberGlobe = ({
  className = '',
  height = '520px',
  interactive = true,
  autoRotate = true,
  showFloor = false,
  showControls = false,
  isBackground = false,
  globeOffsetX = 0,
  globeOffsetY = 6,
  radius = 35,
  showPolyhedra = false,
  showOrbitalRings = false,
  showPerimeterRim = false,
  style = {},
}) => {
  const containerRef = useRef(null);
  const [isRotating, setIsRotating] = useState(autoRotate);
  const [webGlSupported, setWebGlSupported] = useState(true);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof window === 'undefined') return;

    // Check WebGL availability safely (prevents crashes in test runners like jsdom)
    try {
      const testCanvas = document.createElement('canvas');
      const gl =
        testCanvas.getContext('webgl') ||
        testCanvas.getContext('experimental-webgl');
      if (!gl || typeof gl.getExtension !== 'function') {
        setWebGlSupported(false);
        return;
      }
    } catch {
      setWebGlSupported(false);
      return;
    }

    let width = container.clientWidth || 600;
    let heightPx = container.clientHeight || 520;

    // --- Scene, Camera, Renderer ---
    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(42, width / heightPx, 1, 2000);
    camera.position.set(0, isBackground ? globeOffsetY : 4, 160);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, heightPx);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      container.appendChild(renderer.domElement);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = '100%';
      renderer.domElement.style.display = 'block';
    } catch {
      setWebGlSupported(false);
      return;
    }

    // --- Thinkwires Exact Color Tokens ---
    const COL_WHITE = 0xffffff;
    const COL_BRAND_BLUE = 0x0037b0; // Primary brand blue
    const COL_COBALT_BRIGHT = 0x2563eb; // Cobalt bright blue
    const COL_LIME_GREEN = 0x22c55e; // Vivid lime green
    const COL_EMERALD_GREEN = 0x10b981; // Bright emerald green

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    keyLight.position.set(100, 150, 150);
    scene.add(keyLight);

    const blueFillLight = new THREE.DirectionalLight(COL_COBALT_BRIGHT, 1.2);
    blueFillLight.position.set(-100, -50, -80);
    scene.add(blueFillLight);

    // --- Helper: Pure White/Cyan Circular Glow Texture for Points ---
    const createCircleTexture = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (!ctx) return null;
        const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(0.35, 'rgba(255, 255, 255, 0.95)');
        grad.addColorStop(0.7, 'rgba(255, 255, 255, 0.4)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(32, 32, 32, 0, Math.PI * 2);
        ctx.fill();
        const texture = new THREE.CanvasTexture(canvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        return texture;
      } catch {
        return null;
      }
    };
    const circleDotTex = createCircleTexture();

    // --- Master Groups ---
    const worldGroup = new THREE.Group();
    const initialOffsetX = isBackground && width > 992 ? globeOffsetX : 0;
    const initialOffsetY = isBackground ? globeOffsetY : 4;
    worldGroup.position.set(initialOffsetX, initialOffsetY, 0);
    scene.add(worldGroup);

    // Globe group rotates continuously around Y
    const globeGroup = new THREE.Group();
    worldGroup.add(globeGroup);

    const GLOBE_RADIUS = radius; // Scaled to sit perfectly within the hero viewport behind text

    // --- 1a. Transparent Glass-Sphere Body (Fully See-Through) ---
    const glassGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 0.992, 48, 48);
    const glassMat = new THREE.MeshStandardMaterial({
      color: COL_COBALT_BRIGHT,
      roughness: 0.1,
      metalness: 0.05,
      transparent: true,
      opacity: 0.05, // Crystal clear transparent sphere body: text is 100% visible
      depthWrite: false,
    });
    const glassMesh = new THREE.Mesh(glassGeom, glassMat);
    globeGroup.add(glassMesh);

    // --- 1b. Circular Perimeter Rim Line (Optional) ---
    if (showPerimeterRim) {
      const rimPts = [];
      for (let i = 0; i <= 96; i++) {
        const a = (i / 96) * Math.PI * 2;
        rimPts.push(
          new THREE.Vector3(Math.cos(a) * GLOBE_RADIUS, Math.sin(a) * GLOBE_RADIUS, 0)
        );
      }
      const rimGeom = new THREE.BufferGeometry().setFromPoints(rimPts);
      const rimMat = new THREE.LineBasicMaterial({
        color: COL_COBALT_BRIGHT,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      });
      const rimMesh = new THREE.Line(rimGeom, rimMat);
      worldGroup.add(rimMesh);
    }

    // --- 1c. Subtle Atmospheric Back-Glow Halo ---
    const atmosGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 1.04, 48, 48);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: COL_COBALT_BRIGHT,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const atmosMesh = new THREE.Mesh(atmosGeom, atmosMat);
    globeGroup.add(atmosMesh);

    // --- 1d. Global Interconnected Network Constellation (Exact to reference image!) ---
    const NETWORK_NODE_COUNT = 88;
    const networkNodes = [];
    const phiGolden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < NETWORK_NODE_COUNT; i++) {
      const y = 1 - (i / (NETWORK_NODE_COUNT - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = phiGolden * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      networkNodes.push(
        new THREE.Vector3(
          x * (GLOBE_RADIUS * 1.002),
          y * (GLOBE_RADIUS * 1.002),
          z * (GLOBE_RADIUS * 1.002)
        )
      );
    }

    // Connect neighboring nodes with Thinkwires Blue lines
    const networkLinePts = [];
    const MAX_NEIGHBOR_DIST = GLOBE_RADIUS * 0.46;

    for (let i = 0; i < networkNodes.length; i++) {
      let connections = 0;
      for (let j = i + 1; j < networkNodes.length; j++) {
        const d = networkNodes[i].distanceTo(networkNodes[j]);
        if (d < MAX_NEIGHBOR_DIST && connections < 4) {
          networkLinePts.push(networkNodes[i], networkNodes[j]);
          connections++;
        }
      }
    }

    const netLineGeom = new THREE.BufferGeometry().setFromPoints(networkLinePts);
    const netLineMat = new THREE.LineBasicMaterial({
      color: COL_COBALT_BRIGHT,
      transparent: true,
      opacity: 0.4,
      depthWrite: false,
    });
    const netLineMesh = new THREE.LineSegments(netLineGeom, netLineMat);
    globeGroup.add(netLineMesh);

    // Network Node Dots (White glowing nodes as seen in reference image)
    const nodeGeom = new THREE.BufferGeometry().setFromPoints(networkNodes);
    const nodeMat = new THREE.PointsMaterial({
      size: 3.0,
      map: circleDotTex,
      color: COL_WHITE,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
    });
    const nodePointsMesh = new THREE.Points(nodeGeom, nodeMat);
    globeGroup.add(nodePointsMesh);

    // --- 2. Spherical Lat/Long Grid (BLUE lines as requested) ---
    const gridLineGroup = new THREE.Group();
    globeGroup.add(gridLineGroup);

    const gridLineMat = new THREE.LineBasicMaterial({
      color: COL_COBALT_BRIGHT,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
    });

    const latAngles = [-60, -45, -23.5, 0, 23.5, 45, 60];
    latAngles.forEach((deg) => {
      const phi = (deg * Math.PI) / 180;
      const r = GLOBE_RADIUS * Math.cos(phi);
      const y = GLOBE_RADIUS * Math.sin(phi);
      const segments = 64;
      const pts = [];
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(theta) * r, y, Math.sin(theta) * r));
      }
      const ringGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const ringMesh = new THREE.Line(ringGeom, gridLineMat);
      gridLineGroup.add(ringMesh);
    });

    for (let l = 0; l < 12; l++) {
      const rotY = (l / 12) * Math.PI;
      const segments = 64;
      const pts = [];
      for (let s = 0; s <= segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(theta) * GLOBE_RADIUS,
            Math.sin(theta) * GLOBE_RADIUS,
            0
          )
        );
      }
      const lonGeom = new THREE.BufferGeometry().setFromPoints(pts);
      const lonMesh = new THREE.Line(lonGeom, gridLineMat);
      lonMesh.rotation.y = rotY;
      gridLineGroup.add(lonMesh);
    }

    // --- 3. World Continents Particle Cloud (GREEN land as requested) ---
    const mapCanvas = document.createElement('canvas');
    mapCanvas.width = 1024;
    mapCanvas.height = 512;
    const mapCtx = mapCanvas.getContext('2d');

    const toPx = (lon, lat) => [
      Math.max(0, Math.min(1023, Math.round(((lon + 180) / 360) * 1024))),
      Math.max(0, Math.min(511, Math.round(((90 - lat) / 180) * 512))),
    ];

    const continentPolys = [
      // North America
      [[-168,65],[-162,71],[-140,70],[-120,69],[-95,68],[-80,62],[-82,55],[-90,52],[-82,45],[-70,47],[-55,52],[-56,47],[-64,44],[-71,41],[-76,34],[-81,30],[-80,25],[-82,25],[-88,30],[-97,26],[-97,22],[-92,19],[-87,16],[-83,9],[-77,8],[-83,10],[-92,16],[-105,22],[-114,28],[-122,38],[-124,48],[-135,57],[-153,58],[-168,65]],
      // Greenland
      [[-50,60],[-42,60],[-25,70],[-18,80],[-25,83],[-55,82],[-60,78],[-50,70],[-50,60]],
      // South America
      [[-76,10],[-67,11],[-58,6],[-48,0],[-36,-5],[-35,-8],[-39,-18],[-45,-24],[-52,-32],[-58,-38],[-66,-53],[-74,-52],[-72,-41],[-71,-28],[-76,-15],[-81,-4],[-77,6],[-76,10]],
      // Europe
      [[-9,36],[-2,36],[8,44],[14,41],[23,37],[27,38],[35,46],[42,47],[35,56],[30,60],[24,65],[15,62],[10,54],[5,52],[2,51],[-1,44],[-9,43],[-9,36]],
      // Scandinavia
      [[5,58],[12,56],[18,59],[25,65],[28,70],[18,70],[10,64],[5,58]],
      // UK
      [[-5,50],[1,51],[1,53],[-0,55],[-2,58],[-5,58],[-5,50]],
      // Africa
      [[-6,36],[10,37],[25,32],[34,27],[43,13],[51,11],[40,-10],[33,-25],[28,-32],[20,-34],[15,-28],[12,-13],[9,4],[-8,5],[-17,12],[-17,16],[-12,26],[-6,36]],
      // Madagascar
      [[44,-12],[50,-13],[50,-22],[44,-25],[44,-12]],
      // Asia & India & China
      [[35,36],[48,40],[55,30],[68,24],[73,17],[77,8],[80,10],[85,20],[89,22],[96,16],[103,10],[108,16],[115,22],[120,24],[122,30],[128,38],[135,45],[143,52],[155,56],[168,62],[180,67],[180,72],[140,74],[100,76],[65,70],[45,66],[35,50],[35,36]],
      // Arabia
      [[35,30],[50,28],[59,22],[53,15],[44,13],[38,22],[35,30]],
      // Japan
      [[131,33],[136,35],[141,41],[145,43],[140,42],[131,33]],
      // Australia
      [[114,-22],[125,-15],[137,-12],[141,-11],[149,-20],[153,-26],[150,-35],[145,-38],[135,-34],[122,-34],[114,-30],[114,-22]],
      // New Zealand
      [[168,-46],[174,-42],[178,-38],[172,-41],[168,-46]],
      // Indonesia
      [[95,5],[105,-3],[100,-4],[95,5]],
      [[106,-6],[114,-8],[110,-7],[106,-6]],
      [[109,1],[118,4],[112,-3],[109,1]]
    ];

    if (mapCtx) {
      mapCtx.fillStyle = '#000000';
      mapCtx.fillRect(0, 0, 1024, 512);
      mapCtx.fillStyle = '#ffffff';
      continentPolys.forEach((poly) => {
        mapCtx.beginPath();
        poly.forEach(([lon, lat], idx) => {
          const [px, py] = toPx(lon, lat);
          if (idx === 0) mapCtx.moveTo(px, py);
          else mapCtx.lineTo(px, py);
        });
        mapCtx.closePath();
        mapCtx.fill();
      });
    }

    let continentPointsMesh = null;
    let continentSurfaceMesh = null;

    const updateGlobePoints = () => {
      if (!mapCtx) return;
      if (continentPointsMesh) globeGroup.remove(continentPointsMesh);
      if (continentSurfaceMesh) globeGroup.remove(continentSurfaceMesh);

      const imgDataObj = mapCtx.getImageData(0, 0, 1024, 512);
      const mapData = imgDataObj ? imgDataObj.data : [];

      // 1. Semi-transparent Green Continent Silhouette Surface (matches uploaded reference image)
      try {
        const landCanvas = document.createElement('canvas');
        landCanvas.width = 1024;
        landCanvas.height = 512;
        const landCtx = landCanvas.getContext('2d');
        if (landCtx) {
          const outData = landCtx.createImageData(1024, 512);
          const o = outData.data;
          for (let i = 0; i < mapData.length; i += 4) {
            if (mapData[i] > 40) {
              // Thinkwires Vivid Lime/Emerald Green with soft see-through opacity
              o[i] = 34;
              o[i + 1] = 197;
              o[i + 2] = 94;
              o[i + 3] = 110; // ~43% opacity for soft see-through visibility
            } else {
              o[i + 3] = 0; // 100% transparent ocean!
            }
          }
          landCtx.putImageData(outData, 0, 0);

          const landTex = new THREE.CanvasTexture(landCanvas);
          landTex.colorSpace = THREE.SRGBColorSpace;

          const landGeom = new THREE.SphereGeometry(GLOBE_RADIUS * 0.996, 48, 48);
          const landMat = new THREE.MeshBasicMaterial({
            map: landTex,
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            side: THREE.DoubleSide,
          });
          continentSurfaceMesh = new THREE.Mesh(landGeom, landMat);
          globeGroup.add(continentSurfaceMesh);
        }
      } catch {
        // Fallback to dot-lattice
      }

      // 2. High-Tech Green Continent Particle Lattice
      const TOTAL_SAMPLES = 12000;
      const landPositions = [];
      const landColors = [];

      const phiGolden = Math.PI * (3 - Math.sqrt(5));

      for (let i = 0; i < TOTAL_SAMPLES; i++) {
        const y = 1 - (i / (TOTAL_SAMPLES - 1)) * 2;
        const radius = Math.sqrt(1 - y * y);
        const theta = phiGolden * i;

        const x = Math.cos(theta) * radius;
        const z = Math.sin(theta) * radius;

        const lat = Math.asin(y);
        const lon = Math.atan2(z, x);

        const u = 1 - (lon + Math.PI) / (Math.PI * 2);
        const v = 1 - (lat + Math.PI / 2) / Math.PI;

        const px = Math.min(1023, Math.max(0, Math.floor(u * 1024)));
        const py = Math.min(511, Math.max(0, Math.floor(v * 512)));
        const pixelVal = mapData[(py * 1024 + px) * 4] || 0;

        if (pixelVal > 40) {
          // LAND POINT: Thinkwires Vivid Lime Green (#22C55E) & Emerald (#10B981)
          landPositions.push(
            x * (GLOBE_RADIUS * 1.004),
            y * (GLOBE_RADIUS * 1.004),
            z * (GLOBE_RADIUS * 1.004)
          );

          const isLime = i % 2 === 0;
          if (isLime) {
            // #22C55E -> (0.133, 0.773, 0.369)
            landColors.push(0.133, 0.773, 0.369);
          } else {
            // #10B981 -> (0.063, 0.725, 0.506)
            landColors.push(0.063, 0.725, 0.506);
          }
        }
      }

      const landGeom = new THREE.BufferGeometry();
      landGeom.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(landPositions, 3)
      );
      landGeom.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(landColors, 3)
      );

      const landMat = new THREE.PointsMaterial({
        size: 2.0,
        map: circleDotTex,
        vertexColors: true,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });

      continentPointsMesh = new THREE.Points(landGeom, landMat);
      globeGroup.add(continentPointsMesh);
    };

    updateGlobePoints();

    const maskImg = new Image();
    maskImg.crossOrigin = 'anonymous';
    maskImg.src = '/images/world-map-mask.png';
    maskImg.onload = () => {
      if (mapCtx) {
        mapCtx.drawImage(maskImg, 0, 0, 1024, 512);
        updateGlobePoints();
      }
    };

    // --- 4. Global Tech Corridor Hubs (White core with Green glowing halo) ---
    const TECH_HUBS = [
      { name: 'Silicon Valley', lat: 37.77, lon: -122.41 },
      { name: 'New York', lat: 40.71, lon: -74.0 },
      { name: 'London', lat: 51.5, lon: -0.12 },
      { name: 'Frankfurt', lat: 50.11, lon: 8.68 },
      { name: 'Bangalore Hub', lat: 12.97, lon: 77.59 },
      { name: 'Hyderabad', lat: 17.38, lon: 78.48 },
      { name: 'Singapore', lat: 1.35, lon: 103.81 },
      { name: 'Tokyo', lat: 35.67, lon: 139.65 },
      { name: 'Sydney', lat: -33.86, lon: 151.2 },
      { name: 'São Paulo', lat: -23.55, lon: -46.63 },
    ];

    const latLonToVector3 = (lat, lon, radius) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    const hubGroup = new THREE.Group();
    globeGroup.add(hubGroup);

    const hubBeacons = [];
    TECH_HUBS.forEach((hub) => {
      const pos = latLonToVector3(hub.lat, hub.lon, GLOBE_RADIUS + 0.4);

      const beaconGeom = new THREE.SphereGeometry(0.85, 16, 16);
      const beaconMat = new THREE.MeshBasicMaterial({ color: COL_WHITE });
      const beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
      beaconMesh.position.copy(pos);
      hubGroup.add(beaconMesh);

      // Green glowing halo ring (#22C55E)
      const ringGeom = new THREE.RingGeometry(1.0, 1.8, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: COL_LIME_GREEN,
        transparent: true,
        opacity: 0.85,
        side: THREE.DoubleSide,
      });
      const ringMesh = new THREE.Mesh(ringGeom, ringMat);
      ringMesh.position.copy(pos);
      ringMesh.lookAt(pos.clone().multiplyScalar(2));
      hubGroup.add(ringMesh);

      hubBeacons.push({ ringMesh, phase: Math.random() * Math.PI * 2 });
    });

    // --- 5. 3D Global Network Connection Arcs (BLUE Arcs with Lime Light Pulses) ---
    const ARC_CONNECTIONS = [
      [0, 1], // SF -> NYC
      [1, 2], // NYC -> London
      [2, 3], // London -> Frankfurt
      [3, 4], // Frankfurt -> Bangalore
      [4, 5], // Bangalore -> Hyderabad
      [4, 6], // Bangalore -> Singapore
      [6, 7], // Singapore -> Tokyo
      [7, 8], // Tokyo -> Sydney
      [0, 7], // SF -> Tokyo
      [1, 9], // NYC -> Sao Paulo
    ];

    const arcGroup = new THREE.Group();
    globeGroup.add(arcGroup);
    const arcPulses = [];

    ARC_CONNECTIONS.forEach(([fromIdx, toIdx], arcIdx) => {
      const vFrom = latLonToVector3(
        TECH_HUBS[fromIdx].lat,
        TECH_HUBS[fromIdx].lon,
        GLOBE_RADIUS
      );
      const vTo = latLonToVector3(
        TECH_HUBS[toIdx].lat,
        TECH_HUBS[toIdx].lon,
        GLOBE_RADIUS
      );

      const mid = vFrom.clone().add(vTo).multiplyScalar(0.5);
      const dist = vFrom.distanceTo(vTo);
      const altitude = GLOBE_RADIUS + dist * 0.26;
      mid.normalize().multiplyScalar(altitude);

      const curve = new THREE.QuadraticBezierCurve3(vFrom, mid, vTo);
      const points = curve.getPoints(40);
      const arcGeom = new THREE.BufferGeometry().setFromPoints(points);

      // Thinkwires Blue Arc Line
      const arcMat = new THREE.LineBasicMaterial({
        color: COL_COBALT_BRIGHT,
        transparent: true,
        opacity: 0.45,
      });
      const arcLine = new THREE.Line(arcGeom, arcMat);
      arcGroup.add(arcLine);

      // Green Traveling Pulse Packet
      const pulseGeom = new THREE.SphereGeometry(0.85, 12, 12);
      const pulseMat = new THREE.MeshBasicMaterial({
        color: COL_LIME_GREEN,
      });
      const pulseMesh = new THREE.Mesh(pulseGeom, pulseMat);
      arcGroup.add(pulseMesh);

      arcPulses.push({
        curve,
        mesh: pulseMesh,
        speed: 0.25 + (arcIdx % 3) * 0.1,
        progress: (arcIdx * 0.17) % 1.0,
      });
    });

    // --- 6. Concentric Tilted Orbital Rings (Thinkwires Brand Blue) (Optional) ---
    let ring1 = null;
    let ring2 = null;
    const satellites = [];

    if (showOrbitalRings) {
      const orbitalGroup = new THREE.Group();
      globeGroup.add(orbitalGroup);

      const ring1Radius = GLOBE_RADIUS * 1.32;
      const ring1Pts = [];
      for (let i = 0; i <= 96; i++) {
        const th = (i / 96) * Math.PI * 2;
        ring1Pts.push(
          new THREE.Vector3(Math.cos(th) * ring1Radius, 0, Math.sin(th) * ring1Radius)
        );
      }
      const ring1Geom = new THREE.BufferGeometry().setFromPoints(ring1Pts);
      const ring1Mat = new THREE.LineDashedMaterial({
        color: COL_BRAND_BLUE,
        dashSize: 3.0,
        gapSize: 1.8,
        transparent: true,
        opacity: 0.7,
      });
      ring1 = new THREE.Line(ring1Geom, ring1Mat);
      ring1.computeLineDistances();
      ring1.rotation.x = 0.32;
      ring1.rotation.z = 0.15;
      orbitalGroup.add(ring1);

      const ring2Radius = GLOBE_RADIUS * 1.45;
      const ring2Pts = [];
      for (let i = 0; i <= 96; i++) {
        const th = (i / 96) * Math.PI * 2;
        ring2Pts.push(
          new THREE.Vector3(Math.cos(th) * ring2Radius, 0, Math.sin(th) * ring2Radius)
        );
      }
      const ring2Geom = new THREE.BufferGeometry().setFromPoints(ring2Pts);
      const ring2Mat = new THREE.LineDashedMaterial({
        color: COL_COBALT_BRIGHT,
        dashSize: 5.0,
        gapSize: 3.0,
        transparent: true,
        opacity: 0.5,
      });
      ring2 = new THREE.Line(ring2Geom, ring2Mat);
      ring2.computeLineDistances();
      ring2.rotation.x = -0.42;
      ring2.rotation.z = -0.25;
      orbitalGroup.add(ring2);

      // Orbiting Satellites
      const satelliteCount = 2;
      for (let s = 0; s < satelliteCount; s++) {
        const satMesh = new THREE.Mesh(
          new THREE.SphereGeometry(1.1, 16, 16),
          new THREE.MeshBasicMaterial({ color: s === 0 ? COL_LIME_GREEN : COL_COBALT_BRIGHT })
        );
        ring1.add(satMesh);
        satellites.push({
          mesh: satMesh,
          speed: 0.015 + s * 0.008,
          angle: (s * Math.PI) / satelliteCount,
          radius: ring1Radius,
        });
      }
    }

    // --- 7. Floating Wireframe Icosahedrons (Optional) ---
    const polyhedra = [];

    if (showPolyhedra) {
      const polyScale = GLOBE_RADIUS / 36;
      const polyConfigs = [
        { pos: [-52 * polyScale, 15 * polyScale, 18 * polyScale], scale: 6.5 * polyScale, rotSpeed: [0.01, 0.015, 0.008] },
        { pos: [52 * polyScale, 13 * polyScale, -10 * polyScale], scale: 7 * polyScale, rotSpeed: [-0.008, 0.012, 0.015] },
        { pos: [-44 * polyScale, -16 * polyScale, -12 * polyScale], scale: 5.5 * polyScale, rotSpeed: [0.012, -0.009, 0.01] },
        { pos: [48 * polyScale, -15 * polyScale, 18 * polyScale], scale: 6.5 * polyScale, rotSpeed: [-0.01, -0.014, 0.009] },
      ];

      polyConfigs.forEach(({ pos, scale, rotSpeed }, pIdx) => {
        const pGroup = new THREE.Group();
        pGroup.position.set(pos[0], pos[1], pos[2]);

        const icoGeom = new THREE.IcosahedronGeometry(1, 0);
        const icoMat = new THREE.MeshBasicMaterial({
          color: COL_COBALT_BRIGHT,
          wireframe: true,
          transparent: true,
          opacity: 0.6,
        });
        const icoMesh = new THREE.Mesh(icoGeom, icoMat);
        icoMesh.scale.set(scale, scale, scale);
        pGroup.add(icoMesh);

        // Green vertex dots
        const vPositions = icoGeom.attributes.position.array;
        const vGeom = new THREE.BufferGeometry();
        vGeom.setAttribute('position', new THREE.BufferAttribute(vPositions, 3));
        const vMat = new THREE.PointsMaterial({
          size: 3.0,
          map: circleDotTex,
          color: COL_LIME_GREEN,
          transparent: true,
          opacity: 0.9,
          depthWrite: false,
        });
        const vPoints = new THREE.Points(vGeom, vMat);
        vPoints.scale.set(scale, scale, scale);
        pGroup.add(vPoints);

        worldGroup.add(pGroup);
        polyhedra.push({
          group: pGroup,
          baseY: pos[1],
          phase: pIdx * 1.3,
          rotSpeed,
        });
      });
    }

    // --- 8. Reflective Tech Floor Grid with Brand Blue & Green Lines ---
    let floorPulsePoints = null;

    if (showFloor) {
      const floorY = -GLOBE_RADIUS * 1.34;
      const floorGeom = new THREE.PlaneGeometry(GLOBE_RADIUS * 7.5, GLOBE_RADIUS * 7.5, 1, 1);
      const textureLoader = new THREE.TextureLoader();
      const floorTex = textureLoader.load('/images/cyber-floor-circuit.png');

      const floorMat = new THREE.MeshBasicMaterial({
        map: floorTex,
        color: COL_COBALT_BRIGHT,
        transparent: true,
        opacity: 0.35,
        depthWrite: false,
      });

      const floorMesh = new THREE.Mesh(floorGeom, floorMat);
      floorMesh.position.set(0, floorY, 0);
      floorMesh.rotation.x = -Math.PI / 2;
      worldGroup.add(floorMesh);

      const FLOOR_PULSE_COUNT = 60;
      const fPositions = new Float32Array(FLOOR_PULSE_COUNT * 3);
      const fPulses = [];
      for (let fp = 0; fp < FLOOR_PULSE_COUNT; fp++) {
        const angle = (Math.floor(Math.random() * 8) * Math.PI) / 4;
        const speed = 0.5 + Math.random() * 0.8;
        const dist = GLOBE_RADIUS * 0.85 + Math.random() * (GLOBE_RADIUS * 3.6);
        fPulses.push({ angle, dist, speed, maxDist: GLOBE_RADIUS * 4.5 });
        fPositions[fp * 3] = Math.cos(angle) * dist;
        fPositions[fp * 3 + 1] = floorY + 0.5;
        fPositions[fp * 3 + 2] = Math.sin(angle) * dist;
      }

      const fGeom = new THREE.BufferGeometry();
      fGeom.setAttribute('position', new THREE.BufferAttribute(fPositions, 3));
      const fMat = new THREE.PointsMaterial({
        size: 2.8,
        map: circleDotTex,
        color: COL_LIME_GREEN,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
      });
      floorPulsePoints = new THREE.Points(fGeom, fMat);
      worldGroup.add(floorPulsePoints);
      floorPulsePoints.userData = { pulses: fPulses };
    }

    // --- 9. Ambient Floating Brand Dust Particles ---
    const DUST_COUNT = 120;
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustVelocities = [];
    for (let d = 0; d < DUST_COUNT; d++) {
      dustPositions[d * 3] = (Math.random() - 0.5) * 320;
      dustPositions[d * 3 + 1] = (Math.random() - 0.5) * 180;
      dustPositions[d * 3 + 2] = (Math.random() - 0.5) * 220;
      dustVelocities.push({
        vx: (Math.random() - 0.5) * 0.08,
        vy: 0.05 + Math.random() * 0.1,
        vz: (Math.random() - 0.5) * 0.08,
      });
    }
    const dustGeom = new THREE.BufferGeometry();
    dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustMat = new THREE.PointsMaterial({
      size: 2.5,
      map: circleDotTex,
      color: COL_COBALT_BRIGHT,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const dustPoints = new THREE.Points(dustGeom, dustMat);
    worldGroup.add(dustPoints);

    // --- Interactive Mouse Handlers ---
    let targetCameraX = 0;
    let targetCameraY = isBackground ? globeOffsetY : 4;
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let manualRotX = 0;
    let manualRotY = 0;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

      if (isDragging) {
        const deltaX = e.clientX - prevMouseX;
        const deltaY = e.clientY - prevMouseY;
        manualRotY += deltaX * 0.006;
        manualRotX += deltaY * 0.006;
        manualRotX = Math.max(-0.6, Math.min(0.6, manualRotX));
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      } else {
        targetCameraX = normX * 14;
        targetCameraY = (isBackground ? globeOffsetY : 4) + normY * 6;
      }
    };

    const handleMouseDown = (e) => {
      if (!interactive) return;
      isDragging = true;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    const handleTouchStart = (e) => {
      if (!interactive || e.touches.length === 0) return;
      isDragging = true;
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (!interactive || !isDragging || e.touches.length === 0) return;
      const deltaX = e.touches[0].clientX - prevMouseX;
      const deltaY = e.touches[0].clientY - prevMouseY;
      manualRotY += deltaX * 0.008;
      manualRotX += deltaY * 0.008;
      manualRotX = Math.max(-0.6, Math.min(0.6, manualRotX));
      prevMouseX = e.touches[0].clientX;
      prevMouseY = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      isDragging = false;
    };

    if (isBackground) {
      window.addEventListener('mousemove', handleMouseMove);
    } else {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mousedown', handleMouseDown);
      window.addEventListener('mouseup', handleMouseUp);
      container.addEventListener('touchstart', handleTouchStart, { passive: true });
      container.addEventListener('touchmove', handleTouchMove, { passive: true });
      window.addEventListener('touchend', handleTouchEnd);
    }

    // --- Resize Handler ---
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth || 600;
      const newH = container.clientHeight || 520;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);

      if (isBackground) {
        worldGroup.position.x = newW > 992 ? globeOffsetX : 0;
        worldGroup.position.y = globeOffsetY;
      }
    };

    let resizeObserver = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(container);
    } else {
      window.addEventListener('resize', handleResize);
    }

    // --- Animation Loop ---
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const elapsed = clock.getElapsedTime();

      // Continuous rotation
      if (isRotating && !isDragging) {
        globeGroup.rotation.y += 0.0042;
      }
      if (isDragging || manualRotX !== 0 || manualRotY !== 0) {
        globeGroup.rotation.y += manualRotY * 0.1;
        globeGroup.rotation.x = THREE.MathUtils.lerp(
          globeGroup.rotation.x,
          manualRotX,
          0.08
        );
        manualRotY *= 0.92;
        manualRotX *= 0.92;
      }

      if (ring1) ring1.rotation.y += 0.002;
      if (ring2) ring2.rotation.y -= 0.0018;

      satellites.forEach((sat) => {
        sat.angle += sat.speed;
        sat.mesh.position.set(
          Math.cos(sat.angle) * sat.radius,
          0,
          Math.sin(sat.angle) * sat.radius
        );
      });

      hubBeacons.forEach((b) => {
        const pulse = (Math.sin(elapsed * 4 + b.phase) + 1) * 0.5;
        const scale = 1.0 + pulse * 0.7;
        b.ringMesh.scale.set(scale, scale, 1);
        b.ringMesh.material.opacity = 0.9 - pulse * 0.45;
      });

      arcPulses.forEach((p) => {
        p.progress = (p.progress + delta * p.speed) % 1.0;
        const pt = p.curve.getPoint(p.progress);
        p.mesh.position.copy(pt);
      });

      polyhedra.forEach((p) => {
        p.group.rotation.x += p.rotSpeed[0];
        p.group.rotation.y += p.rotSpeed[1];
        p.group.rotation.z += p.rotSpeed[2];
        p.group.position.y =
          p.baseY + Math.sin(elapsed * 1.5 + p.phase) * 3.5;
      });

      if (floorPulsePoints && floorPulsePoints.userData.pulses) {
        const fPos = floorPulsePoints.geometry.attributes.position.array;
        floorPulsePoints.userData.pulses.forEach((fp, i) => {
          fp.dist += fp.speed * 0.8;
          if (fp.dist > fp.maxDist) fp.dist = 28;
          fPos[i * 3] = Math.cos(fp.angle) * fp.dist;
          fPos[i * 3 + 2] = Math.sin(fp.angle) * fp.dist;
        });
        floorPulsePoints.geometry.attributes.position.needsUpdate = true;
      }

      const dPos = dustPoints.geometry.attributes.position.array;
      for (let d = 0; d < DUST_COUNT; d++) {
        dPos[d * 3 + 1] += dustVelocities[d].vy;
        if (dPos[d * 3 + 1] > 90) dPos[d * 3 + 1] = -90;
        dPos[d * 3] += Math.sin(elapsed + d) * 0.04;
      }
      dustPoints.geometry.attributes.position.needsUpdate = true;

      camera.position.x = THREE.MathUtils.lerp(
        camera.position.x,
        targetCameraX,
        0.05
      );
      camera.position.y = THREE.MathUtils.lerp(
        camera.position.y,
        targetCameraY,
        0.05
      );
      camera.lookAt(
        worldGroup.position.x * 0.3,
        isBackground ? globeOffsetY : 4,
        0
      );

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener('resize', handleResize);

      if (isBackground) {
        window.removeEventListener('mousemove', handleMouseMove);
      } else {
        container.removeEventListener('mousemove', handleMouseMove);
        container.removeEventListener('mousedown', handleMouseDown);
        window.removeEventListener('mouseup', handleMouseUp);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      }

      if (renderer.domElement && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [
    interactive,
    isRotating,
    showFloor,
    isBackground,
    globeOffsetX,
    globeOffsetY,
    radius,
    showPolyhedra,
    showOrbitalRings,
    showPerimeterRim,
  ]);

  if (!webGlSupported) {
    return null;
  }

  return (
    <div
      className={`CyberGlobe-wrapper ${className}`}
      data-testid="cyberglobe-canvas-wrapper"
      style={{
        position: isBackground ? 'absolute' : 'relative',
        inset: isBackground ? 0 : undefined,
        width: '100%',
        height: height,
        overflow: 'hidden',
        cursor: interactive && !isBackground ? 'grab' : 'default',
        zIndex: isBackground ? 0 : 2,
        pointerEvents: isBackground ? 'none' : 'auto',
        ...style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: isBackground ? 'none' : 'auto',
        }}
      />
    </div>
  );
};

export default CyberGlobe;
