import { FaceLandmarker, FilesetResolver } from
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/vision_bundle.mjs";

// ---------------------------------------------------------------------------
// Modelo facial remoto y límites de imagen
// ---------------------------------------------------------------------------
const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_landmarker/" +
  "face_landmarker/float16/1/face_landmarker.task";
const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm";
const MAX_FILE_SIZE = 12 * 1024 * 1024;

const photoInput = document.querySelector("#photo-input");
const dropzone = document.querySelector("#dropzone");
const preview = document.querySelector("#preview");
const cameraButton = document.querySelector("#camera-button");
const cameraPanel = document.querySelector("#camera-panel");
const cameraPreview = document.querySelector("#camera-preview");
const captureButton = document.querySelector("#capture-button");
const closeCameraButton = document.querySelector("#close-camera-button");
const analyzeButton = document.querySelector("#analyze-button");
const buttonLabel = document.querySelector("#button-label");
const createOutfitStatus = document.querySelector("#create-outfit-status");
const createdOutfit = document.querySelector("#created-outfit");
const createdOutfitImage = document.querySelector("#created-outfit-image");
const saveCreatedOutfitButton = document.querySelector("#save-created-outfit-button");
const status = document.querySelector("#status");
const emptyState = document.querySelector("#empty-state");
const resultMessage = document.querySelector("#result-message");
const resultContent = document.querySelector("#result-content");
const paletteElement = document.querySelector("#palette");
const undertoneHelp = document.querySelector("#undertone-help");
const depthHelp = document.querySelector("#depth-help");
const undertoneScale = document.querySelector("#undertone-scale");
const depthScale = document.querySelector("#depth-scale");
const shoppingPanel = document.querySelector("#shopping-panel");
const garmentColors = document.querySelector("#garment-colors");
const garmentTypeSelect = document.querySelector("#garment-type");
const garmentSizeSelect = document.querySelector("#garment-size");
const garmentSizeLabel = document.querySelector("#garment-size-label");
const garmentGenderSelect = document.querySelector("#garment-gender");
const garmentTabs = [...document.querySelectorAll(".garment-tab")];
const allColorsButton = document.querySelector("#all-colors-button");
const falabellaHint = document.querySelector("#falabella-hint");
const falabellaProducts = document.querySelector("#falabella-products");
const mannequin = document.querySelector("#mannequin");
const mannequinGenderImages = [...document.querySelectorAll(".mannequin-gender-image")];
const mannequinTop = document.querySelector("#mannequin-torso");
const mannequinBottom = document.querySelector("#mannequin-legs");
const mannequinHips = document.querySelector(".mannequin-hips");
const mannequinDress = document.querySelector("#mannequin-dress");
const mannequinBottomGarment = document.querySelector("#mannequin-bottom-garment");
const mannequinTopImage = mannequinTop.querySelector(".mannequin-garment-image");
const mannequinBottomImage = mannequinBottomGarment.querySelector(".mannequin-garment-image");
const mannequinDressImage = mannequinDress.querySelector(".mannequin-garment-image");
const mannequinTopLabel = document.querySelector("#mannequin-top-label");
const mannequinBottomLabel = document.querySelector("#mannequin-bottom-label");
const mannequinDressLabel = document.querySelector("#mannequin-dress-label");
const mannequinNote = document.querySelector("#mannequin-note");
const selectedOutfitItems = document.querySelector("#selected-outfit-items");
const outfitEmpty = document.querySelector("#outfit-empty");
const outfitTotal = document.querySelector("#outfit-total");
const saveOutfitButton = document.querySelector("#save-outfit-button");
const savedStatus = document.querySelector("#saved-status");
const savedOutfitsElement = document.querySelector("#saved-outfits");
const savedSetsButton = document.querySelector("#saved-sets-button");
const savedSetsSection = document.querySelector("#saved-sets-section");
const closeSavedSetsButton = document.querySelector("#close-saved-sets-button");
const compareOutfitsButton = document.querySelector("#compare-outfits-button");
const outfitComparison = document.querySelector("#outfit-comparison");
const cartItems = document.querySelector("#cart-items");
const cartEmpty = document.querySelector("#cart-empty");
const cartCount = document.querySelector("#cart-count");
const cartTotal = document.querySelector("#cart-total");
const cartCheckoutButton = document.querySelector("#cart-checkout-button");

// ---------------------------------------------------------------------------
// Estado de la interfaz: fotografías, perfil de color y búsqueda de productos
// ---------------------------------------------------------------------------
let selectedFile = null;
let previewUrl = null;
let faceLandmarkerPromise = null;
let recommendedColors = [];
let selectedColor = null;
let allColorsSelected = false;
let showAllColors = false;
let falabellaProductResults = [];
let falabellaSearchController = null;
let falabellaSearchGeneration = 0;
let colorAvailabilityController = null;
let colorAvailabilityGeneration = 0;
let colorAvailabilityTimer = null;
const colorAvailabilityCache = new Map();
let activeGarmentTab = "upper";
let selectedSize = "";
let tryOnAvailable = false;
let tryOnMode = "local";
let tryOnConfigReady = false;
let tryOnUnavailableReason = "";
let tryOnBusy = false;
let tryOnGeneration = 0;
let tryOnDebounceTimer = null;
let createdImageData = "";
let cameraStream = null;
let selectedOutfit = [];
let shoppingCart = [];
let savedOutfits = [];
let photoSkinRgb = null;
let mannequinArtworkGeneration = 0;
let renderedMannequinUrl = "";
let clothingSegmenterPromise = null;
let mannequinOutfitGeneration = 0;
const garmentCutoutCache = new Map();
const selectedOutfitIds = new Set();
const ALL_SIZES_VALUE = "all";
const standardUpperSizes = ["XS", "S", "M", "L", "XL", "XXL"];
const standardLowerSizes = [
  { size: "38", label: "38 (XS)" },
  { size: "40", label: "40 (XS/S)" },
  { size: "42", label: "42 (S)" },
  { size: "44", label: "44 (M)" },
  { size: "46", label: "46 (M/L)" },
  { size: "48", label: "48 (L)" },
  { size: "50", label: "50 (XL)" },
  { size: "52", label: "52 (XL/XXL)" },
  { size: "54", label: "54 (XXL)" },
];

const garmentTypes = {
  "male-tshirt": { label: "Camiseta / Polera", searchTerms: ["poleras"], gender: "hombre", tab: "upper", category: "tops" },
  "male-polo": { label: "Polo", searchTerms: ["polos"], gender: "hombre", tab: "upper", category: "tops" },
  "male-sweater": { label: "Suéter / Cardigan", searchTerms: ["sweaters", "cardigans"], gender: "hombre", tab: "upper", category: "tops" },
  "male-shirt": { label: "Camisa", searchTerms: ["camisas"], gender: "hombre", tab: "upper", category: "tops" },
  "male-hoodie": { label: "Sudadera / Hoodie", searchTerms: ["polerones", "hoodies"], gender: "hombre", tab: "upper", category: "tops" },
  "male-jeans": { label: "Jeans", searchTerms: ["jeans"], gender: "hombre", tab: "lower", category: "bottoms" },
  "male-chinos": { label: "Pantalones Chino", searchTerms: ["pantalones chino"], gender: "hombre", tab: "lower", category: "bottoms" },
  "male-dress-pants": { label: "Pantalón de vestir", searchTerms: ["pantalones de vestir"], gender: "hombre", tab: "lower", category: "bottoms" },
  "male-joggers": { label: "Joggers / Pantalón deportivo", searchTerms: ["joggers", "pantalones deportivos"], gender: "hombre", tab: "lower", category: "bottoms" },
  "male-shorts": { label: "Shorts", searchTerms: ["shorts"], gender: "hombre", tab: "lower", category: "bottoms" },
  "female-blouse": { label: "Blusa", searchTerms: ["blusas"], gender: "mujer", tab: "upper", category: "tops" },
  "female-tshirt": { label: "Camiseta / Polera", searchTerms: ["poleras"], gender: "mujer", tab: "upper", category: "tops" },
  "female-crop-top": { label: "Crop top", searchTerms: ["crop tops"], gender: "mujer", tab: "upper", category: "tops" },
  "female-sweater": { label: "Suéter / Chaleco", searchTerms: ["sweaters", "chalecos"], gender: "mujer", tab: "upper", category: "tops" },
  "female-body": { label: "Body", searchTerms: ["bodys"], gender: "mujer", tab: "upper", category: "one-pieces" },
  "female-jeans": { label: "Jeans", searchTerms: ["jeans"], gender: "mujer", tab: "lower", category: "bottoms" },
  "female-dress-pants": { label: "Pantalón de vestir", searchTerms: ["pantalones de vestir"], gender: "mujer", tab: "lower", category: "bottoms" },
  "female-skirt": { label: "Falda", searchTerms: ["faldas"], gender: "mujer", tab: "lower", category: "bottoms" },
  "female-shorts": { label: "Shorts", searchTerms: ["shorts"], gender: "mujer", tab: "lower", category: "bottoms" },
  "female-leggings": { label: "Leggings", searchTerms: ["leggings"], gender: "mujer", tab: "lower", category: "bottoms" },
  "all-hombre-upper": { label: "Prenda superior", searchTerms: ["ropa superior"], gender: "hombre", tab: "upper", category: "tops", all: true },
  "all-hombre-lower": { label: "Prenda inferior", searchTerms: ["ropa inferior"], gender: "hombre", tab: "lower", category: "bottoms", all: true },
  "all-mujer-upper": { label: "Prenda superior", searchTerms: ["ropa superior"], gender: "mujer", tab: "upper", category: "tops", all: true },
  "all-mujer-lower": { label: "Prenda inferior", searchTerms: ["ropa inferior"], gender: "mujer", tab: "lower", category: "bottoms", all: true },
};

const palette = [
  { name: "Terracota", hex: "#B96345", temperature: "calida", depth: 1 },
  { name: "Coral", hex: "#E78373", temperature: "calida", depth: 0 },
  { name: "Mostaza", hex: "#C39A35", temperature: "calida", depth: 1 },
  { name: "Camel", hex: "#B88A62", temperature: "calida", depth: 1 },
  { name: "Verde oliva", hex: "#666B3E", temperature: "calida", depth: 2 },
  { name: "Chocolate", hex: "#60402F", temperature: "calida", depth: 2 },
  { name: "Lavanda", hex: "#B7A4CF", temperature: "fria", depth: 0 },
  { name: "Azul royal", hex: "#3456A1", temperature: "fria", depth: 1 },
  { name: "Azul marino", hex: "#26364F", temperature: "fria", depth: 2 },
  { name: "Fucsia", hex: "#C43E79", temperature: "fria", depth: 1 },
  { name: "Verde esmeralda", hex: "#267B60", temperature: "fria", depth: 1 },
  { name: "Ciruela", hex: "#654265", temperature: "fria", depth: 2 },
  { name: "Marfil", hex: "#F0E6D3", temperature: "neutra", depth: 0 },
  { name: "Gris perla", hex: "#D5D4D0", temperature: "neutra", depth: 0 },
  { name: "Taupe", hex: "#8C7C6E", temperature: "neutra", depth: 1 },
  { name: "Gris carbón", hex: "#454747", temperature: "neutra", depth: 2 },
  { name: "Negro", hex: "#252525", temperature: "neutra", depth: 2 },
];

