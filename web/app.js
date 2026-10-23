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
const MAX_ANALYSIS_IMAGE_SIZE = 1200;
const FALABELLA_CACHE_TTL = 2 * 60 * 1000;
const CHILE_REGIONS = [
  "Arica y Parinacota",
  "Tarapacá",
  "Antofagasta",
  "Atacama",
  "Coquimbo",
  "Valparaíso",
  "Región Metropolitana",
  "O'Higgins",
  "Maule",
  "Ñuble",
  "Biobío",
  "La Araucanía",
  "Los Ríos",
  "Los Lagos",
  "Aysén",
  "Magallanes",
];
const METROPOLITAN_COMMUNES = [
  "Alhué", "Buin", "Calera de Tango", "Cerrillos", "Cerro Navia",
  "Colina", "Conchalí", "Curacaví", "El Bosque", "El Monte",
  "Estación Central", "Huechuraba", "Independencia", "Isla de Maipo",
  "La Cisterna", "La Florida", "La Granja", "La Pintana", "La Reina",
  "Lampa", "Las Condes", "Lo Barnechea", "Lo Espejo", "Lo Prado",
  "Macul", "Maipú", "María Pinto", "Melipilla", "Ñuñoa", "Padre Hurtado",
  "Paine", "Pedro Aguirre Cerda", "Peñaflor", "Peñalolén", "Pirque",
  "Providencia", "Pudahuel", "Puente Alto", "Quilicura", "Quinta Normal",
  "Recoleta", "Renca", "San Bernardo", "San Joaquín", "San José de Maipo",
  "San Miguel", "San Pedro", "San Ramón", "Santiago", "Talagante", "Tiltil",
  "Vitacura",
];

const photoInput = document.querySelector("#photo-input");
const loginOverlay = document.querySelector("#login-overlay");
const loginForm = document.querySelector("#login-form");
const loginUsername = document.querySelector("#login-username");
const loginPassword = document.querySelector("#login-password");
const rememberPassword = document.querySelector("#remember-password");
const loginStatus = document.querySelector("#login-status");
const appContent = document.querySelector("#app-content");
const accountMenuButton = document.querySelector("#account-menu-button");
const accountMenu = document.querySelector("#account-menu");
const profileMenuButton = document.querySelector("#profile-menu-button");
const settingsMenuButton = document.querySelector("#settings-menu-button");
const logoutButton = document.querySelector("#logout-button");
const accountDialogBackdrop = document.querySelector("#account-dialog-backdrop");
const profileDialog = document.querySelector("#profile-dialog");
const settingsDialog = document.querySelector("#settings-dialog");
const paymentDialog = document.querySelector("#payment-dialog");
const closeProfileDialog = document.querySelector("#close-profile-dialog");
const closeSettingsDialog = document.querySelector("#close-settings-dialog");
const closePaymentDialog = document.querySelector("#close-payment-dialog");
const paymentMenuButton = document.querySelector("#payment-menu-button");
const avatarInput = document.querySelector("#avatar-input");
const accountAvatarImage = document.querySelector("#account-avatar-image");
const accountAvatarFallback = document.querySelector("#account-avatar-fallback");
const profileAvatarImage = document.querySelector("#profile-avatar-image");
const profileAvatarFallback = document.querySelector("#profile-avatar-fallback");
const profileForm = document.querySelector("#profile-form");
const profileSaveStatus = document.querySelector("#profile-save-status");
const welcomeOverlay = document.querySelector("#welcome-overlay");
const dropzone = document.querySelector("#dropzone");
const preview = document.querySelector("#preview");
const autoColorAnalysis = document.querySelector("#auto-color-analysis");
const analyzePhotoButton = document.querySelector("#analyze-photo-button");
const cameraButton = document.querySelector("#camera-button");
const cameraPanel = document.querySelector("#camera-panel");
const cameraPreview = document.querySelector("#camera-preview");
const captureButton = document.querySelector("#capture-button");
const closeCameraButton = document.querySelector("#close-camera-button");
const flowPrevious = document.querySelector("#flow-previous");
const flowNext = document.querySelector("#flow-next");
const flowSteps = [...document.querySelectorAll(".flow-step")];
const flowSlides = [...document.querySelectorAll(".flow-slide")];
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
const shoppingControls = document.querySelector(".shopping-controls");
const filtersToggle = document.querySelector("#filters-toggle");
const allColorsButton = document.querySelector("#all-colors-button");
const falabellaHint = document.querySelector("#falabella-hint");
const falabellaProducts = document.querySelector("#falabella-products");
const productsPagination = document.querySelector(".products-pagination");
const productsPrevious = document.querySelector("#products-previous");
const productsNext = document.querySelector("#products-next");
const productsPage = document.querySelector("#products-page");
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
const cartModalBackdrop = document.querySelector("#cart-modal-backdrop");
const shoppingCartSection = document.querySelector("#shopping-cart");
const closeCartButton = document.querySelector("#close-cart-button");
const savedPaymentMethodsList = document.querySelector("#saved-payment-methods-list");
const paymentDefaultSummary = document.querySelector("#payment-default-summary");
const addPaymentCardButton = document.querySelector("#add-payment-card-button");
const paymentCardFormPanel = document.querySelector("#payment-card-form-panel");
const savePaymentMethodToggle = document.querySelector("#save-payment-method-toggle");
const paymentCardNumber = document.querySelector("#payment-card-number");
const paymentCardHolder = document.querySelector("#payment-card-holder");
const paymentCardExpiry = document.querySelector("#payment-card-expiry");
const paymentCardCvv = document.querySelector("#payment-card-cvv");
const accountSavedPaymentMethodsList = document.querySelector("#account-saved-payment-methods-list");
const addPaymentMethodButton = document.querySelector("#add-payment-method-button");
const accountPaymentFormPanel = document.querySelector("#account-payment-form-panel");
const accountSavePaymentMethodButton = document.querySelector("#account-save-payment-method-button");
const accountPaymentCardNumber = document.querySelector("#account-payment-card-number");
const accountPaymentCardHolder = document.querySelector("#account-payment-card-holder");
const accountPaymentCardExpiry = document.querySelector("#account-payment-card-expiry");
const accountPaymentCardCvv = document.querySelector("#account-payment-card-cvv");
const accountPaymentStatus = document.querySelector("#account-payment-status");
const useSavedAddress = document.querySelector("#use-saved-address");
const deliveryFullName = document.querySelector("#delivery-full-name");
const deliveryAddress = document.querySelector("#delivery-address");
const deliveryCommune = document.querySelector("#delivery-commune");
const deliveryRegion = document.querySelector("#delivery-region");
const deliveryPostalCode = document.querySelector("#delivery-postal-code");
const checkoutEmail = document.querySelector("#checkout-email");
const checkoutContactPhone = document.querySelector("#checkout-contact-phone");
const profilePhone = document.querySelector("#profile-phone");
const profileRegion = document.querySelector("#profile-region");
const profileGender = document.querySelector("#profile-gender");
const profileCommune = document.querySelector("#profile-commune");
const profileCommuneField = document.querySelector("#profile-commune-field");

