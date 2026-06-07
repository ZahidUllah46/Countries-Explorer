
// ── DOM References 
const searchInput  = document.getElementById('searchInput');
const clearBtn     = document.getElementById('clearBtn');
const spinnerWrap  = document.getElementById('spinnerWrap');
const errorWrap    = document.getElementById('errorWrap');
const errorMsg     = document.getElementById('errorMsg');
const retryBtn     = document.getElementById('retryBtn');
const countriesGrid= document.getElementById('countriesGrid');
const resultCount  = document.getElementById('resultCount');
const noResults    = document.getElementById('noResults');
const searchedTerm = document.getElementById('searchedTerm');

const API_URL = 'https://restcountries.com/v3.1/all?fields=name,flags,population,region,capital,cca2';

const COUNTRY_LIMIT = 10;


let allCountries = []; // stores the 10 fetched countries

function formatPopulation(num) {
  if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';

  if (num >= 1_000_000)     return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000)         return (num / 1_000).toFixed(1) + 'K';
  return num.toLocaleString();
}

function showSpinner() {
  spinnerWrap.removeAttribute('hidden');
  errorWrap.setAttribute('hidden', '');
  countriesGrid.setAttribute('hidden', '');
  noResults.setAttribute('hidden', '');
  resultCount.textContent = '';
}

function hideSpinner() {
  spinnerWrap.setAttribute('hidden', '');
}

function showError(message) {
  hideSpinner();
  errorMsg.textContent = message;
  errorWrap.removeAttribute('hidden');
  countriesGrid.setAttribute('hidden', '');
  noResults.setAttribute('hidden', '');
  resultCount.textContent = '';
}

function showGrid() {
  errorWrap.setAttribute('hidden', '');
  noResults.setAttribute('hidden', '');
  countriesGrid.removeAttribute('hidden');
}

function showNoResults(term) {
  errorWrap.setAttribute('hidden', '');
  countriesGrid.setAttribute('hidden', '');
  noResults.removeAttribute('hidden');
  searchedTerm.textContent = `"${term}"`;
  resultCount.textContent = '';
}

function buildCard(country) {
  // Get values safely with fallbacks
  const name       = country.name?.common || 'Unknown';
  const flagUrl    = country.flags?.svg || country.flags?.png || '';
  const flagAlt    = country.flags?.alt || `Flag of ${name}`;
  const population = country.population ?? 0;
  const region     = country.region || '—';
  const capital    = (country.capital && country.capital[0]) ? country.capital[0] : 'N/A';
  const code       = country.cca2 || '';

  const card = document.createElement('article');
  card.className = 'country-card';
  card.setAttribute('aria-label', `Country card: ${name}`);

  card.innerHTML = `
    <div class="card-flag-wrap">
      <img
        class="card-flag"
        src="${flagUrl}"
        alt="${flagAlt}"
        loading="lazy"
        onerror="this.src='https://via.placeholder.com/320x200?text=No+Flag'"
      />
      <span class="card-region">${region}</span>
    </div>
    <div class="card-body">
      <h2 class="card-name">${name}</h2>
      <div class="card-info">
        <div class="card-row">
          <span class="card-label">Population</span>
          <span class="card-value pop-value">${formatPopulation(population)}</span>
        </div>
        <div class="card-row">
          <span class="card-label">Code</span>
          <span class="card-value">${code}</span>
        </div>
      </div>
      ${capital !== 'N/A' ? `<span class="card-capital">🏛 ${capital}</span>` : ''}
    </div>
  `;

  return card;
}

function renderCountries(list) {
  // Clear previous cards
  countriesGrid.innerHTML = '';

  if (list.length === 0) {
    return; // caller decides what to show
  }

  // Build and append each card
  const fragment = document.createDocumentFragment();
  list.forEach(country => {
    fragment.appendChild(buildCard(country));
  });
  countriesGrid.appendChild(fragment);

  showGrid();

  // Update result count text
  resultCount.textContent = `Showing ${list.length} ${list.length === 1 ? 'country' : 'countries'}`;
}

function filterCountries(query) {
  const trimmed = query.trim().toLowerCase();

  // If search is empty, show all loaded countries
  if (!trimmed) {
    renderCountries(allCountries);
    return;
  }

  // Filter by country common name
  const filtered = allCountries.filter(c =>
    c.name?.common?.toLowerCase().includes(trimmed)
  );

  if (filtered.length === 0) {
    showNoResults(query.trim());
  } else {
    renderCountries(filtered);
  }
}

async function fetchCountries() {
  showSpinner();

  try {
    // Fetch all countries from the API
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No country data received from API.');
    }

    allCountries = data
      .sort((a, b) => (a.name?.common || '').localeCompare(b.name?.common || ''))
      .slice(0, COUNTRY_LIMIT);

    hideSpinner();
    renderCountries(allCountries);

  } catch (error) {
    console.error('Fetch error:', error);

    if (!navigator.onLine) {
      showError('You are offline. Please check your internet connection and try again.');
    } else if (error.name === 'TypeError') {
      showError('Unable to connect to the Countries API. The service may be temporarily unavailable.');
    } else {
      showError(error.message || 'Something went wrong while loading country data. Please try again.');
    }
  }
}


searchInput.addEventListener('input', function () {
  const query = this.value;

  if (query.length > 0) {
    clearBtn.classList.add('visible');
  } else {
    clearBtn.classList.remove('visible');
  }

  filterCountries(query);
});

clearBtn.addEventListener('click', function () {
  searchInput.value = '';
  clearBtn.classList.remove('visible');
  searchInput.focus();
  filterCountries('');
});

retryBtn.addEventListener('click', function () {
  searchInput.value = '';
  clearBtn.classList.remove('visible');
  fetchCountries();
});

document.addEventListener('DOMContentLoaded', fetchCountries);