// ---------------------------------------------------------------------------
// Entrada de imagen: archivo local, arrastre o captura de cámara
// ---------------------------------------------------------------------------
function setStatus(message, isError = false) {
  status.textContent = message;
  status.classList.toggle("error", isError);
}

function setBusy(isBusy) {
  analyzeButton.disabled = isBusy || !selectedFile;
  buttonLabel.textContent = isBusy ? "Analizando fotografía…" : "Analizar mi paleta";
}

function setCreateOutfitStatus(message, isError = false) {
  createOutfitStatus.textContent = message;
  createOutfitStatus.classList.toggle("error", isError);
  createOutfitStatus.setAttribute("aria-busy", String(tryOnBusy));
}

function createExplanationTooltip(explanation) {
  const tooltip = document.createElement("span");
  tooltip.className = "explanation-tooltip";
  const trigger = document.createElement("button");
  trigger.className = "explanation-tooltip-trigger";
  trigger.type = "button";
  trigger.textContent = "?";
  trigger.setAttribute("aria-label", "Mostrar explicación");
  const description = document.createElement("span");
  description.className = "explanation-tooltip-content";
  description.id = `explanation-${crypto.randomUUID()}`;
  description.setAttribute("role", "tooltip");
  description.textContent = explanation;
  trigger.setAttribute("aria-describedby", description.id);
  tooltip.append(trigger, description);
  return tooltip;
}

function setExplanationTooltip(element, explanation, heading = null) {
  element.replaceChildren();
  if (heading) element.append(heading);
  element.append(createExplanationTooltip(explanation));
}

function installExplanationTooltips() {
  document.querySelectorAll(".upload-card .section-heading, .result-card .section-heading")
    .forEach((sectionHeading) => {
      const title = sectionHeading.querySelector("h2");
      const description = sectionHeading.querySelector("p");
      const explanation = description?.textContent.trim();
      if (!title || !explanation) return;
      title.classList.add("help-heading");
      title.append(createExplanationTooltip(explanation));
      description.remove();
    });

  for (const element of document.querySelectorAll(".photo-actions > p, .mannequin-note")) {
    setExplanationTooltip(element, element.textContent.trim());
  }

  const outfitPriceNote = document.querySelector(".outfit-price-note");
  const outfitHeading = document.querySelector("#outfit-heading");
  if (outfitPriceNote && outfitHeading) {
    outfitHeading.append(createExplanationTooltip(outfitPriceNote.textContent.trim()));
    outfitPriceNote.remove();
  }
}

function openSavedSets() {
  savedSetsSection.hidden = false;
  closeSavedSetsButton.focus();
}

function closeSavedSets() {
  savedSetsSection.hidden = true;
  savedSetsButton.focus();
}

function acceptFile(file) {
  if (!file) return;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    setStatus("Elige una imagen JPG, PNG o WEBP.", true);
    return;
  }
  if (file.size > MAX_FILE_SIZE) {
    setStatus("La fotografía supera el límite de 12 MB.", true);
    return;
  }

  stopCamera();
  selectedFile = file;
  photoSkinRgb = null;
  updateMannequinGender();
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  preview.src = previewUrl;
  preview.hidden = false;
  dropzone.classList.add("has-preview");
  emptyState.hidden = false;
  resultMessage.hidden = true;
  resultMessage.classList.remove("error");
  resultContent.hidden = true;
  shoppingPanel.hidden = true;
  selectedOutfit = [];
  shoppingCart = [];
  renderSelectedOutfit();
  scheduleAutomaticTryOn();
  setBusy(false);
  setStatus("Foto lista. Al analizarla, la imagen permanecerá en este navegador.");
}

photoInput.addEventListener("change", () => acceptFile(photoInput.files[0]));

async function openCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setStatus("Este navegador no permite acceder a la cámara desde esta página.", true);
    return;
  }
  cameraButton.disabled = true;
  setStatus("Solicitando permiso para usar la cámara…");
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: "user" } },
    });
    cameraPreview.srcObject = cameraStream;
    await cameraPreview.play();
    cameraPanel.hidden = false;
    setStatus("Cámara activa. Encuadra el rostro y toma la fotografía.");
  } catch (error) {
    const message = error instanceof Error && error.name === "NotAllowedError"
      ? "No se concedió permiso para usar la cámara. Puedes seleccionar una foto."
      : error instanceof Error && error.name === "NotFoundError"
        ? "No se encontró una cámara disponible en este dispositivo."
        : "No se pudo iniciar la cámara. Comprueba los permisos de Chrome.";
    setStatus(message, true);
    stopCamera();
  } finally {
    cameraButton.disabled = false;
  }
}

function stopCamera() {
  if (cameraStream) {
    for (const track of cameraStream.getTracks()) track.stop();
    cameraStream = null;
  }
  cameraPreview.srcObject = null;
  cameraPanel.hidden = true;
}

async function capturePhoto() {
  if (!cameraStream || !cameraPreview.videoWidth || !cameraPreview.videoHeight) {
    setStatus("La cámara todavía no está lista. Espera un momento e inténtalo otra vez.", true);
    return;
  }
  const canvas = document.createElement("canvas");
  canvas.width = cameraPreview.videoWidth;
  canvas.height = cameraPreview.videoHeight;
  const context = canvas.getContext("2d");
  context.translate(canvas.width, 0);
  context.scale(-1, 1);
  context.drawImage(cameraPreview, 0, 0);
  const photoBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!photoBlob) {
    setStatus("No se pudo guardar la captura. Inténtalo otra vez.", true);
    return;
  }
  acceptFile(new File([photoBlob], "foto-cliente.jpg", { type: "image/jpeg" }));
}

cameraButton.addEventListener("click", openCamera);
captureButton.addEventListener("click", capturePhoto);
closeCameraButton.addEventListener("click", () => {
  stopCamera();
  setStatus("Cámara cerrada. Puedes seleccionar una foto o abrir la cámara de nuevo.");
});
window.addEventListener("pagehide", stopCamera);

for (const eventName of ["dragenter", "dragover"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.add("is-dragging");
  });
}
for (const eventName of ["dragleave", "drop"]) {
  dropzone.addEventListener(eventName, (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-dragging");
  });
}
dropzone.addEventListener("drop", (event) => acceptFile(event.dataTransfer.files[0]));

function getFaceLandmarker() {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = (async () => {
      const vision = await FilesetResolver.forVisionTasks(WASM_URL);
      return FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: "CPU" },
        runningMode: "IMAGE",
        numFaces: 5,
        minFaceDetectionConfidence: 0.5,
        minFacePresenceConfidence: 0.5,
      });
    })();
  }
  return faceLandmarkerPromise;
}

// ---------------------------------------------------------------------------
// Muestreo facial y métricas cromáticas
// ---------------------------------------------------------------------------
function canvasFromImage(image) {
  const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.naturalWidth * scale);
  canvas.height = Math.round(image.naturalHeight * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return { canvas, context };
}

function sampleCheeks(context, width, height, landmarks) {
  const faceXs = landmarks.map((point) => point.x * width);
  const faceYs = landmarks.map((point) => point.y * height);
  const faceWidth = Math.max(...faceXs) - Math.min(...faceXs);
  const faceHeight = Math.max(...faceYs) - Math.min(...faceYs);
  const radiusX = Math.max(4, Math.round(faceWidth * 0.035));
  const radiusY = Math.max(4, Math.round(faceHeight * 0.025));
  const cheekCenters = [landmarks[50], landmarks[280]];
  const samples = [];

  for (const point of cheekCenters) {
    const centerX = Math.round(point.x * width);
    const centerY = Math.round(point.y * height);
    const x0 = Math.max(0, centerX - radiusX);
    const y0 = Math.max(0, centerY - radiusY);
    const sampleWidth = Math.min(width - x0, radiusX * 2 + 1);
    const sampleHeight = Math.min(height - y0, radiusY * 2 + 1);
    const pixels = context.getImageData(x0, y0, sampleWidth, sampleHeight).data;

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const dx = (x - radiusX) / radiusX;
        const dy = (y - radiusY) / radiusY;
        if (dx * dx + dy * dy > 1) continue;
        const offset = (y * sampleWidth + x) * 4;
        const red = pixels[offset];
        const green = pixels[offset + 1];
        const blue = pixels[offset + 2];
        const chroma = Math.max(red, green, blue) - Math.min(red, green, blue);
        if (pixels[offset + 3] > 0 && red > 35 && chroma > 8) {
          samples.push([red, green, blue]);
        }
      }
    }
  }
  return samples;
}

function median(values) {
  const ordered = [...values].sort((a, b) => a - b);
  const middle = Math.floor(ordered.length / 2);
  return ordered.length % 2 ? ordered[middle] : (ordered[middle - 1] + ordered[middle]) / 2;
}