// ---------------------------------------------------------------------------
// Estado de la interfaz: fotografías, perfil de color y búsqueda de productos
// ---------------------------------------------------------------------------
let selectedFile = null;
let selectedPhotoSource = null;
let previewUrl = null;
let faceLandmarkerPromise = null;
let recommendedColors = [];
let selectedColor = null;
let allColorsSelected = false;
let showAllColors = false;
let falabellaProductResults = [];
let falabellaProductPage = 0;
let falabellaSearchController = null;
let falabellaSearchGeneration = 0;
const falabellaSearchCache = new Map();
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
let activeFlowSlide = "analysis";
let savedOutfits = [];
let photoSkinRgb = null;
let mannequinArtworkGeneration = 0;
let renderedMannequinUrl = "";
const mannequinLayerCache = new Map();
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
  "all-genders-upper": { label: "Prendas superiores", searchTerms: ["ropa superior"], gender: "todos", tab: "upper", category: "tops", all: true },
  "all-genders-lower": { label: "Prendas inferiores", searchTerms: ["ropa inferior"], gender: "todos", tab: "lower", category: "bottoms", all: true },
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

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";
const LOGIN_CREDENTIALS_KEY = "matices-login-credentials";
const PROFILE_AVATAR_KEY = "matices-admin-avatar";
const PROFILE_DATA_KEY = "matices-admin-profile";
const AUTO_COLOR_ANALYSIS_KEY = "matices-auto-color-analysis";
const SAVED_PAYMENT_METHODS_KEY = "matices-saved-payment-methods";
let isAuthenticated = false;
let welcomeDismissTimer = null;
let lastAutofilledDeliveryValues = null;
let savedPaymentMethods = [];

function scheduleWelcomeDismissal() {
  window.clearTimeout(welcomeDismissTimer);
  welcomeDismissTimer = window.setTimeout(closeWelcomeOverlay, 2000);
}

function setAvatarImage(dataUrl) {
  const hasImage = Boolean(dataUrl);
  [accountAvatarImage, profileAvatarImage].forEach((image) => {
    image.src = dataUrl || "";
    image.hidden = !hasImage;
  });
  accountAvatarFallback.hidden = hasImage;
  profileAvatarFallback.hidden = hasImage;
}

function closeAccountDialogs() {
  accountMenu.hidden = true;
  accountMenuButton.setAttribute("aria-expanded", "false");
  profileDialog.hidden = true;
  settingsDialog.hidden = true;
  paymentDialog.hidden = true;
  accountDialogBackdrop.hidden = true;
  document.body.classList.remove("account-dialog-open");
}

function openAccountDialog(dialog) {
  accountMenu.hidden = true;
  accountMenuButton.setAttribute("aria-expanded", "false");
  profileDialog.hidden = dialog !== profileDialog;
  settingsDialog.hidden = dialog !== settingsDialog;
  paymentDialog.hidden = dialog !== paymentDialog;
  accountDialogBackdrop.hidden = false;
  document.body.classList.add("account-dialog-open");
  if (dialog === paymentDialog) accountPaymentFormPanel.hidden = true;
  dialog.querySelector("button")?.focus();
}

function logout() {
  isAuthenticated = false;
  closeAccountDialogs();
  appContent.hidden = true;
  loginForm.reset();
  loadSavedLogin();
  loginStatus.textContent = "";
  loginOverlay.hidden = true;
  welcomeOverlay.classList.remove("is-closing");
  welcomeOverlay.hidden = false;
  document.body.classList.remove("account-dialog-open", "login-open");
  document.body.classList.add("welcome-open");
  welcomeOverlay.focus();
  scheduleWelcomeDismissal();
}

function loadSavedAvatar() {
  try {
    setAvatarImage(localStorage.getItem(PROFILE_AVATAR_KEY) || "");
  } catch {
    setAvatarImage("");
  }
}

function loadSavedProfile() {
  try {
    const savedProfile = JSON.parse(localStorage.getItem(PROFILE_DATA_KEY) || "{}");
    for (const [key, value] of Object.entries(savedProfile)) {
      const field = profileForm.elements.namedItem(key);
      if (field && typeof value === "string") field.value = value;
    }
  } catch {
    profileForm.reset();
  }
  limitPhoneDigits(profilePhone);
  updateProfileCommuneVisibility();
}

function populateLocationOptions() {
  const savedProfileRegion = profileRegion.value;
  const savedDeliveryRegion = deliveryRegion.value;
  const savedCommune = profileCommune.value;

  for (const select of [profileRegion, deliveryRegion]) {
    select.replaceChildren(new Option("Selecciona tu región", ""));
    for (const region of CHILE_REGIONS) {
      select.append(new Option(region, region));
    }
  }

  profileCommune.replaceChildren(new Option("Selecciona tu comuna", ""));
  for (const commune of METROPOLITAN_COMMUNES) {
    profileCommune.append(new Option(commune, commune));
  }

  deliveryCommune.replaceChildren(new Option("Selecciona tu comuna", ""));
  for (const commune of METROPOLITAN_COMMUNES) {
    deliveryCommune.append(new Option(commune, commune));
  }

  profileRegion.value = savedProfileRegion;
  deliveryRegion.value = savedDeliveryRegion;
  profileCommune.value = savedCommune;
  updateDeliveryCommuneVisibility();
}

function updateProfileCommuneVisibility() {
  const isMetropolitan = profileRegion.value === "Región Metropolitana";
  profileCommuneField.hidden = false;
  profileCommune.disabled = !isMetropolitan;
  if (!isMetropolitan) profileCommune.value = "";
}

function updateDeliveryCommuneVisibility() {
  const isMetropolitan = deliveryRegion.value === "Región Metropolitana";
  deliveryCommune.disabled = !isMetropolitan;
  if (!isMetropolitan) deliveryCommune.value = "";
}

function limitPhoneDigits(field) {
  field.value = field.value.replace(/\D/g, "").slice(0, 9);
}

function limitCardNumberDigits(field) {
  field.value = field.value.replace(/\D/g, "").slice(0, 16);
}

function limitCvvDigits(field) {
  field.value = field.value.replace(/\D/g, "").slice(0, 3);
}

function formatCardExpiry(field) {
  const digits = field.value.replace(/\D/g, "").slice(0, 4);
  field.value = digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
}

function readSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_DATA_KEY) || "{}");
  } catch {
    return {};
  }
}

