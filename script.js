document.getElementById('loader').style.display = 'none'; // Initially hide the loader

let allRepos = [];

function setupFilterListeners() {
    const languageSelect = document.getElementById('filter-language');
    const minStarsInput = document.getElementById('filter-stars-min');
    const queryInput = document.getElementById('filter-query');
    const includeForksCheckbox = document.getElementById('filter-include-forks');
    const hasHomepageCheckbox = document.getElementById('filter-has-homepage');
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');

    if (!languageSelect) return; // filters not present

    const trigger = () => applyFiltersAndSort();

    languageSelect.addEventListener('change', trigger);
    minStarsInput.addEventListener('input', trigger);
    queryInput.addEventListener('input', trigger);
    includeForksCheckbox.addEventListener('change', trigger);
    hasHomepageCheckbox.addEventListener('change', trigger);
    sortBySelect.addEventListener('change', trigger);
    sortOrderSelect.addEventListener('change', trigger);
}

function resetFilterInputs() {
    const minStarsInput = document.getElementById('filter-stars-min');
    const queryInput = document.getElementById('filter-query');
    const includeForksCheckbox = document.getElementById('filter-include-forks');
    const hasHomepageCheckbox = document.getElementById('filter-has-homepage');
    const sortBySelect = document.getElementById('sort-by');
    const sortOrderSelect = document.getElementById('sort-order');
    const filtersPanel = document.getElementById('filters');

    if (filtersPanel) filtersPanel.classList.add('hidden');

    if (minStarsInput) minStarsInput.value = '';
    if (queryInput) queryInput.value = '';
    if (includeForksCheckbox) includeForksCheckbox.checked = true;
    if (hasHomepageCheckbox) hasHomepageCheckbox.checked = false;
    if (sortBySelect) sortBySelect.value = 'stars';
    if (sortOrderSelect) sortOrderSelect.value = 'desc';
}

function populateLanguageFilter(repos) {
    const languageSelect = document.getElementById('filter-language');
    if (!languageSelect) return;

    // Collect unique languages
    const languagesSet = new Set();
    repos.forEach(repo => {
        const lang = repo.language || 'Not specified';
        if (lang) languagesSet.add(lang);
    });

    // Reset options (keep the first 'All' option)
    languageSelect.innerHTML = '';
    const allOption = document.createElement('option');
    allOption.value = '';
    allOption.textContent = 'All';
    languageSelect.appendChild(allOption);

    Array.from(languagesSet)
        .sort((a, b) => a.localeCompare(b))
        .forEach(lang => {
            const opt = document.createElement('option');
            opt.value = lang;
            opt.textContent = lang;
            languageSelect.appendChild(opt);
        });

    languageSelect.value = '';
}

function showFiltersPanel() {
    const filtersPanel = document.getElementById('filters');
    if (filtersPanel) filtersPanel.classList.remove('hidden');
}

function getActiveFilters() {
    const language = (document.getElementById('filter-language')?.value || '').trim();
    const minStarsRaw = (document.getElementById('filter-stars-min')?.value || '').trim();
    const minStars = Number.isNaN(parseInt(minStarsRaw, 10)) ? 0 : parseInt(minStarsRaw, 10);
    const query = (document.getElementById('filter-query')?.value || '').toLowerCase();
    const includeForks = !!document.getElementById('filter-include-forks')?.checked;
    const hasHomepage = !!document.getElementById('filter-has-homepage')?.checked;
    const sortBy = (document.getElementById('sort-by')?.value || 'stars');
    const sortOrder = (document.getElementById('sort-order')?.value || 'desc');

    return { language, minStars, query, includeForks, hasHomepage, sortBy, sortOrder };
}

function applyFiltersAndSort() {
    if (!Array.isArray(allRepos) || allRepos.length === 0) {
        displayRepos([]);
        return;
    }

    const { language, minStars, query, includeForks, hasHomepage, sortBy, sortOrder } = getActiveFilters();

    let repos = allRepos.filter(repo => {
        const repoLanguage = repo.language || 'Not specified';
        const starsOk = (repo.stargazers_count || 0) >= minStars;
        const languageOk = language ? repoLanguage === language : true;
        const text = `${repo.name || ''} ${(repo.description || '')}`.toLowerCase();
        const queryOk = query ? text.includes(query) : true;
        const forksOk = includeForks ? true : !repo.fork;
        const homepage = (repo.homepage || '').trim();
        const homepageOk = hasHomepage ? Boolean(homepage) : true;
        return starsOk && languageOk && queryOk && forksOk && homepageOk;
    });

    const multiplier = sortOrder === 'asc' ? 1 : -1;
    repos.sort((a, b) => {
        if (sortBy === 'name') {
            return a.name.localeCompare(b.name) * multiplier;
        }
        if (sortBy === 'updated') {
            const aTime = new Date(a.updated_at).getTime();
            const bTime = new Date(b.updated_at).getTime();
            return (aTime - bTime) * multiplier;
        }
        // default: stars
        return ((a.stargazers_count || 0) - (b.stargazers_count || 0)) * multiplier;
    });

    displayRepos(repos);
}