function srgbToLab([red, green, blue]) {
  const linear = (channel) => {
    const value = channel / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  const r = linear(red);
  const g = linear(green);
  const b = linear(blue);
  const x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047;
  const y = (r * 0.2126729 + g * 0.7151522 + b * 0.072175) / 1.0;
  const z = (r * 0.0193339 + g * 0.119192 + b * 0.9503041) / 1.08883;
  const delta = 6 / 29;
  const f = (value) => value > delta ** 3
    ? Math.cbrt(value)
    : value / (3 * delta ** 2) + 4 / 29;
  const fx = f(x);
  const fy = f(y);
  const fz = f(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

function analyzeSkin(samples) {
  if (samples.length < 30) {
    throw new Error(
      "No se obtuvieron suficientes muestras de las mejillas. Prueba un retrato frontal, nítido y con luz uniforme.",
    );
  }
  const rgb = [0, 1, 2].map((channel) => median(samples.map((pixel) => pixel[channel])));
  const [lightness, a, b] = srgbToLab(rgb);
  const warmthIndex = b - a;
  const undertone = warmthIndex > 7 ? "cálido" : warmthIndex < -7 ? "frío" : "neutro";
  const depth = lightness >= 68 ? "clara" : lightness < 47 ? "oscura" : "media";
  return { undertone, depth, warmthIndex, lightness, rgb };
}

function explainUndertone(skin) {
  const warmthIndex = skin.warmthIndex.toFixed(1);
  if (skin.warmthIndex > 7) {
    return `En las mejillas se perciben más matices dorados que rosados, por eso se estima cálido. Señal del análisis: ${warmthIndex} (sobre +7).`;
  }
  if (skin.warmthIndex < -7) {
    return `En las mejillas se perciben más matices rosados que dorados, por eso se estima frío. Señal del análisis: ${warmthIndex} (bajo −7).`;
  }
  return `Los matices de las mejillas se ven equilibrados, por eso se estima neutro. Señal del análisis: ${warmthIndex} (entre −7 y +7).`;
}

function explainDepth(skin) {
  const lightness = skin.lightness.toFixed(1);
  if (skin.lightness >= 68) {
    return `Las muestras de la piel tienen una claridad alta, por eso se estima clara. Medición: ${lightness} (desde 68).`;
  }
  if (skin.lightness < 47) {
    return `Las muestras de la piel tienen una claridad baja, por eso se estima oscura. Medición: ${lightness} (bajo 47).`;
  }
  return `Las muestras de la piel tienen una claridad intermedia, por eso se estima media. Medición: ${lightness} (entre 47 y menos de 68).`;
}

function updateProfileScale(element, level, label) {
  element.setAttribute("aria-label", label);
  element.querySelectorAll("[data-level]").forEach((option) => {
    option.classList.toggle("is-selected", option.dataset.level === level);
  });
}

// ---------------------------------------------------------------------------
// Clasificación de paleta y presentación de los colores recomendados
// ---------------------------------------------------------------------------
function rateColor(skin, garment) {
  let score = 0;
  let temperatureReason;
  if (skin.undertone === garment.temperature) {
    score += 2;
    temperatureReason =
      `Su temperatura ${garment.temperature} acompaña el subtono estimado.`;
  } else if (skin.undertone === "neutro" || garment.temperature === "neutra") {
    score += 1;
    temperatureReason = "El matiz neutro puede servir de puente entre temperaturas.";
  } else {
    temperatureReason =
      "Aporta contraste; puede funcionar si buscas un efecto intencional.";
  }

  const depthDifference = Math.abs(skin.depthIndex - garment.depth);
  const contrastScore = depthDifference === 0 ? 1 : depthDifference === 1 ? 2 : 1;
  score += contrastScore;
  const depthReason = depthDifference === 1
    ? "La profundidad aporta un contraste visual medio."
    : "La profundidad produce un contraste visual más suave o más marcado.";
  return { score, reason: `${temperatureReason} ${depthReason}` };
}

function renderRecommendations(skin) {
  const depthIndex = { clara: 0, media: 1, oscura: 2 }[skin.depth];
  const ranked = palette
    .map((garment) => {
      const rating = rateColor({ ...skin, depthIndex }, garment);
      return { ...garment, ...rating };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 5);

  paletteElement.replaceChildren();
  for (const item of ranked) {
    const row = document.createElement("div");
    row.className = "swatch-row";
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = "swatch";
    swatch.style.backgroundColor = item.hex;
    swatch.setAttribute("aria-label", `Muestra ${item.name}`);
    swatch.title = `Explorar ${item.name}`;
    swatch.addEventListener("click", () => chooseGarmentColor(item));
    const details = document.createElement("div");
    const name = document.createElement("div");
    name.className = "swatch-name";
    name.textContent = item.name;
    const reason = document.createElement("div");
    reason.className = "swatch-reason";
    reason.textContent = item.reason;
    details.append(name, reason);
    const score = document.createElement("span");
    score.className = "score";
    score.textContent = `${item.score}/4`;
    row.append(swatch, details, score);
    paletteElement.append(row);
  }
  recommendedColors = ranked;
  selectedColor = ranked[0] || null;
  allColorsSelected = false;
  showAllColors = false;
  falabellaProductResults = [];
  renderGarmentTypeOptions();
  resetSizeOptions();
  shoppingPanel.hidden = false;
  renderGarmentColors();
  renderFalabellaFilters();
}

// ---------------------------------------------------------------------------
// Filtros y resultados de productos públicos de Falabella
// ---------------------------------------------------------------------------
function chooseGarmentColor(item) {
  selectedColor = item;
  allColorsSelected = false;
  selectedOutfit = selectedOutfit.map((selected) => ({
    ...selected,
    color: item.name,
    colorHex: item.hex,
  }));
  renderGarmentColors();
  renderFalabellaFilters(true);
  renderSelectedOutfit();
  scheduleAutomaticTryOn();
}

function toggleColorPalette() {
  if (showAllColors) {
    showAllColors = false;
    allColorsSelected = false;
    selectedColor = recommendedColors[0] || null;
  } else {
    selectedColor = null;
    allColorsSelected = true;
    showAllColors = true;
  }
  renderGarmentColors();
  renderFalabellaFilters(true);
}

function renderGarmentTypeOptions(selectAll = false) {
  const previousType = garmentTypeSelect.value;
  const gender = garmentGenderSelect.value;
  garmentTypeSelect.replaceChildren();
  if (!gender) {
    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Selecciona un género primero";
    placeholder.disabled = true;
    placeholder.selected = true;
    garmentTypeSelect.append(placeholder);
    garmentTypeSelect.disabled = true;
  } else {
    garmentTypeSelect.disabled = false;
  }
  const types = Object.entries(garmentTypes)
    .filter(([, garment]) =>
      garment.tab === activeGarmentTab
      && garment.gender === gender
      && !garment.all,
    )
    .map(([value]) => value);
  const allType = Object.keys(garmentTypes).find((value) => {
    const garment = garmentTypes[value];
    return garment.tab === activeGarmentTab
      && garment.gender === gender
      && garment.all;
  });
  if (gender && allType) {
    const option = document.createElement("option");
    option.value = allType;
    option.textContent = "Todos";
    garmentTypeSelect.append(option);
  }
  for (const [value, garment] of Object.entries(garmentTypes)) {
    if (garment.tab !== activeGarmentTab || garment.gender !== gender || garment.all) continue;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = garment.label;
    garmentTypeSelect.append(option);
  }
  if (gender) {
    garmentTypeSelect.value =
      !selectAll && types.includes(previousType) ? previousType : allType;
  }
  garmentSizeLabel.textContent = activeGarmentTab === "upper"
    ? "TALLA SUPERIOR VERIFICADA"
    : "TALLA INFERIOR VERIFICADA";
  garmentSizeSelect.setAttribute(
    "aria-label",
    activeGarmentTab === "upper" ? "Talla superior disponible" : "Talla inferior disponible",
  );
}

function resetSizeOptions(preserveSelection = false) {
  const previousSelection = preserveSelection
    ? selectedSize
    : garmentGenderSelect.value
      ? ALL_SIZES_VALUE
      : "";
  selectedSize = previousSelection;
  garmentSizeSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecciona una talla antes de explorar";
  garmentSizeSelect.append(placeholder);
  const allSizesOption = document.createElement("option");
  allSizesOption.value = ALL_SIZES_VALUE;
  allSizesOption.textContent = "Todos";
  garmentSizeSelect.append(allSizesOption);
  const sizes = activeGarmentTab === "upper"
    ? standardUpperSizes.map((size) => ({ size, label: size }))
    : standardLowerSizes;
  for (const size of sizes) {
    const option = document.createElement("option");
    option.value = size.size;
    option.textContent = size.label;
    garmentSizeSelect.append(option);
  }
  garmentSizeSelect.value = selectedSize;
  garmentSizeSelect.disabled = !garmentGenderSelect.value;
}

function setActiveGarmentTab(tab) {
  if (tab === activeGarmentTab) return;
  activeGarmentTab = tab;
  for (const button of garmentTabs) {
    const isSelected = button.dataset.category === tab;
    button.classList.toggle("active", isSelected);
    button.setAttribute("aria-selected", String(isSelected));
    button.tabIndex = isSelected ? 0 : -1;
  }
  falabellaProductResults = [];
  renderGarmentTypeOptions();
  resetSizeOptions();
  renderFalabellaFilters();
}

function populateAvailableSizes(products) {
  const sizes = activeGarmentTab === "upper"
    ? standardUpperSizes.map((size) => ({ size, label: size }))
    : standardLowerSizes;
  const previouslySelectedSize = selectedSize;
  const stockCounts = new Map(sizes.map((size) => [
    size.size,
    new Set(
      products
        .filter((product) =>
          (product.sizes || []).some(
            (variant) => variant.size.toUpperCase().trim() === size.size,
          ),
        )
        .map((product) => product.url),
    ).size,
  ]));
  garmentSizeSelect.replaceChildren();
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Selecciona una talla antes de explorar";
  garmentSizeSelect.append(placeholder);
  const allSizesOption = document.createElement("option");
  allSizesOption.value = ALL_SIZES_VALUE;
  allSizesOption.textContent = "Todos";
  garmentSizeSelect.append(allSizesOption);
  for (const size of sizes) {
    const stockCount = stockCounts.get(size.size) || 0;
    const option = document.createElement("option");
    option.value = size.size;
    option.textContent = stockCount
      ? `${size.label} (${stockCount} ${stockCount === 1 ? "producto disponible" : "productos disponibles"})`
      : `${size.label} (sin stock)`;
    option.disabled = stockCount === 0;
    if (option.disabled) option.classList.add("out-of-stock");
    garmentSizeSelect.append(option);
  }
  selectedSize = previouslySelectedSize === ALL_SIZES_VALUE
    || stockCounts.get(previouslySelectedSize) > 0
    ? previouslySelectedSize
    : "";
  garmentSizeSelect.value = selectedSize;
  garmentSizeSelect.disabled = !garmentGenderSelect.value;
}

function productMatchesGarmentTerm(product, terms) {
  const normalizeWords = (text) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
  const stem = (word) => {
    const normalized = word === "sueter" ? "sweater" : word;
    if (normalized.length > 5 && normalized.endsWith("es")) {
      return normalized.slice(0, -2);
    }
    return normalized.length > 4 && normalized.endsWith("s")
      ? normalized.slice(0, -1)
      : normalized;
  };
  const productWords = new Set(normalizeWords(product.name).map(stem));
  const excludedWords = [
    "accesorios", "bolso", "cartera", "cinturon", "calcetin", "media",
    "boxer", "calzoncillo", "sosten", "zapato", "zapatilla", "gorro",
    "bufanda", "guante",
  ];
  if (excludedWords.some((word) => productWords.has(stem(word)))) return false;
  return terms.some((term) =>
    normalizeWords(term)
      .filter((word) => word.length > 3 && word !== "ropa")
      .some((word) => productWords.has(stem(word))),
  );
}

function productMatchesGender(product, gender) {
  const normalizeWords = (text) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
  const words = new Set(normalizeWords(
    `${product.name} ${product.gender_metadata || ""}`,
  ));
  const masculineMarkers = [
    "hombre", "hombres", "masculino", "masculina", "masculinos", "masculinas",
    "man", "men", "mens", "male",
  ];
  const feminineMarkers = [
    "mujer", "mujeres", "femenino", "femenina", "femeninos", "femeninas",
    "woman", "women", "womens", "female", "ladies",
  ];
  const unisexMarkers = ["unisex", "unisexo", "genderless"];
  const childMarkers = [
    "infantil", "nino", "nina", "ninos", "ninas", "kids", "children", "child",
  ];
  if (childMarkers.some((marker) => words.has(marker))) return false;
  const hasMasculineMarker = masculineMarkers.some((marker) => words.has(marker));
  const hasFeminineMarker = feminineMarkers.some((marker) => words.has(marker));
  if (hasMasculineMarker && hasFeminineMarker) return false;
  if (!hasMasculineMarker && !hasFeminineMarker) {
    return true;
  }
  return gender === "hombre"
    ? hasMasculineMarker || unisexMarkers.some((marker) => words.has(marker))
    : gender === "mujer"
      && (hasFeminineMarker || unisexMarkers.some((marker) => words.has(marker)));
}

function filteredProductsForSelectedSize() {
  return falabellaProductResults.filter((product) => {
    const availableSizes = product.sizes || [];
    if (!availableSizes.length) return false;
    if (selectedSize === ALL_SIZES_VALUE) return true;
    if (!selectedSize) return false;
    return availableSizes.some(
      (variant) => variant.size.toUpperCase().trim() === selectedSize,
    );
  });
}

function renderFalabellaProducts(products = filteredProductsForSelectedSize()) {
  falabellaProducts.replaceChildren();
  for (const product of products) {
    const card = document.createElement("article");
    card.className = "falabella-product-card";
    const image = document.createElement("img");
    image.src = product.image_url;
    image.alt = product.name;
    image.loading = "lazy";

    const info = document.createElement("div");
    info.className = "falabella-product-info";
    const name = document.createElement("strong");
    name.textContent = product.name;
    info.append(name);
    if (product.brand) {
      const brand = document.createElement("span");
      brand.textContent = product.brand;
      info.append(brand);
    }
    if (product.price) {
      const price = document.createElement("span");
      const amount = Number(product.price);
      price.textContent = Number.isFinite(amount)
        ? new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP" }).format(amount)
        : `${product.price} ${product.currency}`;
      info.append(price);
    }
    const variantsBySize = new Map(
      (product.sizes || []).map((variant) => [
        variant.size.toUpperCase().trim(),
        variant,
      ]),
    );
    const sizeOptions = activeGarmentTab === "upper"
      ? standardUpperSizes.map((size) => ({ size, label: size }))
      : standardLowerSizes;
    const sizes = document.createElement("span");
    sizes.className = "falabella-product-sizes";
    sizes.textContent = `Disponibilidad por talla: ${sizeOptions
      .map(({ size, label }) =>
        `${label}: ${variantsBySize.has(size) ? "disponible (unidades no informadas)" : "sin disponibilidad"}`,
      )
      .join(" · ")}`;
    info.append(sizes);

    const source = document.createElement("a");
    source.href = product.url;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = "Ver producto ↗";
    const garmentType = product.garmentType || garmentTypeSelect.value;
    const variantBySize = new Map(
      [...(product.sizes || [])].map((variant) => [
        variant.size.toUpperCase().trim(),
        variant,
      ]),
    );
    let selectedVariant = selectedSize && selectedSize !== ALL_SIZES_VALUE
      ? variantBySize.get(selectedSize) || null
      : null;
    const sizeSelect = document.createElement("select");
    sizeSelect.className = "falabella-product-size-select";
    sizeSelect.setAttribute("aria-label", `Talla de ${product.name}`);
    if (selectedSize === ALL_SIZES_VALUE) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Elige una talla";
      sizeSelect.append(placeholder);
      const sizeLabels = new Map([
        ...standardUpperSizes.map((size) => [size, size]),
        ...standardLowerSizes.map(({ size, label }) => [size, label]),
      ]);
      for (const [size, variant] of variantBySize) {
        const option = document.createElement("option");
        option.value = size;
        option.textContent = sizeLabels.get(size) || size;
        sizeSelect.append(option);
      }
      sizeSelect.addEventListener("change", () => {
        selectedVariant = variantBySize.get(sizeSelect.value) || null;
        updateAddButton();
      });
      info.append(sizeSelect);
    }
    const addButton = document.createElement("button");
    addButton.className = "falabella-add-button";
    addButton.type = "button";
    const updateAddButton = () => {
      const alreadySelected = selectedOutfit.some(
        (item) => item.url === (selectedVariant?.url || product.url),
      );
      addButton.textContent = alreadySelected
        ? "En el conjunto"
        : selectedVariant
          ? "Agregar al conjunto"
          : "Elige una talla";
      addButton.disabled = !selectedVariant || alreadySelected;
    };
    updateAddButton();
    addButton.addEventListener("click", () =>
      addProductToOutfit(product, garmentType, selectedVariant),
    );
    const actions = document.createElement("div");
    actions.className = "falabella-product-actions";
    actions.append(source, addButton);
    info.append(actions);
    card.append(image, info);
    falabellaProducts.append(card);
  }
}

function addProductToOutfit(product, garmentType, selectedVariant) {
  const garment = garmentTypes[garmentType];
  if (!garment || (!selectedColor && !allColorsSelected) || !selectedVariant) return;
  const priceValueText = String(selectedVariant.price || product.price || "");
  const rawPrice = priceValueText.replace(/[^\d.,-]/g, "");
  const priceDigits = /[.,]\d{2}$/.test(rawPrice)
    ? rawPrice.slice(0, -3).replace(/\D/g, "")
    : rawPrice.replace(/\D/g, "");
  const parsedPrice = priceDigits ? Number(priceDigits) : null;
  const item = {
    name: product.name,
    brand: product.brand,
    price: priceValueText,
    priceValue: Number.isSafeInteger(parsedPrice) ? parsedPrice : null,
    currency: product.currency || "CLP",
    url: selectedVariant.url || product.url,
    image_url: selectedVariant.image_url || product.image_url,
    fallback_image_url: product.image_url,
    size: selectedVariant.size,
    garmentType,
    garment: garment.label,
    category: garment.category,
    color: selectedColor?.name || "Color no especificado",
    colorHex: selectedColor?.hex || "#8C7C6E",
  };

  if (garment.category === "one-pieces") {
    selectedOutfit = [item];
  } else if (garment.category === "bottoms") {
    selectedOutfit = selectedOutfit.filter(
      (selected) => garmentTypes[selected.garmentType]?.category !== "bottoms"
        && garmentTypes[selected.garmentType]?.category !== "one-pieces",
    );
    selectedOutfit.push(item);
  } else {
    selectedOutfit = selectedOutfit.filter(
      (selected) => garmentTypes[selected.garmentType]?.category !== "tops"
        && garmentTypes[selected.garmentType]?.category !== "one-pieces",
    );
    selectedOutfit.push(item);
  }
  shoppingCart = selectedOutfit.map((selected) => ({ ...selected }));
  renderSelectedOutfit();
  renderFalabellaProducts();
  scheduleAutomaticTryOn();
}

function renderFalabellaFilters(preserveSizeSelection = false) {
  falabellaProductResults = [];
  resetSizeOptions(preserveSizeSelection);
  const garment = garmentTypes[garmentTypeSelect.value];
  const gender = garmentGenderSelect.value;
  falabellaProducts.replaceChildren();
  falabellaHint.textContent = (selectedColor || allColorsSelected) && garment && gender
    ? "Elige género y tipo de prenda para ver resultados. La talla verificada comienza en Todos."
    : "Elige un género, color y tipo de prenda para buscar. La talla verificada comienza en Todos.";
  searchFalabellaProducts();
  scheduleColorAvailabilityCheck();
}

function formatPrice(price) {
  if (!Number.isSafeInteger(price)) return "Precio no disponible";
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(price);
}

function totalForOutfit(items) {
  const pricedItems = items.filter((item) => Number.isSafeInteger(item.priceValue));
  return pricedItems.length
    ? pricedItems.reduce((sum, item) => sum + item.priceValue, 0)
    : null;
}

function renderSelectedOutfit() {
  selectedOutfitItems.replaceChildren();
  outfitEmpty.hidden = selectedOutfit.length > 0;
  outfitTotal.textContent = selectedOutfit.length
    ? formatPrice(totalForOutfit(selectedOutfit))
    : "$0";
  saveOutfitButton.disabled = selectedOutfit.length === 0;

  for (const item of selectedOutfit) {
    const row = document.createElement("article");
    row.className = "selected-outfit-item";
    const image = document.createElement("img");
    image.src = item.image_url;
    image.alt = "";
    image.loading = "lazy";
    const details = document.createElement("div");
    details.className = "selected-outfit-details";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const category = document.createElement("span");
    category.textContent = `${item.garment} · ${item.color}`;
    const price = document.createElement("span");
    price.className = "selected-outfit-price";
    price.textContent = formatPrice(item.priceValue);
    details.append(name, category, price);
    const remove = document.createElement("button");
    remove.className = "remove-outfit-item";
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.setAttribute("aria-label", `Quitar ${item.name} del conjunto`);
    remove.addEventListener("click", () => {
      selectedOutfit = selectedOutfit.filter((selected) => selected.url !== item.url);
      shoppingCart = shoppingCart.filter((selected) => selected.url !== item.url);
      renderSelectedOutfit();
      renderFalabellaProducts();
      scheduleAutomaticTryOn();
    });
    row.append(image, details, remove);
    selectedOutfitItems.append(row);
  }
  renderShoppingCart();
  updateMannequinOutfit();
}

function renderShoppingCart() {
  cartItems.replaceChildren();
  const itemCount = shoppingCart.length;
  cartCount.textContent = `${itemCount} ${itemCount === 1 ? "producto" : "productos"}`;
  cartEmpty.hidden = itemCount > 0;
  cartTotal.textContent = itemCount ? formatPrice(totalForOutfit(shoppingCart)) : "$0";
  cartCheckoutButton.disabled = itemCount === 0;

  for (const item of shoppingCart) {
    const row = document.createElement("article");
    row.className = "cart-item";
    const image = document.createElement("img");
    image.src = item.image_url;
    image.alt = "";
    image.loading = "lazy";
    const details = document.createElement("div");
    details.className = "cart-item-details";
    const name = document.createElement("strong");
    name.textContent = item.name;
    const metadata = document.createElement("span");
    metadata.textContent = `${item.garment} · Talla ${item.size} · ${item.color}`;
    details.append(name, metadata);
    const price = document.createElement("strong");
    price.className = "cart-item-price";
    price.textContent = formatPrice(item.priceValue);
    const remove = document.createElement("button");
    remove.className = "cart-remove-button";
    remove.type = "button";
    remove.textContent = "Quitar";
    remove.setAttribute("aria-label", `Quitar ${item.name} del carrito`);
    remove.addEventListener("click", () => {
      shoppingCart = shoppingCart.filter((selected) => selected.url !== item.url);
      selectedOutfit = selectedOutfit.filter((selected) => selected.url !== item.url);
      renderSelectedOutfit();
      renderFalabellaProducts();
      scheduleAutomaticTryOn();
    });
    row.append(image, details, price, remove);
    cartItems.append(row);
  }
}

function openCartProducts() {
  if (!shoppingCart.length) return;
  for (const item of shoppingCart) {
    window.open(item.url, "_blank", "noopener,noreferrer");
  }
}

function updateMannequinGender() {
  const gender = garmentGenderSelect.value;
  mannequin.dataset.gender = gender;
  mannequinArtworkGeneration += 1;
  mannequinGenderImages.forEach((image) => {
    image.hidden = !gender || image.dataset.gender !== gender;
  });
  if (gender && photoSkinRgb) {
    renderMannequinSkinTone(gender, photoSkinRgb);
  } else if (gender) {
    const image = mannequinGenderImages.find((entry) => entry.dataset.gender === gender);
    image.src = `/api/mannequin-image?gender=${encodeURIComponent(gender)}`;
    if (renderedMannequinUrl) URL.revokeObjectURL(renderedMannequinUrl);
    renderedMannequinUrl = "";
  } else if (renderedMannequinUrl) {
    URL.revokeObjectURL(renderedMannequinUrl);
    renderedMannequinUrl = "";
  }
  mannequin.setAttribute(
    "aria-label",
    gender === "mujer"
      ? "Maniquí femenino con el conjunto seleccionado"
      : gender === "hombre"
        ? "Maniquí masculino con el conjunto seleccionado"
        : "Selecciona un género para mostrar el maniquí",
  );
}

async function loadMannequinLayer(gender, layer) {
  const image = new Image();
  image.src =
    `/api/mannequin-image?gender=${encodeURIComponent(gender)}&layer=${layer}`;
  await image.decode();
  return image;
}

async function renderMannequinSkinTone(gender, rgb) {
  const generation = ++mannequinArtworkGeneration;
  try {
    const [artwork, mask] = await Promise.all([
      loadMannequinLayer(gender, "artwork"),
      loadMannequinLayer(gender, "skin-mask"),
    ]);
    if (artwork.naturalWidth !== mask.naturalWidth || artwork.naturalHeight !== mask.naturalHeight) {
      throw new Error("La máscara de acuarela no coincide con el tamaño del dibujo.");
    }
    const canvas = document.createElement("canvas");
    canvas.width = artwork.naturalWidth;
    canvas.height = artwork.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = canvas.width;
    maskCanvas.height = canvas.height;
    const maskContext = maskCanvas.getContext("2d", { willReadFrequently: true });
    if (!context || !maskContext) {
      throw new Error("No se pudo preparar la acuarela del maniquí.");
    }
    context.drawImage(artwork, 0, 0);
    maskContext.drawImage(mask, 0, 0);
    const artworkPixels = context.getImageData(0, 0, canvas.width, canvas.height);
    const maskPixels = maskContext.getImageData(0, 0, canvas.width, canvas.height);
    const [red, green, blue] = rgb;
    for (let offset = 0; offset < artworkPixels.data.length; offset += 4) {
      const watercolor = (maskPixels.data[offset] / 255) * 0.58;
      if (watercolor <= 0.01) continue;
      const graphite = artworkPixels.data[offset];
      const light = 0.58 + (graphite / 255) * 0.42;
      artworkPixels.data[offset] = graphite * (1 - watercolor) + red * light * watercolor;
      artworkPixels.data[offset + 1] =
        graphite * (1 - watercolor) + green * light * watercolor;
      artworkPixels.data[offset + 2] =
        graphite * (1 - watercolor) + blue * light * watercolor;
    }
    context.putImageData(artworkPixels, 0, 0);
    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob(
        (result) => (result ? resolve(result) : reject(new Error("No se pudo pintar el maniquí."))),
        "image/png",
      );
    });
    if (generation !== mannequinArtworkGeneration) return;
    const image = mannequinGenderImages.find((entry) => entry.dataset.gender === gender);
    const nextUrl = URL.createObjectURL(blob);
    image.src = nextUrl;
    if (renderedMannequinUrl) URL.revokeObjectURL(renderedMannequinUrl);
    renderedMannequinUrl = nextUrl;
    mannequinNote.textContent = tryOnMode === "gemini"
      ? "El maniquí se recorta localmente con rembg y se estiliza a lápiz; su acuarela usa el tono mediano de tus mejillas. Para evitar competir con Gemini, las prendas se muestran como guía de color. Tu foto solo se usa en la prueba virtual solicitada."
      : "El maniquí se recorta localmente con rembg y se estiliza a lápiz; su acuarela usa el tono mediano de tus mejillas. Las prendas también se recortan localmente. Tu fotografía no se envía para estos efectos.";
  } catch (error) {
    if (generation !== mannequinArtworkGeneration) return;
    mannequinNote.textContent = error instanceof Error
      ? `No se pudo aplicar el tono de piel al maniquí: ${error.message}`
      : "No se pudo aplicar el tono de piel al maniquí.";
    console.error("No se pudo colorear el maniquí.", error);
  }
}

function updateMannequinOutfit() {
  const generation = ++mannequinOutfitGeneration;
  mannequinNote.textContent = tryOnMode === "gemini"
    ? "El maniquí es una guía ilustrativa. La prueba virtual con edición generativa se crea con Gemini sobre tu foto; se omite el modelo de segmentación para no competir por recursos."
    : "El maniquí se procesa localmente con rembg y se pinta con acuarela según el tono detectado en tus mejillas. Las prendas se recortan y se integran al dibujo con mezcla de lápiz; la segmentación puede equivocarse en algunas poses.";
  const topItem = selectedOutfit.find((item) => item.category === "tops");
  const bottomItem = selectedOutfit.find((item) => item.category === "bottoms");
  const dressItem = selectedOutfit.find((item) => item.category === "one-pieces");
  mannequinTop.style.setProperty("--garment-color", topItem?.colorHex || "transparent");
  mannequinDress.style.setProperty("--garment-color", dressItem?.colorHex || "transparent");
  mannequinTop.classList.toggle("wearing-garment", Boolean(topItem));
  mannequinDress.classList.toggle("wearing-garment", Boolean(dressItem));
  mannequinBottomGarment.classList.toggle("wearing-garment", Boolean(bottomItem));
  const setGarmentImage = (imageElement, item) => {
    const statusElement = imageElement.parentElement;
    imageElement.hidden = true;
    imageElement.removeAttribute("src");
    imageElement.style.removeProperty("--garment-width-scale");
    statusElement.removeAttribute("data-garment-status");
    imageElement.classList.remove("garment-top-image", "garment-bottom-image", "garment-dress-image");
    if (!item) {
      return;
    }
    if (item === topItem) imageElement.classList.add("garment-top-image");
    if (item === bottomItem) imageElement.classList.add("garment-bottom-image");
    if (item === dressItem) imageElement.classList.add("garment-dress-image");
    const isAllowedFalabellaImage = (value) => {
      try {
        const url = new URL(value);
        return url.protocol === "https:" && url.hostname === "media.falabella.com";
      } catch {
        return false;
      }
    };
    const primaryImage = isAllowedFalabellaImage(item.image_url)
      ? item.image_url
      : "";
    const fallbackImage = isAllowedFalabellaImage(item.fallback_image_url)
      ? item.fallback_image_url
      : "";
    const urls = [...new Set([primaryImage, fallbackImage].filter(Boolean))];
    const cacheKey = JSON.stringify([item.category, item.garmentType, urls]);
    if (!urls.length) {
      statusElement.dataset.garmentStatus = "No disponible";
      mannequinNote.textContent =
        "No se pudo aislar la prenda porque Falabella no entregó una imagen válida.";
      return;
    }
    if (!tryOnConfigReady) {
      statusElement.dataset.garmentStatus = "Comprobando…";
      return;
    }
    if (tryOnMode === "gemini") return;
    statusElement.dataset.garmentStatus = "Recortando...";
    getGarmentCutout(cacheKey, item, urls)
      .then((cutoutUrl) => {
        if (
          generation !== mannequinOutfitGeneration
          || imageElement.isConnected === false
          || statusElement.dataset.garmentStatus !== "Recortando..."
        ) return;
        imageElement.onload = () => {
          const targetRatio = statusElement.clientWidth / statusElement.clientHeight;
          const garmentRatio = imageElement.naturalWidth / imageElement.naturalHeight;
          const widthScale = Math.min(1.7, Math.max(1, (targetRatio / garmentRatio) * 0.85));
          imageElement.style.setProperty("--garment-width-scale", widthScale.toFixed(2));
        };
        imageElement.src = cutoutUrl;
        imageElement.hidden = false;
        statusElement.removeAttribute("data-garment-status");
      })
      .catch((error) => {
        if (
          generation !== mannequinOutfitGeneration
          || statusElement.dataset.garmentStatus !== "Recortando..."
        ) return;
        statusElement.dataset.garmentStatus = "No disponible";
        mannequinNote.textContent =
          `No se pudo aislar la prenda: ${error.message} No se muestra la foto completa.`;
        console.error("No se pudo aislar la prenda seleccionada.", error);
      });
  };
  setGarmentImage(mannequinTopImage, topItem);
  setGarmentImage(mannequinBottomImage, bottomItem);
  setGarmentImage(mannequinDressImage, dressItem);
  mannequinBottomGarment.dataset.garment = bottomItem?.garmentType || "";
  mannequinBottom.style.removeProperty("--garment-color");
  mannequinHips.classList.remove("wearing-garment");
  mannequinHips.style.removeProperty("--garment-image");
  mannequinBottom.dataset.garment = bottomItem?.garmentType || "";
  const sizes = selectedOutfit.map((item) => String(item.size || "").toUpperCase());
  const sizeRank = (size) => {
    if (/^(XXS|2XS)$/.test(size)) return 0;
    if (/^(XS|S)$/.test(size)) return 1;
    if (/^(M|36|38|40)$/.test(size)) return 2;
    if (/^(L|42|44|46)$/.test(size)) return 3;
    if (/^(XL|1X|48|50)$/.test(size)) return 4;
    if (/^(XXL|2XL|3XL|52|54|56)$/.test(size)) return 5;
    return 2;
  };
  const fit = Math.max(0, ...sizes.map(sizeRank));
  mannequin.dataset.fit = fit <= 1 ? "narrow" : fit >= 4 ? "wide" : "regular";
  mannequinTopLabel.textContent = topItem ? `${topItem.garment} · ${topItem.color}` : "";
  mannequinBottomLabel.textContent = bottomItem
    ? `${bottomItem.garment} · ${bottomItem.color}`
    : "";
  mannequinDressLabel.textContent = dressItem
    ? `${dressItem.garment} · ${dressItem.color}`
    : "";
  mannequin.setAttribute(
    "aria-label",
    selectedOutfit.length
      ? `Maniquí ilustrado con ${selectedOutfit.map((item) => item.garment).join(" y ")}`
      : "Maniquí ilustrado sin prendas seleccionadas",
  );
}

function getClothingSegmenter() {
  if (!clothingSegmenterPromise) {
    clothingSegmenterPromise = import(
      "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.2"
    )
      .then(({ pipeline }) => pipeline(
        "image-segmentation",
        "Xenova/segformer_b0_clothes",
        { device: "wasm", dtype: "q8" },
      ))
      .catch((error) => {
        clothingSegmenterPromise = null;
        throw new Error(
          `No se pudo cargar el modelo de segmentación (${error.message}).`,
        );
      });
  }
  return clothingSegmenterPromise;
}

function garmentLabels(item) {
  if (item.category === "tops") return ["Upper-clothes"];
  if (item.category === "one-pieces") return ["Dress"];
  const type = String(item.garmentType || "").toLowerCase();
  if (type.includes("skirt")) return ["Skirt"];
  if (type.includes("all-")) return ["Pants", "Skirt"];
  return ["Pants"];
}

async function loadFalabellaImage(urls) {
  const failures = [];
  for (const url of urls) {
    let objectUrl = "";
    try {
      const response = await fetch(
        `/api/falabella-image?url=${encodeURIComponent(url)}`,
      );
      if (!response.ok) {
        failures.push(`HTTP ${response.status}`);
        continue;
      }
      const imageBlob = await response.blob();
      if (!["image/jpeg", "image/png", "image/webp"].includes(imageBlob.type)) {
        failures.push("formato de imagen no compatible");
        continue;
      }
      objectUrl = URL.createObjectURL(imageBlob);
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => reject(new Error("La imagen no se pudo abrir."));
        image.src = objectUrl;
      });
      return { image, objectUrl };
    } catch (error) {
      failures.push(error.message);
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
  throw new Error(
    `No se pudo cargar la imagen de Falabella (${failures.join("; ")}).`,
  );
}

async function createGarmentCutout(item, urls) {
  const { image, objectUrl } = await loadFalabellaImage(urls);
  try {
    const segmenter = await getClothingSegmenter();
    const segments = await segmenter(objectUrl);
    const masksByLabel = new Map(segments.map((segment) => [segment.label, segment.mask]));
    let selectedMasks = garmentLabels(item)
      .map((label) => masksByLabel.get(label))
      .filter(Boolean);
    if (item.category === "one-pieces" && !selectedMasks.length) {
      selectedMasks = [masksByLabel.get("Upper-clothes")].filter(Boolean);
    }
    if (!selectedMasks.length) {
      throw new Error("El modelo no detectó esa categoría de prenda en la imagen.");
    }

    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("No se pudo preparar el recorte de la prenda.");
    context.drawImage(image, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const luminance = new Uint8Array(canvas.width * canvas.height);
    for (let pixelIndex = 0; pixelIndex < luminance.length; pixelIndex += 1) {
      const offset = pixelIndex * 4;
      luminance[pixelIndex] = Math.round(
        imageData.data[offset] * 0.299
        + imageData.data[offset + 1] * 0.587
        + imageData.data[offset + 2] * 0.114,
      );
    }
    let minX = canvas.width;
    let minY = canvas.height;
    let maxX = -1;
    let maxY = -1;
    let visiblePixels = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        const pixelIndex = y * canvas.width + x;
        let alpha = 0;
        for (const mask of selectedMasks) {
          alpha = Math.max(alpha, mask.data[pixelIndex] || 0);
        }
        imageData.data[pixelIndex * 4 + 3] = alpha < 48 ? 0 : alpha;
        if (alpha < 48) continue;
        visiblePixels += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);

        if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) {
          continue;
        }
        const topLeft = luminance[pixelIndex - canvas.width - 1];
        const top = luminance[pixelIndex - canvas.width];
        const topRight = luminance[pixelIndex - canvas.width + 1];
        const left = luminance[pixelIndex - 1];
        const right = luminance[pixelIndex + 1];
        const bottomLeft = luminance[pixelIndex + canvas.width - 1];
        const bottom = luminance[pixelIndex + canvas.width];
        const bottomRight = luminance[pixelIndex + canvas.width + 1];
        const gradientX =
          -topLeft - 2 * left - bottomLeft + topRight + 2 * right + bottomRight;
        const gradientY =
          -topLeft - 2 * top - topRight + bottomLeft + 2 * bottom + bottomRight;
        const edge = Math.min(
          0.58,
          Math.max(0, (Math.hypot(gradientX, gradientY) - 44) / 520),
        );
        const sourceLuminance = luminance[pixelIndex];
        const paperBlend = 0.2 + (sourceLuminance / 255) * 0.1;
        const shading = 0.88 + (sourceLuminance / 255) * 0.12;
        for (let channel = 0; channel < 3; channel += 1) {
          const offset = pixelIndex * 4 + channel;
          const pencilColor =
            imageData.data[offset] * (1 - paperBlend) + 232 * paperBlend;
          imageData.data[offset] = Math.round(pencilColor * shading * (1 - edge));
        }
      }
    }
    const totalPixels = canvas.width * canvas.height;
    if (visiblePixels < totalPixels * 0.002 || visiblePixels > totalPixels * 0.8) {
      throw new Error("No se pudo identificar una silueta de ropa confiable.");
    }

    const padding = Math.round(Math.max(maxX - minX + 1, maxY - minY + 1) * 0.025);
    minX = Math.max(0, minX - padding);
    minY = Math.max(0, minY - padding);
    maxX = Math.min(canvas.width - 1, maxX + padding);
    maxY = Math.min(canvas.height - 1, maxY + padding);
    context.putImageData(imageData, 0, 0);
    const cutout = document.createElement("canvas");
    cutout.width = maxX - minX + 1;
    cutout.height = maxY - minY + 1;
    const cutoutContext = cutout.getContext("2d");
    if (!cutoutContext) throw new Error("No se pudo preparar la imagen recortada.");
    cutoutContext.drawImage(
      canvas,
      minX,
      minY,
      cutout.width,
      cutout.height,
      0,
      0,
      cutout.width,
      cutout.height,
    );
    const cutoutBlob = await new Promise((resolve, reject) => {
      cutout.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo guardar el recorte."))),
        "image/png",
      );
    });
    return URL.createObjectURL(cutoutBlob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function getGarmentCutout(cacheKey, item, urls) {
  if (!garmentCutoutCache.has(cacheKey)) {
    const cutout = createGarmentCutout(item, urls).catch((error) => {
      garmentCutoutCache.delete(cacheKey);
      throw error;
    });
    garmentCutoutCache.set(cacheKey, cutout);
  }
  return garmentCutoutCache.get(cacheKey);
}

function openOutfitDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("matices-outfit-builder", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("sets", { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(
      request.error || new Error("No se pudo abrir el almacenamiento de conjuntos."),
    );
    request.onblocked = () => reject(
      new Error("Cierra otras pestañas de Matices para administrar los conjuntos."),
    );
  });
}

async function saveSelectedOutfit() {
  if (!selectedOutfit.length) return;
  saveOutfitButton.disabled = true;
  const outfit = {
    id: crypto.randomUUID(),
    items: selectedOutfit.map((item) => ({ ...item })),
    createdAt: new Date().toISOString(),
  };
  let database;
  try {
    database = await openOutfitDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("sets", "readwrite");
      transaction.objectStore("sets").add(outfit);
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(
        transaction.error || new Error("El navegador no pudo guardar el conjunto."),
      );
    });
    savedOutfits.unshift(outfit);
    renderSavedOutfits();
    savedStatus.textContent = "Conjunto guardado en este navegador.";
  } catch (error) {
    savedStatus.textContent = error instanceof Error
      ? error.message
      : "No se pudo guardar el conjunto.";
  } finally {
    database?.close();
    saveOutfitButton.disabled = selectedOutfit.length === 0;
  }
}