function fillDeliveryAddressFromProfile() {
  const profile = readSavedProfile();
  const fullName = [profile.name, profile["first-surname"], profile["second-surname"]]
    .filter(Boolean)
    .join(" ");
  const address = [
    profile.street,
    profile["street-number"],
    profile["home-type"],
    profile["home-detail"],
  ].filter(Boolean).join(", ");
  const values = {
    fullName,
    address,
    commune: profile.region === "Región Metropolitana" ? profile.commune || "" : "",
    region: profile.region || "",
    postalCode: profile["postal-code"] || "",
  };
  deliveryFullName.value = values.fullName;
  deliveryAddress.value = values.address;
  deliveryRegion.value = values.region;
  updateDeliveryCommuneVisibility();
  deliveryCommune.value = values.commune;
  deliveryPostalCode.value = values.postalCode;
  lastAutofilledDeliveryValues = values;
  return Boolean(values.address);
}

function fillCheckoutContactFromProfile() {
  const profile = readSavedProfile();
  if (profile.email) checkoutEmail.value = profile.email;
  if (profile.phone) {
    checkoutContactPhone.value = profile.phone;
    limitPhoneDigits(checkoutContactPhone);
  }
}

function clearAutofilledDeliveryAddress() {
  if (!lastAutofilledDeliveryValues) return;
  if (deliveryFullName.value === lastAutofilledDeliveryValues.fullName) deliveryFullName.value = "";
  if (deliveryAddress.value === lastAutofilledDeliveryValues.address) deliveryAddress.value = "";
  if (deliveryCommune.value === lastAutofilledDeliveryValues.commune) deliveryCommune.value = "";
  if (deliveryRegion.value === lastAutofilledDeliveryValues.region) deliveryRegion.value = "";
  if (deliveryPostalCode.value === lastAutofilledDeliveryValues.postalCode) deliveryPostalCode.value = "";
  lastAutofilledDeliveryValues = null;
}

function loadSavedLogin() {
  try {
    const savedLogin = JSON.parse(localStorage.getItem(LOGIN_CREDENTIALS_KEY) || "{}");
    if (typeof savedLogin.username === "string") loginUsername.value = savedLogin.username;
    if (typeof savedLogin.password === "string") loginPassword.value = savedLogin.password;
    rememberPassword.checked = Boolean(savedLogin.username && savedLogin.password);
  } catch {
    rememberPassword.checked = false;
  }
}

function loadSavedPaymentMethods() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_PAYMENT_METHODS_KEY) || "[]");
    savedPaymentMethods = Array.isArray(saved) ? saved : [];
    if (savedPaymentMethods.length && !savedPaymentMethods.some((method) => method.isDefault)) {
      savedPaymentMethods[0].isDefault = true;
      localStorage.setItem(SAVED_PAYMENT_METHODS_KEY, JSON.stringify(savedPaymentMethods));
    }
  } catch {
    savedPaymentMethods = [];
  }
  renderSavedPaymentMethods();
  renderSavedPaymentMethods(accountSavedPaymentMethodsList, {
    number: accountPaymentCardNumber,
    holder: accountPaymentCardHolder,
    expiry: accountPaymentCardExpiry,
    cvv: accountPaymentCardCvv,
    status: accountPaymentStatus,
  });
  updatePaymentDefaultSummary();
}

function renderSavedPaymentMethods(target = savedPaymentMethodsList, fields = {
  number: paymentCardNumber,
  holder: paymentCardHolder,
  expiry: paymentCardExpiry,
  cvv: paymentCardCvv,
  status: null,
}) {
  target.replaceChildren();
  if (!savedPaymentMethods.length) {
    const empty = document.createElement("span");
    empty.className = "saved-payment-empty";
    empty.textContent = "Aún no tienes medios de pago guardados.";
    target.append(empty);
    if (target === savedPaymentMethodsList) {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "secondary-button save-payment-method-button";
      addButton.textContent = "Añadir medio de pago";
      addButton.addEventListener("click", () => addPaymentCardButton.click());
      target.append(addButton);
    }
    return;
  }
  for (const method of savedPaymentMethods) {
    const row = document.createElement("article");
    row.className = "saved-payment-method";
    const info = document.createElement("div");
    info.className = "saved-payment-method-info";
    const title = document.createElement("strong");
    title.textContent = `${method.brand} terminada en ${method.last4}`;
    const details = document.createElement("span");
    details.textContent = `${method.holder} · Vence ${method.expiry}${method.isDefault ? " · Predeterminada" : ""}`;
    info.append(title, details);
    const actions = document.createElement("div");
    actions.className = "saved-payment-method-actions";
    const useButton = document.createElement("button");
    useButton.type = "button";
    useButton.textContent = method.isDefault ? "Predeterminada" : "Usar";
    useButton.setAttribute("aria-pressed", String(Boolean(method.isDefault)));
    useButton.addEventListener("click", () => {
      setDefaultPaymentMethod(method.id);
      fillPaymentFields(fields, method);
      if (target === savedPaymentMethodsList) paymentCardFormPanel.hidden = true;
    });
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "Quitar";
    removeButton.addEventListener("click", () => {
      savedPaymentMethods = savedPaymentMethods.filter((entry) => entry.id !== method.id);
      if (savedPaymentMethods.length && !savedPaymentMethods.some((entry) => entry.isDefault)) {
        savedPaymentMethods[0].isDefault = true;
      }
      localStorage.setItem(SAVED_PAYMENT_METHODS_KEY, JSON.stringify(savedPaymentMethods));
      renderSavedPaymentMethods();
      renderSavedPaymentMethods(accountSavedPaymentMethodsList, {
        number: accountPaymentCardNumber,
        holder: accountPaymentCardHolder,
        expiry: accountPaymentCardExpiry,
        cvv: accountPaymentCardCvv,
        status: accountPaymentStatus,
      });
    });
    actions.append(useButton, removeButton);
    row.append(info, actions);
    target.append(row);
  }
}

function fillPaymentFields(fields, method) {
  fields.number.value = `•••• •••• •••• ${method.last4}`;
  fields.holder.value = method.holder;
  fields.expiry.value = method.expiry;
  fields.cvv.value = "";
}

function updatePaymentDefaultSummary() {
  const defaultMethod = savedPaymentMethods.find((method) => method.isDefault);
  paymentDefaultSummary.textContent = defaultMethod
    ? `Medio predeterminado: ${defaultMethod.brand} terminada en ${defaultMethod.last4}`
    : "Selecciona un medio guardado o añade una tarjeta nueva.";
  if (defaultMethod) {
    fillPaymentFields({
      number: paymentCardNumber,
      holder: paymentCardHolder,
      expiry: paymentCardExpiry,
      cvv: paymentCardCvv,
    }, defaultMethod);
    paymentCardFormPanel.hidden = true;
  } else {
    paymentCardNumber.value = "";
    paymentCardHolder.value = "";
    paymentCardExpiry.value = "";
    paymentCardCvv.value = "";
  }
}

