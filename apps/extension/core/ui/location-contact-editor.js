import { escapeHtml, sanitizeUrl } from '../security/index.js';

export const LOCATION_PRESETS = [
  {
    name: 'University of Rajshahi (Faculty of Veterinary & Animal Sciences)',
    city: 'Rajshahi',
    country: 'Bangladesh',
    lat: 24.3745,
    lng: 88.6042,
    rawAddress: 'Faculty of Veterinary and Animal Sciences, University of Rajshahi, Rajshahi-6205, Bangladesh'
  },
  {
    name: 'Harvard Medical School & Longwood Medical Area',
    city: 'Boston',
    country: 'United States',
    lat: 42.3364,
    lng: -71.1032,
    rawAddress: '25 Shattuck St, Boston, MA 02115, United States'
  },
  {
    name: 'University of Oxford (Biomedical Sciences)',
    city: 'Oxford',
    country: 'United Kingdom',
    lat: 51.7588,
    lng: -1.2555,
    rawAddress: 'Wellington Square, Oxford OX1 2JD, United Kingdom'
  },
  {
    name: 'ETH Zurich (Department of Biology)',
    city: 'Zurich',
    country: 'Switzerland',
    lat: 47.3763,
    lng: 8.5481,
    rawAddress: 'Rämistrasse 101, 8092 Zürich, Switzerland'
  },
  {
    name: 'The University of Tokyo (Veterinary Medical Sciences)',
    city: 'Tokyo',
    country: 'Japan',
    lat: 35.7126,
    lng: 139.7619,
    rawAddress: '7-3-1 Hongo, Bunkyo City, Tokyo 113-8654, Japan'
  }
];