async function loadSavedOutfits() {
  const database = await openOutfitDatabase();
  try {
    savedOutfits = await new Promise((resolve, reject) => {
      const transaction = database.transaction("sets", "readonly");
      const request = transaction.objectStore("sets").getAll();
      request.onsuccess = () => resolve(
        request.result.sort((left, right) =>
          right.createdAt.localeCompare(left.createdAt),
        ),
      );
      request.onerror = () => reject(
        request.error || new Error("No se pudieron leer los conjuntos guardados."),
      );
    });
    renderSavedOutfits();
    savedStatus.textContent = savedOutfits.length
      ? `${savedOutfits.length} conjuntos guardados en este navegador.`
      : "Guarda un conjunto para consultarlo después.";
  } finally {
    database.close();
  }
}

async function deleteSavedOutfit(id) {
  const database = await openOutfitDatabase();
  try {
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("sets", "readwrite");
      transaction.objectStore("sets").delete(id);
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(
        transaction.error || new Error("No se pudo eliminar el conjunto."),
      );
    });
    savedOutfits = savedOutfits.filter((outfit) => outfit.id !== id);
    selectedOutfitIds.delete(id);
    outfitComparison.hidden = true;
    renderSavedOutfits();
    savedStatus.textContent = "Conjunto eliminado.";
  } finally {
    database.close();
  }
}