function setDefaultPaymentMethod(id) {
  savedPaymentMethods = savedPaymentMethods.map((method) => ({
    ...method,
    isDefault: method.id === id,
  }));
  localStorage.setItem(SAVED_PAYMENT_METHODS_KEY, JSON.stringify(savedPaymentMethods));
  renderSavedPaymentMethods();
  renderSavedPaymentMethods(accountSavedPaymentMethodsList, {
    number: accountPaymentCardNumber,
    holder: accountPaymentCardHolder,
    expiry: accountPaymentCardExpiry,
    cvv: accountPaymentCardCvv,
    status: accountPaymentStatus,
  });
  updatePaymentDefaultSummary();
}

async function savePaymentMethod() {
  const cardNumber = paymentCardNumber.value.replace(/\D/g, "");
  const holder = paymentCardHolder.value.trim();
  const expiry = paymentCardExpiry.value.trim();
  return savePaymentMethodData(cardNumber, holder, expiry, paymentCardCvv, (message, isError) => setStatus(message, isError));
}

async function savePaymentMethodData(cardNumber, holder, expiry, cvvField, showStatus) {
  const cvv = cvvField.value.replace(/\D/g, "");
  if (cardNumber.length !== 16 || !holder || !/^((0[1-9])|(1[0-2]))\/\d{2}$/.test(expiry) || cvv.length !== 3) {
    showStatus("Completa una tarjeta de 16 dígitos, vencimiento MM/AA y CVV de 3 dígitos.", true);
    return false;
  }
  const fingerprintBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(cardNumber),
  );
  const fingerprint = [...new Uint8Array(fingerprintBuffer)]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
  if (savedPaymentMethods.some((method) =>
    method.fingerprint === fingerprint
    || (!method.fingerprint && method.last4 === cardNumber.slice(-4)))) {
    showStatus("Esta tarjeta ya está guardada en esta cuenta.", true);
    return false;
  }
  const brand = cardNumber.startsWith("4")
    ? "Visa"
    : cardNumber.startsWith("5")
      ? "Mastercard"
      : "Tarjeta";
  savedPaymentMethods.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    fingerprint,
    brand,
    last4: cardNumber.slice(-4),
    holder,
    expiry,
    isDefault: savedPaymentMethods.length === 0,
  });
  localStorage.setItem(SAVED_PAYMENT_METHODS_KEY, JSON.stringify(savedPaymentMethods));
  renderSavedPaymentMethods();
  renderSavedPaymentMethods(accountSavedPaymentMethodsList, {
    number: accountPaymentCardNumber,
    holder: accountPaymentCardHolder,
    expiry: accountPaymentCardExpiry,
    cvv: accountPaymentCardCvv,
    status: accountPaymentStatus,
  });
  updatePaymentDefaultSummary();
  cvvField.value = "";
  showStatus("Medio de pago guardado de forma segura en este navegador.");
  return true;
}

async function saveAccountPaymentMethod() {
  const cardNumber = accountPaymentCardNumber.value.replace(/\D/g, "");
  const holder = accountPaymentCardHolder.value.trim();
  const expiry = accountPaymentCardExpiry.value.trim();
  const saved = await savePaymentMethodData(cardNumber, holder, expiry, accountPaymentCardCvv, (message, isError) => {
    accountPaymentStatus.textContent = message;
    accountPaymentStatus.classList.toggle("error", Boolean(isError));
  });
  if (saved) {
    accountPaymentCardNumber.value = "";
    accountPaymentCardHolder.value = "";
    accountPaymentCardExpiry.value = "";
    accountPaymentCardCvv.value = "";
    accountPaymentFormPanel.hidden = true;
    addPaymentMethodButton.focus();
  }
}

function updateColorAnalysisMode() {
  analyzePhotoButton.hidden = autoColorAnalysis.checked || !selectedFile;
}

async function useProfilePhotoForAnalysis(dataUrl = "") {
  const profilePhoto = dataUrl || localStorage.getItem(PROFILE_AVATAR_KEY) || "";
  if (!profilePhoto) {
    updateColorAnalysisMode();
    setStatus("Añade una foto de perfil para detectar tus colores automáticamente.", true);
    return false;
  }

  try {
    const response = await fetch(profilePhoto);
    const blob = await response.blob();
    const file = new File([blob], "foto-perfil.jpg", {
      type: blob.type || "image/jpeg",
    });
    acceptFile(file, "profile");
    return true;
  } catch {
    setStatus("No se pudo usar la foto de perfil. Inténtalo de nuevo.", true);
    return false;
  }
}

function clearSelectedPhoto() {
  stopCamera();
  selectedFile = null;
  selectedPhotoSource = null;
  photoSkinRgb = null;
  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }
  preview.src = "";
  preview.hidden = true;
  dropzone.classList.remove("has-preview");
  emptyState.hidden = false;
  resultMessage.hidden = true;
  resultContent.hidden = true;
  shoppingPanel.hidden = true;
  selectedOutfit = [];
  shoppingCart = [];
  renderSelectedOutfit();
  updateColorAnalysisMode();
}

function loadColorAnalysisSetting() {
  autoColorAnalysis.checked = localStorage.getItem(AUTO_COLOR_ANALYSIS_KEY) !== "false";
  updateColorAnalysisMode();
}

function syncProfileGenderToFilters() {
  if (!autoColorAnalysis.checked) return;
  const genderMap = { Masculino: "hombre", Femenino: "mujer" };
  const filterGender = genderMap[profileGender.value] || "";
  if (garmentGenderSelect.value === filterGender) return;
  garmentGenderSelect.value = filterGender;
  garmentGenderSelect.dispatchEvent(new Event("change"));
}

function closeLoginOverlay() {
  loginOverlay.hidden = true;
  document.body.classList.remove("login-open");
  appContent.hidden = false;
  if (autoColorAnalysis.checked) useProfilePhotoForAnalysis();
}

function handleLogin(event) {
  event.preventDefault();
  const username = loginUsername.value.trim().toLowerCase();
  const password = loginPassword.value;
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    loginStatus.textContent = "Usuario o contraseña incorrectos.";
    loginPassword.select();
    return;
  }
  if (rememberPassword.checked) {
    localStorage.setItem(
      LOGIN_CREDENTIALS_KEY,
      JSON.stringify({ username, password }),
    );
  } else {
    localStorage.removeItem(LOGIN_CREDENTIALS_KEY);
  }
  isAuthenticated = true;
  loginStatus.textContent = "";
  closeLoginOverlay();
}