export async function searchNominatimLocation(query, options = {}) {
  if (!query || typeof query !== 'string') return [];
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Free OpenStreetMap Nominatim geocoding endpoint
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(trimmed)}&limit=5`;

  try {
    const fetchFn = options.fetch || globalThis.fetch;
    if (!fetchFn) throw new Error('fetch is not available');

    const res = await fetchFn(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'ZunDeck/1.0 (mailto:zundeck@example.com)'
      },
      signal: options.signal
    });

    if (!res.ok) throw new Error(`Nominatim error: ${res.status}`);
    const data = await res.json();

    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      rawAddress: item.display_name,
      type: item.type || 'place'
    }));
  } catch (err) {
    if (options.fallbackMock) {
      return LOCATION_PRESETS.filter((p) =>
        p.name.toLowerCase().includes(trimmed.toLowerCase()) ||
        p.city.toLowerCase().includes(trimmed.toLowerCase()) ||
        p.country.toLowerCase().includes(trimmed.toLowerCase())
      );
    }
    return [];
  }
}

export function updateProfileLocation(profile, locData = {}) {
  if (!profile || !profile.identity) return profile;
  profile.identity.location = {
    city: locData.city || profile.identity.location?.city || '',
    country: locData.country || profile.identity.location?.country || '',
    lat: typeof locData.lat === 'number' ? locData.lat : (parseFloat(locData.lat) || 0),
    lng: typeof locData.lng === 'number' ? locData.lng : (parseFloat(locData.lng) || 0),
    rawAddress: locData.rawAddress || profile.identity.location?.rawAddress || ''
  };
  return profile;
}

export function updateProfileContactConfig(profile, contactData = {}) {
  if (!profile || !profile.displayConfig) return profile;
  profile.displayConfig.contactConfig = {
    ...(profile.displayConfig.contactConfig || {}),
    ...contactData
  };
  return profile;
}

export function renderLocationContactEditorHtml(profile) {
  const identity = profile?.identity || {};
  const loc = identity.location || {};
  const contactConfig = profile?.displayConfig?.contactConfig || {
    mode: 'mailto',
    showEmail: true,
    showLocation: true,
    showForm: false
  };

  const currentMode = contactConfig.mode || (contactConfig.showForm ? 'web3forms' : 'mailto');

  const presetsHtml = LOCATION_PRESETS.map((p) => `
    <button type="button" class="loc-preset-pill"
      data-preset-city="${escapeHtml(p.city)}"
      data-preset-country="${escapeHtml(p.country)}"
      data-preset-lat="${p.lat}"
      data-preset-lng="${p.lng}"
      data-preset-address="${escapeHtml(p.rawAddress)}">
      <i class="fa-solid fa-location-dot"></i>
      <span>${escapeHtml(p.city)}, ${escapeHtml(p.country)}</span>
    </button>
  `).join('\n');

  return `
    <div class="loc-contact-editor">
      <!-- Location Map Section -->
      <div class="editor-subcard">
        <div class="subcard-header">
          <i class="fa-solid fa-map-location-dot"></i>
          <div>
            <h4 class="subcard-title">Where to Find Me — Interactive Map</h4>
            <p class="subcard-sub">Campus, Laboratory, or City coordinates for the Leaflet / OpenStreetMap portfolio pin</p>
          </div>
        </div>

        <div class="loc-search-row">
          <div class="loc-search-input-wrap">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" id="loc-search-input" class="form-input" placeholder="Search University, Medical Center, or City...">
            <button type="button" class="btn-sm btn-outline" id="btn-search-loc">Search</button>
          </div>
          <div class="loc-presets-wrap">
            <span class="preset-label">Quick Presets:</span>
            ${presetsHtml}
          </div>
          <div class="loc-results-list" id="loc-results-container" style="display: none;"></div>
        </div>

        <div class="loc-fields-grid">
          <div class="form-group">
            <label class="form-label" for="loc-city">City</label>
            <input type="text" id="loc-city" class="form-input" value="${escapeHtml(loc.city || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="loc-country">Country</label>
            <input type="text" id="loc-country" class="form-input" value="${escapeHtml(loc.country || '')}">
          </div>
          <div class="form-group">
            <label class="form-label" for="loc-lat">Latitude</label>
            <input type="number" step="0.0001" id="loc-lat" class="form-input" value="${loc.lat || 0}">
          </div>
          <div class="form-group">
            <label class="form-label" for="loc-lng">Longitude</label>
            <input type="number" step="0.0001" id="loc-lng" class="form-input" value="${loc.lng || 0}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label" for="loc-address">Full Campus / Institution Address</label>
          <input type="text" id="loc-address" class="form-input" value="${escapeHtml(loc.rawAddress || '')}">
        </div>
      </div>

      <!-- Zero-Backend Gmail Contact Section -->
      <div class="editor-subcard">
        <div class="subcard-header">
          <i class="fa-solid fa-envelope-open-text"></i>
          <div>
            <h4 class="subcard-title">Smart Contact Me Engine (Zero-Backend)</h4>
            <p class="subcard-sub">Choose how collaborators and students get in touch with you</p>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="contact-email">Primary Gmail / Destination Inbox</label>
          <input type="email" id="contact-email" class="form-input" value="${escapeHtml(identity.email || '')}">
        </div>

        <div class="contact-modes-grid">
          <label class="mode-card ${currentMode === 'mailto' ? 'active' : ''}">
            <input type="radio" name="contact-mode" value="mailto" ${currentMode === 'mailto' ? 'checked' : ''}>
            <div class="mode-card-content">
              <div class="mode-card-icon"><i class="fa-solid fa-paper-plane"></i></div>
              <div class="mode-card-title">1. Direct mailto: Button</div>
              <div class="mode-card-desc">Zero setup. Opens visitor's default email client pre-filled with your address.</div>
            </div>
          </label>

          <label class="mode-card ${currentMode === 'web3forms' ? 'active' : ''}">
            <input type="radio" name="contact-mode" value="web3forms" ${currentMode === 'web3forms' ? 'checked' : ''}>
            <div class="mode-card-content">
              <div class="mode-card-icon"><i class="fa-solid fa-cloud-arrow-up"></i></div>
              <div class="mode-card-title">2. Free Email Form (Web3Forms)</div>
              <div class="mode-card-desc">Zero-backend HTML form. Messages land straight in your Gmail with spam protection.</div>
            </div>
          </label>

          <label class="mode-card ${currentMode === 'card' ? 'active' : ''}">
            <input type="radio" name="contact-mode" value="card" ${currentMode === 'card' ? 'checked' : ''}>
            <div class="mode-card-content">
              <div class="mode-card-icon"><i class="fa-solid fa-address-card"></i></div>
              <div class="mode-card-title">3. Full Contact Card</div>
              <div class="mode-card-desc">Displays Gmail + WhatsApp + LinkedIn + Office Address as a clean contact card.</div>
            </div>
          </label>
        </div>

        <div class="contact-mode-config" id="contact-mode-config">
          ${currentMode === 'web3forms' ? `
            <div class="form-group form-web3forms-key">
              <label class="form-label" for="web3forms-key">Web3Forms Access Key (Optional)</label>
              <input type="text" id="web3forms-key" class="form-input" placeholder="Get free key at web3forms.com or leave blank for default" value="${escapeHtml(contactConfig.accessKey || '')}">
              <span class="form-hint">Enter your free Web3Forms key so emails land in your inbox, or use FormSubmit.</span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `.trim();
}