function renderSavedOutfits() {
  savedOutfitsElement.replaceChildren();
  for (const outfit of savedOutfits) {
    const card = document.createElement("article");
    card.className = "saved-outfit-card";
    const details = document.createElement("div");
    details.className = "saved-outfit-details";
    const name = document.createElement("strong");
    name.textContent = `Conjunto · ${new Date(outfit.createdAt).toLocaleDateString("es-CL")}`;
    if (outfit.image) {
      const previewImage = document.createElement("img");
      previewImage.className = "saved-outfit-preview";
      previewImage.src = outfit.image;
      previewImage.alt = "Resultado de prueba virtual guardado";
      previewImage.loading = "lazy";
      details.append(previewImage);
    }
    const itemList = document.createElement("ul");
    itemList.className = "saved-outfit-items";
    for (const item of outfit.items) {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.name;
      const price = document.createElement("span");
      price.textContent = formatPrice(item.priceValue);
      row.append(link, price);
      itemList.append(row);
    }
    const total = document.createElement("strong");
    total.className = "saved-outfit-total";
    total.textContent = `Total: ${formatPrice(totalForOutfit(outfit.items))}`;
    const actions = document.createElement("div");
    actions.className = "saved-outfit-actions";
    const compareLabel = document.createElement("label");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = selectedOutfitIds.has(outfit.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked && selectedOutfitIds.size >= 2) {
        checkbox.checked = false;
        savedStatus.textContent = "Selecciona solo dos conjuntos para compararlos.";
        return;
      }
      if (checkbox.checked) selectedOutfitIds.add(outfit.id);
      else selectedOutfitIds.delete(outfit.id);
      compareOutfitsButton.disabled = selectedOutfitIds.size !== 2;
      outfitComparison.hidden = true;
    });
    compareLabel.append(checkbox, "Comparar");
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "Eliminar";
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      try {
        await deleteSavedOutfit(outfit.id);
      } catch (error) {
        remove.disabled = false;
        savedStatus.textContent = error instanceof Error
          ? error.message
          : "No se pudo eliminar el conjunto.";
      }
    });
    actions.append(compareLabel, remove);
    details.append(name, itemList, total, actions);
    card.append(details);
    savedOutfitsElement.append(card);
  }
  compareOutfitsButton.disabled = selectedOutfitIds.size !== 2;
}