function closeWelcomeOverlay() {
  if (welcomeOverlay.hidden || welcomeOverlay.classList.contains("is-closing")) return;
  window.clearTimeout(welcomeDismissTimer);
  welcomeOverlay.classList.add("is-closing");
  document.body.classList.remove("welcome-open");
  window.setTimeout(() => {
    welcomeOverlay.hidden = true;
    if (!isAuthenticated) {
      loginOverlay.hidden = false;
      document.body.classList.add("login-open");
      loginUsername.focus();
    }
  }, 450);
}

welcomeOverlay.addEventListener("click", closeWelcomeOverlay);
welcomeOverlay.addEventListener("keydown", (event) => {
  if (event.key === "Enter") closeWelcomeOverlay();
});
loginForm.addEventListener("submit", handleLogin);
accountMenuButton.addEventListener("click", () => {
  const isOpen = !accountMenu.hidden;
  accountMenu.hidden = isOpen;
  accountMenuButton.setAttribute("aria-expanded", String(!isOpen));
});
profileMenuButton.addEventListener("click", () => openAccountDialog(profileDialog));
paymentMenuButton.addEventListener("click", () => openAccountDialog(paymentDialog));
settingsMenuButton.addEventListener("click", () => openAccountDialog(settingsDialog));
logoutButton.addEventListener("click", logout);
closeProfileDialog.addEventListener("click", closeAccountDialogs);
closeSettingsDialog.addEventListener("click", closeAccountDialogs);
closePaymentDialog.addEventListener("click", closeAccountDialogs);
accountDialogBackdrop.addEventListener("click", closeAccountDialogs);
avatarInput.addEventListener("change", () => {
  const [file] = avatarInput.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") return;
    setAvatarImage(reader.result);
    localStorage.setItem(PROFILE_AVATAR_KEY, reader.result);
    if (autoColorAnalysis.checked) useProfilePhotoForAnalysis(reader.result);
  });
  reader.readAsDataURL(file);
});
profileForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const profile = Object.fromEntries(new FormData(profileForm).entries());
  localStorage.setItem(PROFILE_DATA_KEY, JSON.stringify(profile));
  profileSaveStatus.textContent = "Datos guardados correctamente.";
  if (useSavedAddress.checked) fillDeliveryAddressFromProfile();
  fillCheckoutContactFromProfile();
  syncProfileGenderToFilters();
});
profileRegion.addEventListener("change", updateProfileCommuneVisibility);
deliveryRegion.addEventListener("change", updateDeliveryCommuneVisibility);
profileGender.addEventListener("change", syncProfileGenderToFilters);
profilePhone.addEventListener("input", () => limitPhoneDigits(profilePhone));
checkoutContactPhone.addEventListener("input", () => limitPhoneDigits(checkoutContactPhone));
paymentCardNumber.addEventListener("input", () => limitCardNumberDigits(paymentCardNumber));
accountPaymentCardNumber.addEventListener("input", () => limitCardNumberDigits(accountPaymentCardNumber));
paymentCardCvv.addEventListener("input", () => limitCvvDigits(paymentCardCvv));
accountPaymentCardCvv.addEventListener("input", () => limitCvvDigits(accountPaymentCardCvv));
paymentCardExpiry.addEventListener("input", () => formatCardExpiry(paymentCardExpiry));
accountPaymentCardExpiry.addEventListener("input", () => formatCardExpiry(accountPaymentCardExpiry));
useSavedAddress.addEventListener("change", () => {
  if (useSavedAddress.checked) {
    if (!fillDeliveryAddressFromProfile()) {
      useSavedAddress.checked = false;
      setStatus("Guarda primero una dirección en Ver perfil.", true);
    }
  } else {
    clearAutofilledDeliveryAddress();
  }
});
autoColorAnalysis.addEventListener("change", async () => {
  localStorage.setItem(AUTO_COLOR_ANALYSIS_KEY, String(autoColorAnalysis.checked));
  if (autoColorAnalysis.checked) {
    await useProfilePhotoForAnalysis();
    syncProfileGenderToFilters();
  } else if (selectedPhotoSource === "profile") {
    clearSelectedPhoto();
    setStatus("Foto de perfil quitada de la detección de colores.");
  } else {
    updateColorAnalysisMode();
  }
});
analyzePhotoButton.addEventListener("click", () => {
  if (!selectedFile) return;
  setStatus("Analizando tu foto…");
  analyzePhoto();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeAccountDialogs();
});
loadSavedAvatar();
populateLocationOptions();
loadSavedProfile();
loadSavedLogin();
loadColorAnalysisSetting();
syncProfileGenderToFilters();
appContent.hidden = true;
loginOverlay.hidden = true;
document.body.classList.add("welcome-open");
welcomeOverlay.focus();
scheduleWelcomeDismissal();

function updateFlowNavigation() {
  const shoppingReady = !shoppingPanel.hidden;
  const paymentReady = shoppingCart.length > 0;
  const activeIndex = flowSlides.findIndex((slide) => slide.dataset.flowSlide === activeFlowSlide);
  flowPrevious.disabled = activeIndex <= 0;
  const nextTarget = flowSlides[activeIndex + 1]?.dataset.flowSlide;
  flowNext.disabled = activeIndex < 0
    || activeIndex >= flowSlides.length - 1
    || (nextTarget === "shopping" && !shoppingReady)
    || (nextTarget === "payment" && !paymentReady);
  flowSteps.forEach((step) => {
    const isActive = step.dataset.flowTarget === activeFlowSlide;
    const stepTarget = step.dataset.flowTarget;
    const isComplete = (stepTarget === "analysis" && activeFlowSlide !== "analysis")
      || (stepTarget === "shopping" && activeFlowSlide === "payment");
    step.classList.toggle("is-active", isActive);
    step.classList.toggle("is-complete", isComplete);
    step.setAttribute("aria-current", isActive ? "step" : "false");
    step.disabled = stepTarget === "shopping"
      ? !shoppingReady
      : stepTarget === "payment"
        ? !paymentReady
        : false;
  });
}

