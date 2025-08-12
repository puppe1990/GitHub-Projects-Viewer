document.getElementById('loader').style.display = 'none'; // Initially hide the loader

function fetchProjects() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert('Please enter a GitHub username.');
        return;
    }

    const apiUrl = `https://api.github.com/users/${username}/repos?per_page=100`;
    const loader = document.getElementById('loader');
    const projectsContainer = document.getElementById('projects');

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
            const sortedRepos = data.sort((a, b) => b.stargazers_count - a.stargazers_count);
            displayRepos(sortedRepos);
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