function compareSavedOutfits() {
  if (selectedOutfitIds.size !== 2) return;
  const outfits = savedOutfits.filter((outfit) => selectedOutfitIds.has(outfit.id));
  if (outfits.length !== 2) {
    savedStatus.textContent = "No se encontraron ambos conjuntos guardados.";
    return;
  }
  outfitComparison.replaceChildren();
  for (const outfit of outfits) {
    const card = document.createElement("article");
    card.className = "comparison-card";
    const name = document.createElement("strong");
    name.textContent = `Conjunto · ${new Date(outfit.createdAt).toLocaleDateString("es-CL")}`;
    if (outfit.image) {
      const previewImage = document.createElement("img");
      previewImage.className = "saved-outfit-preview";
      previewImage.src = outfit.image;
      previewImage.alt = "Resultado de prueba virtual guardado";
      previewImage.loading = "lazy";
      card.append(previewImage);
    }
    const items = document.createElement("ul");
    items.className = "saved-outfit-items";
    for (const item of outfit.items) {
      const row = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = item.name;
      const price = document.createElement("span");
      price.textContent = formatPrice(item.priceValue);
      row.append(link, price);
      items.append(row);
    }
    const total = document.createElement("span");
    total.className = "saved-outfit-total";
    total.textContent = `Total: ${formatPrice(totalForOutfit(outfit.items))}`;
    card.append(name, items, total);
    outfitComparison.append(card);
  }
  outfitComparison.hidden = false;
}