function showFlowSlide(target, shouldFocus = false) {
  if (target === "shopping" && shoppingPanel.hidden) return;
  if (target === "payment" && !shoppingCart.length) return;
  const nextSlide = flowSlides.find((slide) => slide.dataset.flowSlide === target);
  if (!nextSlide) return;
  activeFlowSlide = target;
  if (target === "payment") {
    useSavedAddress.checked = true;
    fillDeliveryAddressFromProfile();
    fillCheckoutContactFromProfile();
  }
  flowSlides.forEach((slide) => {
    const isActive = slide === nextSlide;
    slide.classList.toggle("is-active", isActive);
    slide.setAttribute("aria-hidden", String(!isActive));
  });
  shoppingCartSection.hidden = target !== "payment";
  cartModalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
  updateFlowNavigation();
  if (shouldFocus) {
    nextSlide.querySelector("h2")?.focus?.();
    nextSlide.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function moveFlowSlide(offset) {
  const currentIndex = flowSlides.findIndex((slide) => slide.dataset.flowSlide === activeFlowSlide);
  const nextSlide = flowSlides[currentIndex + offset];
  if (nextSlide) showFlowSlide(nextSlide.dataset.flowSlide, true);
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

function acceptFile(file, source = "upload") {
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
  selectedPhotoSource = source;
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
  showFlowSlide("analysis");
  selectedOutfit = [];
  shoppingCart = [];
  renderSelectedOutfit();
  scheduleAutomaticTryOn();
  if (autoColorAnalysis.checked) {
    setStatus("Analizando tu foto automáticamente…");
    analyzePhoto();
  } else {
    setStatus("Foto lista. Presiona el botón para detectar tus colores.");
    updateColorAnalysisMode();
  }
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
  const scale = Math.min(1, MAX_ANALYSIS_IMAGE_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
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
  selectedColor = null;
  allColorsSelected = true;
  showAllColors = false;
  falabellaProductResults = [];
  renderGarmentTypeOptions();
  resetSizeOptions();
  shoppingPanel.hidden = false;
  updateFlowNavigation();
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
  const genders = !gender || gender === "todos" ? ["hombre", "mujer"] : [gender];
  garmentTypeSelect.replaceChildren();
  garmentTypeSelect.disabled = false;
  const types = Object.entries(garmentTypes)
    .filter(([, garment]) =>
      garment.tab === activeGarmentTab
      && genders.includes(garment.gender)
      && !garment.all,
    )
    .map(([value]) => value);
  const allType = Object.keys(garmentTypes).find((value) => {
    const garment = garmentTypes[value];
    return garment.tab === activeGarmentTab
      && (!gender || gender === "todos"
        ? garment.gender === "todos"
        : garment.gender === gender)
      && garment.all;
  });
  if (allType) {
    const option = document.createElement("option");
    option.value = allType;
    option.textContent = "Todos";
    garmentTypeSelect.append(option);
  }
  for (const [value, garment] of Object.entries(garmentTypes)) {
    if (garment.tab !== activeGarmentTab || !genders.includes(garment.gender) || garment.all) continue;
    const option = document.createElement("option");
    option.value = value;
    option.textContent = garment.label;
    garmentTypeSelect.append(option);
  }
  garmentTypeSelect.value =
    !selectAll && types.includes(previousType) ? previousType : allType || types[0] || "";
  garmentSizeLabel.textContent = "TALLA";
  garmentSizeSelect.setAttribute(
    "aria-label",
    activeGarmentTab === "upper" ? "Talla superior disponible" : "Talla inferior disponible",
  );
}

function resetSizeOptions(preserveSelection = false) {
  const previousSelection = preserveSelection ? selectedSize : ALL_SIZES_VALUE;
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
  garmentSizeSelect.disabled = false;
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
  garmentSizeSelect.disabled = false;
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
  if (gender === "todos") return true;
  const hasMasculineMarker = masculineMarkers.some((marker) => words.has(marker));
  const hasFeminineMarker = feminineMarkers.some((marker) => words.has(marker));
  if (hasMasculineMarker && hasFeminineMarker) return false;
  if (!gender || gender === "todos") return true;
  if (!hasMasculineMarker && !hasFeminineMarker) {
    return true;
  }
  return gender === "hombre"
    ? hasMasculineMarker || unisexMarkers.some((marker) => words.has(marker))
    : gender === "mujer"
      && (hasFeminineMarker || unisexMarkers.some((marker) => words.has(marker)));
}

function productIsExcluded(product) {
  const words = new Set(normalizeProductWords(
    `${product.name || ""} ${product.gender_metadata || ""} ${product.category || ""}`,
  ));
  const excludedMarkers = [
    "perfume", "perfumes", "bebe", "bebes", "baby", "infantil", "nino", "nina",
    "ninos", "ninas", "kids", "children", "child",
    "belleza", "beauty", "maquillaje", "maquillajes", "cosmetico", "cosmeticos",
    "cosmetica", "skincare", "facial", "corporal", "shampoo", "acondicionador",
    "labial", "rimel", "mascara", "base", "rubor", "serum", "crema",
  ];
  return excludedMarkers.some((marker) => words.has(marker));
}

function normalizeProductWords(text) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
}

function productMatchesColor(product, color) {
  if (!color) return true;
  const normalizeWords = (text) => text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .match(/[a-z0-9]+/g) || [];
  const productWords = new Set(normalizeWords(
    `${product.name} ${product.gender_metadata || ""}`,
  ));
  const colorWords = normalizeWords(color.name).filter((word) => word.length > 3);
  return colorWords.length === 0 || colorWords.some((word) => productWords.has(word));
}

function productMatchesSize(product, size) {
  if (!size || size === ALL_SIZES_VALUE) return true;
  return (product.sizes || []).some(
    (variant) => variant.size.toUpperCase().trim() === size,
  );
}

function productMatchesSelectedFilters(
  product,
  matchTerms,
  gender,
  selectedSizeValue,
  color,
  allGenders,
  allGarments,
) {
  if (productIsExcluded(product)) return false;
  const checks = [];
  if (!allGenders) checks.push(productMatchesGender(product, gender));
  if (selectedSizeValue && selectedSizeValue !== ALL_SIZES_VALUE) {
    checks.push(productMatchesSize(product, selectedSizeValue));
  }
  if (!allGarments) checks.push(productMatchesGarmentTerm(product, matchTerms));
  if (color) checks.push(productMatchesColor(product, color));
  if (checks.length === 0) return true;
  return checks.every(Boolean);
}

function filteredProductsForSelectedSize() {
  return falabellaProductResults.filter((product) => {
    const availableSizes = product.sizes || [];
    if (!availableSizes.length) return false;
    if (!selectedSize) return true;
    if (selectedSize === ALL_SIZES_VALUE) return true;
    return availableSizes.some(
      (variant) => variant.size.toUpperCase().trim() === selectedSize,
    );
  });
}

function renderFalabellaProducts(products = filteredProductsForSelectedSize()) {
  const productsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(products.length / productsPerPage));
  falabellaProductPage = Math.min(falabellaProductPage, totalPages - 1);
  const pageStart = falabellaProductPage * productsPerPage;
  const productsToRender = products.slice(pageStart, pageStart + productsPerPage);
  const hasPagination = products.length > productsPerPage;
  productsPagination.hidden = !hasPagination;
  productsPage.textContent = `${falabellaProductPage + 1} / ${totalPages}`;
  productsPrevious.disabled = !hasPagination || falabellaProductPage === 0;
  productsNext.disabled = !hasPagination || falabellaProductPage >= totalPages - 1;
  falabellaProducts.replaceChildren();
  for (const product of productsToRender) {
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
    const sizeOptions = activeGarmentTab === "upper"
      ? standardUpperSizes.map((size) => ({ size, label: size }))
      : standardLowerSizes;

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
    const cartButton = document.createElement("button");
    cartButton.className = "falabella-add-button falabella-cart-button";
    cartButton.type = "button";
    const updateAddButton = () => {
      const alreadyInCart = shoppingCart.some(
        (item) => item.url === (selectedVariant?.url || product.url),
      );
      cartButton.textContent = alreadyInCart ? "En el carrito" : "Agregar al Carrito";
      cartButton.disabled = !selectedVariant || alreadyInCart;
    };
    updateAddButton();
    cartButton.addEventListener("click", () => {
      // Esta acción agrega el mismo producto al conjunto y al carrito.
      addProductToOutfit(product, garmentType, selectedVariant);
      updateAddButton();
    });
    const actions = document.createElement("div");
    actions.className = "falabella-product-actions";
    actions.append(source, cartButton);
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

  if (!selectedOutfit.some((selected) => selected.url === item.url)) {
    selectedOutfit = [...selectedOutfit, item];
  }
  addCartItem(item);
  renderSelectedOutfit();
  renderFalabellaProducts();
  scheduleAutomaticTryOn();
}

function addCartItem(item) {
  if (shoppingCart.some((selected) => selected.url === item.url)) return;
  shoppingCart = [...shoppingCart, { ...item }];
  renderShoppingCart();
}

function addProductToCart(product, garmentType, selectedVariant) {
  const garment = garmentTypes[garmentType];
  if (!garment || (!selectedColor && !allColorsSelected) || !selectedVariant) return;
  const priceValueText = String(selectedVariant.price || product.price || "");
  const rawPrice = priceValueText.replace(/[^\d.,-]/g, "");
  const priceDigits = /[.,]\d{2}$/.test(rawPrice)
    ? rawPrice.slice(0, -3).replace(/\D/g, "")
    : rawPrice.replace(/\D/g, "");
  const parsedPrice = priceDigits ? Number(priceDigits) : null;
  addCartItem({
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
  });
  renderFalabellaProducts();
}

function renderFalabellaFilters(preserveSizeSelection = false) {
  falabellaProductResults = [];
  falabellaProductPage = 0;
  resetSizeOptions(preserveSizeSelection);
  const garment = garmentTypes[garmentTypeSelect.value];
  const gender = garmentGenderSelect.value;
  falabellaProducts.replaceChildren();
  falabellaHint.textContent = garment && gender
    ? "Mostrando prendas de hombre y mujer. Puedes ajustar los filtros si quieres."
    : "Mostrando todos los productos disponibles.";
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
  cartCheckoutButton.disabled = true;

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
  if (!shoppingCart.length && activeFlowSlide === "payment") {
    showFlowSlide("shopping");
    return;
  }
  updateFlowNavigation();
}

function openCartModal() {
  if (!shoppingCart.length) return;
  shoppingCartSection.hidden = false;
  cartModalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  if (useSavedAddress.checked) fillDeliveryAddressFromProfile();
  fillCheckoutContactFromProfile();
  closeCartButton.focus();
}

function closeCartModal() {
  if (activeFlowSlide === "payment") {
    showFlowSlide("shopping", true);
    return;
  }
  shoppingCartSection.hidden = true;
  cartModalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
}

function updateMannequinGender() {
  const gender = garmentGenderSelect.value;
  const mannequinGender = ["mujer", "hombre"].includes(gender) ? gender : "";
  mannequin.dataset.gender = mannequinGender;
  mannequinArtworkGeneration += 1;
  mannequinGenderImages.forEach((image) => {
    image.hidden = !mannequinGender || image.dataset.gender !== mannequinGender;
  });
  if (mannequinGender && photoSkinRgb) {
    renderMannequinSkinTone(mannequinGender, photoSkinRgb);
  } else if (mannequinGender) {
    const image = mannequinGenderImages.find((entry) => entry.dataset.gender === mannequinGender);
    if (image) image.src = `/api/mannequin-image?gender=${encodeURIComponent(mannequinGender)}`;
    if (renderedMannequinUrl) URL.revokeObjectURL(renderedMannequinUrl);
    renderedMannequinUrl = "";
  } else if (renderedMannequinUrl) {
    URL.revokeObjectURL(renderedMannequinUrl);
    renderedMannequinUrl = "";
  }
  mannequin.setAttribute(
    "aria-label",
    mannequinGender === "mujer"
      ? "Maniquí femenino con el conjunto seleccionado"
      : mannequinGender === "hombre"
        ? "Maniquí masculino con el conjunto seleccionado"
        : "Selecciona un género para mostrar el maniquí",
  );
}

async function loadMannequinLayer(gender, layer) {
  const cacheKey = `${gender}:${layer}`;
  if (mannequinLayerCache.has(cacheKey)) {
    return mannequinLayerCache.get(cacheKey);
  }
  const image = new Image();
  image.src =
    `/api/mannequin-image?gender=${encodeURIComponent(gender)}&layer=${layer}`;
  const imagePromise = image.decode()
    .then(() => image)
    .catch((error) => {
      mannequinLayerCache.delete(cacheKey);
      throw error;
    });
  mannequinLayerCache.set(cacheKey, imagePromise);
  return imagePromise;
}

const mannequinSkinCache = new Map();

async function createTintedMannequinBlob(artwork, mask, rgb) {
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
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo pintar el maniquí."))),
      "image/png",
    );
  });
}

