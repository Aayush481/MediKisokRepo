/**
 * MediKiosk 3D Hero Section & Interactive Clinical Gateway
 * Features:
 *   - Real-time Three.js WebGL 3D scene (rotating DNA helix, biometric pulse rings, floating data constellation)
 *   - Interactive 3D perspective card physics (tilt, specular light sheen, multi-plane depth)
 *   - Instant portal routing ("Visit as Patient" & "Visit as Doctor / Doctor Desk")
 *   - Smooth scroll anchor routing to clinical services
 *   - Zero CPU waste (IntersectionObserver pauses rendering offscreen)
 */

export function initHero3D(app) {
  const canvas = document.getElementById("heroCanvas3D");
  const heroSection = document.getElementById("heroSection");
  if (!canvas || !heroSection) return;

  // Initialize interactive 3D physics on portal cards
  initCard3DTilt();

  // Initialize smooth scroll routing to services
  initSmoothScroll();

  // Check if Three.js WebGL engine is loaded
  if (typeof THREE === "undefined") {
    console.info("[Hero3D] Three.js not detected; active CSS 3D fallback running.");
    return;
  }

  try {
    const scene = new THREE.Scene();

    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance"
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

    const camera = new THREE.PerspectiveCamera(
      45,
      heroSection.clientWidth / Math.max(heroSection.clientHeight, 300),
      0.1,
      1000
    );
    camera.position.set(0, 0, 32);

    const updateSize = () => {
      const width = heroSection.clientWidth;
      const height = heroSection.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    updateSize();

    // Ambient and clinical directional lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const emeraldLight = new THREE.PointLight(0x10B981, 2.8, 50);
    emeraldLight.position.set(12, 10, 15);
    scene.add(emeraldLight);

    const cyanLight = new THREE.PointLight(0x06B6D4, 2.2, 50);
    cyanLight.position.set(-12, -10, 15);
    scene.add(cyanLight);

    // Root group for DNA double helix and biometric telemetry
    const dnaGroup = new THREE.Group();
    scene.add(dnaGroup);

    // Build 3D DNA Double Helix
    const numPairs = 26;
    const helixRadius = 3.6;
    const helixHeight = 22;
    const turns = 2.2;

    const sphereGeoA = new THREE.SphereGeometry(0.32, 16, 16);
    const sphereGeoB = new THREE.SphereGeometry(0.32, 16, 16);
    const sphereMatA = new THREE.MeshPhongMaterial({
      color: 0x10B981,
      emissive: 0x059669,
      emissiveIntensity: 0.35,
      shininess: 90
    });
    const sphereMatB = new THREE.MeshPhongMaterial({
      color: 0x0EA5E9,
      emissive: 0x0284C7,
      emissiveIntensity: 0.35,
      shininess: 90
    });
    const bondMat = new THREE.MeshStandardMaterial({
      color: 0xE2E8F0,
      roughness: 0.3,
      metalness: 0.7
    });

    for (let i = 0; i < numPairs; i++) {
      const t = (i / numPairs) * Math.PI * 2 * turns;
      const y = ((i / numPairs) - 0.5) * helixHeight;

      const xA = Math.cos(t) * helixRadius;
      const zA = Math.sin(t) * helixRadius;

      const xB = Math.cos(t + Math.PI) * helixRadius;
      const zB = Math.sin(t + Math.PI) * helixRadius;

      // Strand A Node
      const nodeA = new THREE.Mesh(sphereGeoA, sphereMatA);
      nodeA.position.set(xA, y, zA);
      dnaGroup.add(nodeA);

      // Strand B Node
      const nodeB = new THREE.Mesh(sphereGeoB, sphereMatB);
      nodeB.position.set(xB, y, zB);
      dnaGroup.add(nodeB);

      // Base pair connector bond
      const bondGeo = new THREE.CylinderGeometry(0.05, 0.05, helixRadius * 2, 8);
      const bond = new THREE.Mesh(bondGeo, bondMat);
      bond.position.set((xA + xB) / 2, y, (zA + zB) / 2);
      bond.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        new THREE.Vector3(xB - xA, 0, zB - zA).normalize()
      );
      dnaGroup.add(bond);
    }

    // Biometric Telemetry Orbit Rings
    const ringGeo1 = new THREE.TorusGeometry(8.2, 0.05, 16, 100);
    const ringMat1 = new THREE.MeshBasicMaterial({
      color: 0x10B981,
      transparent: true,
      opacity: 0.35
    });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 3;
    dnaGroup.add(ring1);

    const ringGeo2 = new THREE.TorusGeometry(10.2, 0.04, 16, 100);
    const ringMat2 = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.25
    });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.y = Math.PI / 4;
    dnaGroup.add(ring2);

    // Floating Clinical Particles Constellation
    const particleCount = 130;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePositions[i] = (Math.random() - 0.5) * 36;
      particlePositions[i + 1] = (Math.random() - 0.5) * 28;
      particlePositions[i + 2] = (Math.random() - 0.5) * 18;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x10B981,
      size: 0.32,
      transparent: true,
      opacity: 0.55
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    dnaGroup.rotation.z = 0.22;
    dnaGroup.position.set(0, 0, -2);

    // Parallax mouse tracker
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const onMouseMove = (e) => {
      const rect = heroSection.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetX = x * 0.4;
      targetY = y * 0.3;
    };
    heroSection.addEventListener("mousemove", onMouseMove, { passive: true });

    // Performance guard: pause render loop when offscreen
    let isVisible = true;
    const observer = new IntersectionObserver((entries) => {
      isVisible = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(heroSection);

    // Main animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      if (!isVisible) return;

      mouseX += (targetX - mouseX) * 0.05;
      mouseY += (targetY - mouseY) * 0.05;

      dnaGroup.rotation.y += 0.007;
      ring1.rotation.z += 0.003;
      ring2.rotation.z -= 0.004;
      particles.rotation.y += 0.001;

      camera.position.x = mouseX * 3.5;
      camera.position.y = mouseY * 2.5;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    animate();

    window.addEventListener("resize", updateSize, { passive: true });
  } catch (err) {
    console.warn("[Hero3D] WebGL Scene notice:", err);
  }
}