async function searchFalabellaProducts() {
  const garment = garmentTypes[garmentTypeSelect.value];
  const gender = garmentGenderSelect.value;
  falabellaSearchController?.abort();
  falabellaSearchController = null;
  const generation = ++falabellaSearchGeneration;
  falabellaProductResults = [];
  falabellaProducts.replaceChildren();
  if ((!selectedColor && !allColorsSelected) || !garment || !gender || !selectedSize) {
    falabellaHint.textContent = !gender
      ? "Selecciona un género para elegir la talla y el tipo de prenda."
      : !selectedSize
        ? "Selecciona una talla verificada antes de explorar los productos."
        : "Selecciona un color y tipo de prenda para explorar productos.";
    return;
  }
  if (garment.gender !== gender) {
    falabellaHint.textContent = "Elige un tipo de prenda que corresponda al género seleccionado.";
    return;
  }

  const selectedColorName = selectedColor?.name || "todos-los-colores";
  const colorQuery = selectedColor ? ` ${selectedColor.name.toLowerCase()}` : "";
  const filterKey = `${activeGarmentTab}:${garmentTypeSelect.value}:${gender}:${selectedColorName}:${selectedSize}`;
  const controller = new AbortController();
  falabellaSearchController = controller;
  falabellaHint.textContent = "Actualizando prendas disponibles…";
  try {
    const searchTerms = garment.all
      ? [...new Set(
        Object.values(garmentTypes)
          .filter((type) =>
            type.gender === gender
            && type.tab === activeGarmentTab
            && !type.all,
          )
          .flatMap((type) => type.searchTerms),
      )]
      : [garment.searchTerms[0]];
    const resultLists = await Promise.all(searchTerms.map(async (term) => {
      const query = `${term} ${gender}${colorQuery}`;
      const response = await fetch("/api/falabella-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
        signal: controller.signal,
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "No se pudieron buscar prendas en Falabella.");
      }
      if (!Array.isArray(result.products)) {
        throw new Error("Falabella devolvió resultados con un formato inesperado.");
      }
      const matchingGarmentType = Object.entries(garmentTypes).find(
        ([, type]) =>
          type.gender === gender
          && type.tab === activeGarmentTab
          && !type.all
          && type.searchTerms.includes(term),
      )?.[0];
      const matchingGarment = garmentTypes[matchingGarmentType];
      return {
        garmentType: matchingGarmentType,
        matchTerms: matchingGarment
          ? [...matchingGarment.searchTerms, matchingGarment.label]
          : [term],
        products: result.products,
      };
    }));
    const currentFilterKey =
      `${activeGarmentTab}:${garmentTypeSelect.value}:${garmentGenderSelect.value}:${selectedColor?.name || "todos-los-colores"}:${selectedSize}`;
    if (generation !== falabellaSearchGeneration || filterKey !== currentFilterKey) return;
    const productsByUrl = new Map();
    for (
      let index = 0;
      index < Math.max(...resultLists.map(({ products }) => products.length));
      index += 1
    ) {
      for (const {
        garmentType: resultGarmentType,
        matchTerms,
        products,
      } of resultLists) {
        const product = products[index];
        if (
          product
          && productMatchesGender(product, gender)
          && (!garment.all || productMatchesGarmentTerm(product, matchTerms))
          && !productsByUrl.has(product.url)
        ) {
          productsByUrl.set(product.url, {
            ...product,
            ...(garment.all && resultGarmentType
              ? { garmentType: resultGarmentType }
              : {}),
          });
        }
      }
    }
    const requestedSize = selectedSize;
    falabellaProductResults = [...productsByUrl.values()];
    populateAvailableSizes(falabellaProductResults);
    const visibleProducts = filteredProductsForSelectedSize();
    renderFalabellaProducts(visibleProducts);
    falabellaHint.textContent = visibleProducts.length
      ? selectedSize !== ALL_SIZES_VALUE
        ? `${visibleProducts.length} productos disponibles en talla ${selectedSize}.`
        : `${visibleProducts.length} productos disponibles en todas las tallas para estos filtros.`
      : selectedColor && !falabellaProductResults.length
        ? "No existen productos con ese color"
      : requestedSize && requestedSize !== ALL_SIZES_VALUE
        ? `No hay productos disponibles en talla ${requestedSize} y color ${selectedColor?.name || "seleccionado"}.`
        : "No hay productos con tallas verificadas y stock para estos filtros.";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return;
    if (generation !== falabellaSearchGeneration) return;
    falabellaHint.textContent = error instanceof Error
      ? error.message
      : "No se pudieron buscar prendas en Falabella.";
  } finally {
    if (generation === falabellaSearchGeneration) {
      falabellaSearchController = null;
    }
  }
}

garmentTypeSelect.addEventListener("change", () => renderFalabellaFilters(true));
for (const button of garmentTabs) {
  button.addEventListener("click", () => setActiveGarmentTab(button.dataset.category));
}
garmentSizeSelect.addEventListener("change", () => {
  selectedSize = garmentSizeSelect.value;
  searchFalabellaProducts();
  scheduleColorAvailabilityCheck();
});
allColorsButton.addEventListener("click", toggleColorPalette);
garmentGenderSelect.addEventListener("change", () => {
  selectedSize = ALL_SIZES_VALUE;
  renderGarmentTypeOptions(true);
  renderFalabellaFilters(true);
  selectedOutfit = selectedOutfit.filter(
    (item) => garmentTypes[item.garmentType]?.gender === garmentGenderSelect.value,
  );
  renderSelectedOutfit();
  scheduleAutomaticTryOn();
  updateMannequinGender();
});
updateMannequinGender();

function renderGarmentColors() {
  garmentColors.replaceChildren();
  const colorsToShow = showAllColors ? palette : recommendedColors;
  allColorsButton.setAttribute("aria-pressed", String(showAllColors));
  allColorsButton.textContent = showAllColors
    ? "COLORES RECOMENDADOS"
    : "TODOS LOS COLORES";
  for (const item of colorsToShow) {
    const choice = document.createElement("button");
    choice.type = "button";
    choice.className = "color-choice";
    choice.style.backgroundColor = item.hex;
    const availability = getColorAvailability(item);
    choice.disabled = availability === false;
    choice.title = availability === false
      ? `${item.name}: no disponible con estos filtros`
      : availability === null
        ? `${item.name}: verificando disponibilidad`
        : item.name;
    choice.setAttribute(
      "aria-label",
      availability === false
        ? `Elegir ${item.name}, no disponible con estos filtros`
        : `Elegir ${item.name}`,
    );
    choice.setAttribute("aria-busy", String(availability === null));
    choice.setAttribute("aria-pressed", String(selectedColor?.name === item.name));
    choice.addEventListener("click", () => chooseGarmentColor(item));
    garmentColors.append(choice);
  }
}

function currentColorAvailabilityContext() {
  const garment = garmentTypes[garmentTypeSelect.value];
  const gender = garmentGenderSelect.value;
  if (!garment || !gender || !selectedSize || garment.gender !== gender) return null;
  const searchTerms = garment.all
    ? [...new Set(
      Object.values(garmentTypes)
        .filter((type) =>
          type.gender === gender
          && type.tab === activeGarmentTab
          && !type.all,
        )
        .flatMap((type) => type.searchTerms),
    )]
    : [garment.searchTerms[0]];
  if (!searchTerms.length) return null;
  return {
    garment,
    gender,
    garmentSize: selectedSize,
    searchTerms,
    key: JSON.stringify([
      activeGarmentTab,
      garmentTypeSelect.value,
      gender,
      selectedSize,
    ]),
  };
}

function getColorAvailability(item) {
  const context = currentColorAvailabilityContext();
  if (!context) return null;
  return colorAvailabilityCache.get(`${context.key}:${item.name}`) ?? null;
}

function scheduleColorAvailabilityCheck() {
  colorAvailabilityGeneration += 1;
  const generation = colorAvailabilityGeneration;
  clearTimeout(colorAvailabilityTimer);
  colorAvailabilityController?.abort();
  colorAvailabilityController = null;

  const context = currentColorAvailabilityContext();
  if (!context) {
    renderGarmentColors();
    return;
  }

  colorAvailabilityTimer = setTimeout(() => {
    checkVisibleColorAvailability(context, generation);
  }, 300);
}