async function renderMannequinSkinTone(gender, rgb) {
  const generation = ++mannequinArtworkGeneration;
  try {
    const [artwork, mask] = await Promise.all([
      loadMannequinLayer(gender, "artwork"),
      loadMannequinLayer(gender, "skin-mask"),
    ]);
    const cacheKey = `${gender}:${rgb.map((value) => Math.round(value)).join(",")}`;
    let blob = mannequinSkinCache.get(cacheKey);
    if (!blob) {
      blob = await createTintedMannequinBlob(artwork, mask, rgb);
      mannequinSkinCache.set(cacheKey, blob);
    }
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
  const selectedGender = garmentGenderSelect.value;
  const hasSpecificGender = ["mujer", "hombre"].includes(selectedGender);
  if (!hasSpecificGender) {
    [mannequinTopImage, mannequinBottomImage, mannequinDressImage].forEach((imageElement) => {
      imageElement.hidden = true;
      imageElement.removeAttribute("src");
      imageElement.style.removeProperty("--garment-width-scale");
      imageElement.classList.remove("garment-top-image", "garment-bottom-image", "garment-dress-image");
      imageElement.parentElement.removeAttribute("data-garment-status");
    });
    mannequinTop.classList.remove("wearing-garment");
    mannequinDress.classList.remove("wearing-garment");
    mannequinBottomGarment.classList.remove("wearing-garment");
    mannequinTopLabel.textContent = "";
    mannequinBottomLabel.textContent = "";
    mannequinDressLabel.textContent = "";
    mannequin.setAttribute("aria-label", "Selecciona un género para mostrar las prendas del conjunto");
    mannequinNote.textContent = "Selecciona un género en los filtros para mostrar las imágenes del conjunto.";
    return;
  }
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

async function fetchFalabellaProducts(query, signal) {
  const cached = falabellaSearchCache.get(query);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.products;
  }
  if (cached) falabellaSearchCache.delete(query);

  const response = await fetch("/api/falabella-search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
    signal,
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error || "No se pudieron buscar prendas en Falabella.");
  }
  if (!Array.isArray(result.products)) {
    throw new Error("Falabella devolvió resultados con un formato inesperado.");
  }
  falabellaSearchCache.set(query, {
    products: result.products,
    expiresAt: Date.now() + FALABELLA_CACHE_TTL,
  });
  return result.products;
}