/**
 * Interactive 3D Perspective Card Tilt Physics
 * Creates dynamic specular highlight and multi-plane depth
 */
function initCard3DTilt() {
  const cards = document.querySelectorAll(".hero-card-3d");
  cards.forEach(card => {
    const sheen = card.querySelector(".hero-card-sheen");

    card.addEventListener("mousemove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const w = rect.width;
      const h = rect.height;

      const normalX = (x / w) * 2 - 1;
      const normalY = (y / h) * 2 - 1;

      const tiltX = -normalY * 7;
      const tiltY = normalX * 7;

      card.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) translateZ(8px) scale3d(1.015, 1.015, 1.015)`;

      if (sheen) {
        sheen.style.background = `radial-gradient(circle 300px at ${x}px ${y}px, rgba(255, 255, 255, 0.45) 0%, rgba(255, 255, 255, 0) 70%)`;
        sheen.style.opacity = "1";
      }
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)`;
      if (sheen) {
        sheen.style.opacity = "0";
      }
    });
  });
}

/**
 * Smooth scroll anchor click handler
 */
function initSmoothScroll() {
  const scrollBtns = document.querySelectorAll(".hero-smooth-scroll-link, a[href='#services']");
  scrollBtns.forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.getElementById("services");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });
}

/**
 * Synchronize Hero Portal Active States with Application Mode
 */
export function updateHeroActiveState(mode) {
  const patientCard = document.getElementById("heroCardPatient");
  const doctorCard = document.getElementById("heroCardDoctor");
  const patientDot = document.getElementById("heroPatientStatusDot");
  const doctorDot = document.getElementById("heroDoctorStatusDot");

  if (mode === "doctor") {
    if (patientCard) patientCard.classList.remove("active-portal");
    if (doctorCard) doctorCard.classList.add("active-portal");
    if (patientDot) {
      patientDot.textContent = "● Ready to Switch";
      patientDot.classList.remove("active");
    }
    if (doctorDot) {
      doctorDot.textContent = "● Active Mode";
      doctorDot.classList.add("active");
    }
  } else {
    if (patientCard) patientCard.classList.add("active-portal");
    if (doctorCard) doctorCard.classList.remove("active-portal");
    if (patientDot) {
      patientDot.textContent = "● Active Mode";
      patientDot.classList.add("active");
    }
    if (doctorDot) {
      doctorDot.textContent = "● Ready to Switch";
      doctorDot.classList.remove("active");
    }
  }
}