function fetchProjects() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter a GitHub username.');
        return;
    }

    const apiUrl = `https://api.github.com/users/${username}/repos?per_page=100`;
    const loader = document.getElementById('loader');
    const projectsContainer = document.getElementById('projects');
    resetFilterInputs();

    loader.style.display = 'block'; // Show the loader
    projectsContainer.innerHTML = ''; // Clear existing content before new fetch

    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('GitHub user not found. Please check the username and try again.');
            }
            return response.json();
        })
        .then(data => {
            allRepos = Array.isArray(data) ? data.slice() : [];
            // Default sort by stars desc
            allRepos.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
            populateLanguageFilter(allRepos);
            showFiltersPanel();
            applyFiltersAndSort();
            loader.style.display = 'none'; // Hide the loader when data is ready
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
            loader.style.display = 'none'; // Hide the loader on error
        });
}

function displayRepos(repos) {
    const projectsContainer = document.getElementById('projects');
    projectsContainer.innerHTML = ''; // Clear any previous content

    repos.forEach(repo => {
        const cardDiv = document.createElement('div');
        cardDiv.className = 'p-4 md:w-1/3';

        const infoDiv = document.createElement('div');
        infoDiv.className = 'h-full bg-white rounded-lg shadow-md hover:shadow-lg overflow-hidden';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'p-6';

        const repoName = document.createElement('h5');
        repoName.className = 'text-xl font-semibold mb-2 text-gray-900';
        repoName.textContent = repo.name;

        const repoDescription = document.createElement('p');
        repoDescription.className = 'text-base text-gray-700 mb-4';
        repoDescription.textContent = repo.description || 'No description provided.';

        const repoLanguage = document.createElement('p');
        repoLanguage.className = 'text-gray-600 text-sm mb-2';
        repoLanguage.textContent = `Language: ${repo.language || 'Not specified'}`;

        const repoStars = document.createElement('p');
        repoStars.className = 'text-gray-600 text-sm mb-2';
        repoStars.textContent = `Stars: ${repo.stargazers_count}`;

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'flex flex-wrap gap-2';

        const repoLink = document.createElement('a');
        repoLink.className = 'inline-block bg-indigo-500 text-white text-sm font-semibold rounded-md px-4 py-2 hover:bg-indigo-600';
        repoLink.href = repo.html_url;
        repoLink.textContent = 'View Project';
        repoLink.target = '_blank';
        buttonsDiv.appendChild(repoLink);

        const rawHomepage = (repo.homepage || '').trim();
        if (rawHomepage) {
            const normalizedHomepage = /^(http|https):\/\//i.test(rawHomepage) ? rawHomepage : `https://${rawHomepage}`;
            const homepageLink = document.createElement('a');
            homepageLink.className = 'inline-block bg-gray-100 text-indigo-600 text-sm font-semibold rounded-md px-4 py-2 hover:bg-gray-200 border border-indigo-200';
            homepageLink.href = normalizedHomepage;
            homepageLink.textContent = 'Homepage';
            homepageLink.target = '_blank';
            buttonsDiv.appendChild(homepageLink);
        }

        contentDiv.appendChild(repoName);
        contentDiv.appendChild(repoDescription);
        contentDiv.appendChild(repoLanguage);
        contentDiv.appendChild(repoStars);
        contentDiv.appendChild(buttonsDiv);

        infoDiv.appendChild(contentDiv);
        cardDiv.appendChild(infoDiv);

        projectsContainer.appendChild(cardDiv);
    });

    if (repos.length === 0) {
        projectsContainer.innerHTML = '<p class="text-gray-700 text-center">No repositories found for this user.</p>';
    }
}

// Initialize listeners on load
setupFilterListeners();