async function searchFalabellaProducts() {
  const garment = garmentTypes[garmentTypeSelect.value];
  const gender = garmentGenderSelect.value;
  const allGenders = !gender || gender === "todos";
  const allGarments = !garment || garment.all;
  falabellaSearchController?.abort();
  falabellaSearchController = null;
  const generation = ++falabellaSearchGeneration;
  falabellaProductResults = [];
  falabellaProductPage = 0;
  falabellaProducts.replaceChildren();
  productsPagination.hidden = true;
  if (!allGenders && garment && garment.gender !== gender) {
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
    const searchTerms = allGarments
      ? [...new Set(
        Object.values(garmentTypes)
          .filter((type) =>
            (allGenders || type.gender === gender)
            && type.tab === activeGarmentTab
            && !type.all,
          )
          .flatMap((type) => type.searchTerms),
      )]
      : [garment.searchTerms[0]];
    const resultLists = await Promise.all(searchTerms.map(async (term) => {
      const query = `${term}${allGenders ? "" : ` ${gender}`}${colorQuery}`;
      const products = await fetchFalabellaProducts(query, controller.signal);
      const matchingGarmentType = Object.entries(garmentTypes).find(
        ([, type]) =>
          (allGenders || type.gender === gender)
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
        products,
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
          && productMatchesSelectedFilters(
            product,
            matchTerms,
            gender,
            selectedSize,
            selectedColor,
            allGenders,
            allGarments,
          )
          && !productsByUrl.has(product.url)
        ) {
          productsByUrl.set(product.url, {
            ...product,
            ...(garment?.all && resultGarmentType
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

function changeFalabellaProductPage(offset) {
  const products = filteredProductsForSelectedSize();
  const productsPerPage = 6;
  const totalPages = Math.ceil(products.length / productsPerPage);
  if (totalPages <= 1) return;
  falabellaProductPage = Math.max(0, Math.min(falabellaProductPage + offset, totalPages - 1));
  renderFalabellaProducts(products);
  falabellaProducts.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

garmentTypeSelect.addEventListener("change", () => renderFalabellaFilters(true));
for (const button of garmentTabs) {
  button.addEventListener("click", () => setActiveGarmentTab(button.dataset.category));
}
filtersToggle.addEventListener("click", () => {
  const expanded = filtersToggle.getAttribute("aria-expanded") !== "false";
  shoppingControls.classList.toggle("is-collapsed", expanded);
  filtersToggle.setAttribute("aria-expanded", String(!expanded));
});
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
  if (["hombre", "mujer"].includes(garmentGenderSelect.value)) {
    selectedOutfit = selectedOutfit.filter(
      (item) => garmentTypes[item.garmentType]?.gender === garmentGenderSelect.value,
    );
  }
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
    const products = await fetchFalabellaProducts(
      `${term} ${context.gender} ${item.name.toLowerCase()}`,
      signal,
    );
    const hasAvailableProduct = products.some((product) => {
      if (
        productIsExcluded(product)
        ||
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
  showFlowSlide("analysis");
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
    status.textContent = "";
    status.classList.remove("error");
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : "No se pudo analizar la fotografía.";
    setStatus(message, true);
    resultMessage.textContent = message;
    resultMessage.classList.add("error");
  }
}

flowPrevious.addEventListener("click", () => moveFlowSlide(-1));
flowNext.addEventListener("click", () => moveFlowSlide(1));
productsPrevious.addEventListener("click", () => changeFalabellaProductPage(-1));
productsNext.addEventListener("click", () => changeFalabellaProductPage(1));
flowSteps.forEach((step) => {
  step.addEventListener("click", () => showFlowSlide(step.dataset.flowTarget, true));
});
savedSetsButton.addEventListener("click", openSavedSets);
closeSavedSetsButton.addEventListener("click", closeSavedSets);
saveCreatedOutfitButton.addEventListener("click", saveCreatedOutfit);
saveOutfitButton.addEventListener("click", saveSelectedOutfit);
compareOutfitsButton.addEventListener("click", compareSavedOutfits);
savePaymentMethodToggle.addEventListener("change", async () => {
  if (savePaymentMethodToggle.checked) {
    const saved = await savePaymentMethod();
    if (!saved) {
      savePaymentMethodToggle.checked = false;
    } else {
      paymentCardFormPanel.hidden = true;
    }
  }
});
addPaymentCardButton.addEventListener("click", () => {
  paymentCardNumber.value = "";
  paymentCardHolder.value = "";
  paymentCardExpiry.value = "";
  paymentCardCvv.value = "";
  savePaymentMethodToggle.checked = false;
  paymentCardFormPanel.hidden = false;
  paymentCardNumber.focus();
});
addPaymentMethodButton.addEventListener("click", () => {
  accountPaymentCardNumber.value = "";
  accountPaymentCardHolder.value = "";
  accountPaymentCardExpiry.value = "";
  accountPaymentCardCvv.value = "";
  accountPaymentFormPanel.hidden = false;
  accountPaymentStatus.textContent = "";
  accountPaymentCardNumber.focus();
});
accountSavePaymentMethodButton.addEventListener("click", saveAccountPaymentMethod);
closeCartButton.addEventListener("click", closeCartModal);
cartModalBackdrop.addEventListener("click", closeCartModal);
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !shoppingCartSection.hidden) closeCartModal();
});
updateFlowNavigation();
installExplanationTooltips();
loadTryOnConfig();
loadSavedPaymentMethods();
syncProfileGenderToFilters();

loadSavedOutfits().catch((error) => {
  savedStatus.textContent = error instanceof Error
    ? error.message
    : "No se pudieron cargar los conjuntos guardados.";
});