async function colorHasAvailableProducts(item, context, signal) {
  for (const term of context.searchTerms) {
    const matchingGarmentType = Object.entries(garmentTypes).find(
      ([, type]) =>
        type.gender === context.gender
        && type.tab === activeGarmentTab
        && !type.all
        && type.searchTerms.includes(term),
    )?.[0];
    const matchingGarment = garmentTypes[matchingGarmentType];
    const response = await fetch("/api/falabella-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `${term} ${context.gender} ${item.name.toLowerCase()}`,
      }),
      signal,
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "No se pudo comprobar el color.");
    }
    if (!Array.isArray(result.products)) {
      throw new Error("Falabella devolvió resultados con un formato inesperado.");
    }
    const hasAvailableProduct = result.products.some((product) => {
      if (
        !productMatchesGender(product, context.gender)
        || (context.garment.all
          && matchingGarment
          && !productMatchesGarmentTerm(
            product,
            [...matchingGarment.searchTerms, matchingGarment.label],
          ))
      ) return false;
      const sizes = product.sizes || [];
      if (context.garmentSize === ALL_SIZES_VALUE) return sizes.length > 0;
      return sizes.some(
        (variant) => variant.size.toUpperCase().trim() === context.garmentSize,
      );
    });
    if (hasAvailableProduct) return true;
  }
  return false;
}

async function checkVisibleColorAvailability(context, generation) {
  const controller = new AbortController();
  colorAvailabilityController = controller;
  const colorsToCheck = (showAllColors ? palette : recommendedColors)
    .filter((item) => !colorAvailabilityCache.has(`${context.key}:${item.name}`));
  let nextColorIndex = 0;

  const worker = async () => {
    while (
      nextColorIndex < colorsToCheck.length
      && generation === colorAvailabilityGeneration
    ) {
      const item = colorsToCheck[nextColorIndex];
      nextColorIndex += 1;
      try {
        const available = await colorHasAvailableProducts(
          item,
          context,
          controller.signal,
        );
        if (generation !== colorAvailabilityGeneration) return;
        colorAvailabilityCache.set(`${context.key}:${item.name}`, available);
        renderGarmentColors();
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
        if (generation === colorAvailabilityGeneration) {
          console.warn(`No se pudo verificar la disponibilidad del color ${item.name}.`, error);
        }
      }
    }
  };

  await Promise.all(
    Array.from(
      { length: Math.min(3, colorsToCheck.length) },
      () => worker(),
    ),
  );
  if (generation === colorAvailabilityGeneration) {
    colorAvailabilityController = null;
    renderGarmentColors();
  }
}

async function personImageDataUrl() {
  const image = new Image();
  image.src = previewUrl;
  await image.decode();
  const scale = Math.min(1, 1024 / image.naturalWidth, 1536 / image.naturalHeight);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo preparar la fotografía.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.88);
}

function scheduleAutomaticTryOn() {
  tryOnGeneration += 1;
  const generation = tryOnGeneration;
  clearTimeout(tryOnDebounceTimer);
  createdImageData = "";
  createdOutfit.hidden = true;
  createdOutfitImage.removeAttribute("src");

  if (!selectedFile || !selectedOutfit.length) {
    setCreateOutfitStatus(
      "Agrega una foto y prendas para generar la prueba virtual automáticamente.",
    );
    return;
  }
  if (!tryOnAvailable) {
    setCreateOutfitStatus(
      "La prueba virtual automática no está disponible ahora. "
        + (tryOnUnavailableReason || "Inténtalo de nuevo más tarde."),
      true,
    );
    return;
  }

  if (tryOnBusy) {
    setCreateOutfitStatus(
      "Terminará la solicitud actual y luego generaré la vista con los cambios más recientes…",
    );
    return;
  }

  setCreateOutfitStatus(
    tryOnMode === "gemini"
      ? "Tu foto y las prendas se enviarán a Google AI Studio para editar la imagen. La generación puede tener un costo…"
      : "Generaré la vista localmente; tu foto no saldrá de este equipo…",
  );
  queueAutomaticTryOn(generation);
}

function queueAutomaticTryOn(generation) {
  clearTimeout(tryOnDebounceTimer);
  tryOnDebounceTimer = setTimeout(
    () => createOutfitOnPerson(generation),
    500,
  );
}

async function createOutfitOnPerson(generation) {
  if (
    generation !== tryOnGeneration
    || !selectedFile
    || !selectedOutfit.length
    || !tryOnAvailable
    || tryOnBusy
  ) return;

  tryOnBusy = true;
  createdOutfit.hidden = true;
  setCreateOutfitStatus(
    tryOnMode === "gemini"
      ? "Generando la prueba virtual con Gemini. Puede tardar unos minutos…"
      : "Generando la prueba virtual localmente…",
  );
  const outfitSnapshot = selectedOutfit.map((item) => ({ ...item }));
  try {
    const personImage = await personImageDataUrl();
    if (generation !== tryOnGeneration) return;
    const response = await fetch("/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_image: personImage,
        garments: outfitSnapshot.map((item) => ({
          image_url: item.image_url,
          fallback_image_url: item.fallback_image_url,
          category: item.category,
        })),
      }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "No se pudo crear la vista del conjunto.");
    }
    if (typeof result.image !== "string" || !result.image.startsWith("data:image/")) {
      throw new Error("El servicio no devolvió una imagen utilizable.");
    }
    if (generation !== tryOnGeneration) return;
    createdImageData = result.image;
    createdOutfitImage.src = createdImageData;
    createdOutfit.hidden = false;
    setCreateOutfitStatus(
      "Vista creada. El resultado es orientativo y puede alterar detalles de la ropa o la fotografía.",
    );
  } catch (error) {
    if (generation !== tryOnGeneration) return;
    setCreateOutfitStatus(
      error instanceof Error ? error.message : "No se pudo crear el conjunto.",
      true,
    );
  } finally {
    tryOnBusy = false;
    createOutfitStatus.setAttribute("aria-busy", "false");
    if (
      generation !== tryOnGeneration
      && selectedFile
      && selectedOutfit.length
      && tryOnAvailable
    ) {
      setCreateOutfitStatus(
        "Actualizando la vista con el conjunto más reciente…",
      );
      queueAutomaticTryOn(tryOnGeneration);
    }
  }
}

async function saveCreatedOutfit() {
  if (!createdImageData || !selectedOutfit.length) return;
  const outfit = {
    id: crypto.randomUUID(),
    items: selectedOutfit.map((item) => ({ ...item })),
    createdAt: new Date().toISOString(),
    image: createdImageData,
  };
  saveCreatedOutfitButton.disabled = true;
  let database;
  try {
    database = await openOutfitDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction("sets", "readwrite");
      transaction.objectStore("sets").add(outfit);
      transaction.oncomplete = resolve;
      transaction.onabort = () => reject(
        transaction.error || new Error("El navegador no pudo guardar el conjunto."),
      );
    });
    savedOutfits.unshift(outfit);
    renderSavedOutfits();
    savedStatus.textContent = "Vista y conjunto guardados en este navegador.";
  } catch (error) {
    savedStatus.textContent = error instanceof Error
      ? error.message
      : "No se pudo guardar la vista del conjunto.";
  } finally {
    database?.close();
    saveCreatedOutfitButton.disabled = false;
  }
}

async function loadTryOnConfig() {
  try {
    const response = await fetch("/api/config", { cache: "no-store" });
    const config = await response.json();
    if (!response.ok) {
      throw new Error(config.error || "No se pudo comprobar la prueba virtual.");
    }
    tryOnAvailable = config.tryon_available === true;
    tryOnMode = config.tryon_mode === "gemini" ? "gemini" : "local";
    tryOnUnavailableReason = config.tryon_unavailable_reason || "";
  } catch (error) {
    tryOnAvailable = false;
    tryOnUnavailableReason = error instanceof Error
      ? error.message
      : "No se pudo comprobar la prueba virtual.";
  } finally {
    tryOnConfigReady = true;
    updateMannequinOutfit();
  }
  scheduleAutomaticTryOn();
}

// ---------------------------------------------------------------------------
// Análisis principal de fotografía y configuración inicial
// ---------------------------------------------------------------------------
async function analyzePhoto() {
  if (!selectedFile) return;
  emptyState.hidden = true;
  resultContent.hidden = true;
  resultMessage.hidden = false;
  resultMessage.classList.remove("error");
  resultMessage.textContent = "Analizando la fotografía…";
  shoppingPanel.hidden = true;
  setBusy(true);
  setStatus("Cargando el modelo de IA local. La primera vez puede tardar un poco.");
  try {
    const image = new Image();
    image.src = previewUrl;
    await image.decode();
    const { canvas, context } = canvasFromImage(image);
    const faceLandmarker = await getFaceLandmarker();
    const result = faceLandmarker.detect(canvas);
    if (!result.faceLandmarks.length) {
      throw new Error("No se detectó un rostro. Prueba una foto frontal con la cara visible.");
    }

    const faces = result.faceLandmarks;
    const largestFace = faces.reduce((largest, current) => {
      const area = (points) => {
        const xs = points.map((point) => point.x);
        const ys = points.map((point) => point.y);
        return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      };
      return area(current) > area(largest) ? current : largest;
    });
    const samples = sampleCheeks(context, canvas.width, canvas.height, largestFace);
    const skin = analyzeSkin(samples);
    photoSkinRgb = skin.rgb.map(Math.round);
    updateMannequinGender();

    document.querySelector("#undertone").textContent = skin.undertone;
    document.querySelector("#depth").textContent = skin.depth;
    updateProfileScale(
      undertoneScale,
      skin.undertone,
      `Subtono estimado: ${skin.undertone}. ${explainUndertone(skin)}`,
    );
    updateProfileScale(
      depthScale,
      skin.depth,
      `Profundidad estimada: ${skin.depth}. ${explainDepth(skin)}`,
    );
    setExplanationTooltip(undertoneHelp, explainUndertone(skin));
    setExplanationTooltip(depthHelp, explainDepth(skin));
    renderRecommendations(skin);
    emptyState.hidden = true;
    resultMessage.hidden = true;
    resultContent.hidden = false;
    setStatus(
      `Rostros detectados: ${faces.length}. Se estimó el perfil usando ${samples.length} píxeles de las mejillas.`,
    );
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo analizar la fotografía.";
    setStatus(message, true);
    resultMessage.textContent = message;
    resultMessage.classList.add("error");
  } finally {
    setBusy(false);
  }
}

analyzeButton.addEventListener("click", analyzePhoto);
savedSetsButton.addEventListener("click", openSavedSets);
closeSavedSetsButton.addEventListener("click", closeSavedSets);
saveCreatedOutfitButton.addEventListener("click", saveCreatedOutfit);
saveOutfitButton.addEventListener("click", saveSelectedOutfit);
compareOutfitsButton.addEventListener("click", compareSavedOutfits);
cartCheckoutButton.addEventListener("click", openCartProducts);
installExplanationTooltips();
loadTryOnConfig();

loadSavedOutfits().catch((error) => {
  savedStatus.textContent = error instanceof Error
    ? error.message
    : "No se pudieron cargar los conjuntos guardados.";
});
