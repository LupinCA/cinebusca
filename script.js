let favoriteMovies =
  JSON.parse(localStorage.getItem('favorites')) || [];

let currentView = 'all';
let currentMovies = [];

let currentPage = 1;
let totalResults = 0;

let searchTimeout;

/* =========================
   ELEMENTOS
========================= */

const searchInput =
  document.getElementById('searchInput');

const movieGrid =
  document.getElementById('movieGrid');

const errorBox =
  document.getElementById('errorBox');

const genreSelect =
  document.getElementById('genreSelect');

const sortSelect =
  document.getElementById('sortSelect');

const apiStatus =
  document.getElementById('apiStatus');

const clearButton =
  document.getElementById('clearButton');

const resultTitle =
  document.getElementById('resultTitle');

const resultInfo =
  document.getElementById('resultInfo');

const movieModal =
  document.getElementById('movieModal');

const modalBody =
  document.getElementById('modalBody');

const closeModal =
  document.getElementById('closeModal');

const prevPage =
  document.getElementById('prevPage');

const nextPage =
  document.getElementById('nextPage');

const pageInfo =
  document.getElementById('pageInfo');

const viewButtons =
  document.querySelectorAll('.segmented button');

/* =========================
   ESTADO INICIAL
========================= */

movieGrid.innerHTML = `
  <p class="empty">
    Digite um filme para começar
  </p>
`;

/* =========================
   HELPERS
========================= */

function getPoster(movie) {

  return movie.Poster !== 'N/A'
    ? movie.Poster
    : 'https://placehold.co/300x450?text=Sem+Imagem';

}

function setLoading(isLoading) {

  if (isLoading) {

    movieGrid.innerHTML = `
      <p class="loading">
        Carregando filmes...
      </p>
    `;

    return;
  }

  movieGrid.innerHTML = '';

}

function setModalLoading() {

  modalBody.innerHTML = `
    <p class="loading">
      Carregando detalhes...
    </p>
  `;

}

function showError(message) {

  errorBox.textContent = message;
  errorBox.style.display = 'block';

}

function clearError() {

  errorBox.textContent = '';
  errorBox.style.display = 'none';

}

/* =========================
   API
========================= */

async function fetchMovies(query, page = 1) {

  try {

    setLoading(true);

    clearError();

    const res = await fetch(
      `https://www.omdbapi.com/?apikey=bcbba18a&s=${encodeURIComponent(query)}&page=${page}`
    );

    const data = await res.json();

    apiStatus.textContent = 'API Online';

    if (data.Response === 'False') {

      totalResults = 0;

      updatePagination();

      showError('Nenhum filme encontrado.');

      resultInfo.textContent =
        '0 resultados encontrados';

      return [];

    }

    totalResults = Number(data.totalResults);

    resultInfo.textContent =
      `${totalResults} resultados encontrados`;

    populateGenres(data.Search);

    updatePagination();

    return data.Search || [];

  } catch (err) {

    apiStatus.textContent = 'Erro na API';

    showError(
      'Erro ao buscar filmes. Tente novamente.'
    );

    return [];

  }

}

async function fetchMovieDetails(imdbID) {

  const res = await fetch(
    `https://www.omdbapi.com/?apikey=bcbba18a&i=${imdbID}`
  );

  const data = await res.json();

  return data;

}

/* =========================
   GÊNEROS
========================= */

function populateGenres(movies) {

  const genres = [...new Set(
    movies.map(movie => movie.Type)
  )];

  genreSelect.innerHTML = `
    <option value="all">
      Todos
    </option>
  `;

  genres.forEach(genre => {

    genreSelect.innerHTML += `
      <option value="${genre}">
        ${genre}
      </option>
    `;

  });

}

/* =========================
   MODAL
========================= */

function openModal(movie) {

  const poster = getPoster(movie);

  movieModal.classList.remove('hidden');

  modalBody.innerHTML = `
    <div class="modal-layout">

      <img
        class="modal-poster"
        src="${poster}"
        alt="${movie.Title}"
      >

      <div class="modal-info">

        <h2>${movie.Title}</h2>

        <p>
          <strong>⭐ Nota:</strong>
          ${movie.imdbRating}
        </p>

        <p>
          <strong>📅 Ano:</strong>
          ${movie.Year}
        </p>

        <p>
          <strong>🎭 Tipo:</strong>
          ${movie.Type}
        </p>

        <p>
          <strong>🎬 Diretor:</strong>
          ${movie.Director}
        </p>

        <p>
          <strong>👥 Atores:</strong>
          ${movie.Actors}
        </p>

        <p>
          <strong>⏱️ Duração:</strong>
          ${movie.Runtime}
        </p>

        <p class="modal-plot">
          ${movie.Plot}
        </p>

      </div>

    </div>
  `;

}

function closeMovieModal() {

  movieModal.classList.add('hidden');
  document.body.style.overflow = '';

}

/* =========================
   FAVORITOS
========================= */

function toggleFavorite(movie) {

  const alreadyExists = favoriteMovies.some(
    fav => fav.imdbID === movie.imdbID
  );

  if (alreadyExists) {

    favoriteMovies = favoriteMovies.filter(
      fav => fav.imdbID !== movie.imdbID
    );

  } else {

    favoriteMovies.push(movie);

  }

  localStorage.setItem(
    'favorites',
    JSON.stringify(favoriteMovies)
  );

}

/* =========================
   ORDENAÇÃO
========================= */

function sortMovies(list) {

  const sortedMovies = [...list];

  switch (sortSelect.value) {

    case 'title-asc':

      sortedMovies.sort((a, b) =>
        a.Title.localeCompare(b.Title)
      );

      break;

    case 'title-desc':

      sortedMovies.sort((a, b) =>
        b.Title.localeCompare(a.Title)
      );

      break;

   case 'year-desc':

      sortedMovies.sort((a, b) =>
        Number(b.Year) - Number(a.Year)
      );

      break;

    case 'year-asc':

      sortedMovies.sort((a, b) =>
        Number(a.Year) - Number(b.Year)
      );

      break;

  }

  return sortedMovies;

}

/* =========================
   RENDER
========================= */

function renderMovies(list) {

  movieGrid.innerHTML = '';

  if (list.length === 0) {

    movieGrid.innerHTML = `
      <p class="empty">
        Nenhum filme encontrado.
      </p>
    `;

    return;

  }

  list.forEach(movie => {

    const card = document.createElement('div');

    card.classList.add('movie-card');

    const isFavorite = favoriteMovies.some(
      fav => fav.imdbID === movie.imdbID
    );

    const poster = getPoster(movie);

    card.innerHTML = `
      <div class="poster">

        <img
          src="${poster}"
          alt="${movie.Title}"
        >

      </div>

      <div class="movie-info">

        <button
         <button
  class="favorite ${isFavorite ? 'active' : ''}"
  aria-label="Salvar filme"
>
        >
          ★
        </button>

        <h3 class="movie-title">
          ${movie.Title}
        </h3>

        <div class="meta-row">

          <span>${movie.Year}</span>

        </div>

      </div>
    `;

    movieGrid.appendChild(card);

    const favButton =
      card.querySelector('.favorite');

    favButton.addEventListener(
      'click',
      (event) => {

        event.stopPropagation();

        toggleFavorite(movie);

favButton.classList.toggle('active');

if (currentView === 'fav') {
  updateView();
}
      }
    );

    card.addEventListener('click', async () => {

      movieModal.classList.remove('hidden');
document.body.style.overflow = 'hidden';
      setModalLoading();

      const details =
        await fetchMovieDetails(movie.imdbID);

      openModal(details);

    });

  });

}

/* =========================
   PAGINAÇÃO
========================= */

function updatePagination() {

  const totalPages =
    Math.ceil(totalResults / 10);

 if (totalResults === 0) {

  pageInfo.textContent =
    'Página 0 de 0';

} else {

  pageInfo.textContent =
    `Página ${currentPage} de ${totalPages}`;

}

  prevPage.disabled =
    currentPage === 1;

  nextPage.disabled =
    currentPage >= totalPages;

}

/* =========================
   VIEW
========================= */

function updateView() {

  resultTitle.textContent =
    currentView === 'fav'
      ? 'Filmes salvos'
      : 'Filmes encontrados';

  if (currentView === 'fav') {

    if (favoriteMovies.length === 0) {

      movieGrid.innerHTML = `
        <p class="empty">
          Você ainda não salvou filmes.
        </p>
      `;

      return;

    }

    const sortedFavorites =
      sortMovies(favoriteMovies);

    renderMovies(sortedFavorites);

    return;

  }

  let filteredMovies = [...currentMovies];

  if (genreSelect.value !== 'all') {

    filteredMovies = filteredMovies.filter(
      movie => movie.Type === genreSelect.value
    );

  }

  if (currentView === 'top') {

    filteredMovies =
      filteredMovies.slice(0, 5);

  }

  const sortedMovies =
    sortMovies(filteredMovies);

  renderMovies(sortedMovies);

}

/* =========================
   EVENTOS
========================= */

searchInput.addEventListener(
  'input',
  (event) => {

    const value = event.target.value;

    clearTimeout(searchTimeout);

    if (!value) {

      currentMovies = [];

      currentPage = 1;

      totalResults = 0;

      updatePagination();

      movieGrid.innerHTML = `
        <p class="empty">
          Digite um filme para começar
        </p>
      `;

      clearError();

      return;

    }

    searchTimeout = setTimeout(async () => {

      currentPage = 1;

      const movies =
        await fetchMovies(value, currentPage);

      currentMovies = movies;

      updateView();

    }, 500);

  }
);

viewButtons.forEach(button => {

  button.addEventListener('click', () => {

    currentView = button.dataset.view;

    viewButtons.forEach(btn => {
      btn.classList.remove('active');
    });

    button.classList.add('active');

    updateView();

  });

});

sortSelect.addEventListener('change', updateView);

genreSelect.addEventListener('change', updateView);

clearButton.addEventListener('click', () => {
genreSelect.value = 'all';

sortSelect.value = 'year-desc';

resultInfo.textContent =
  'Aguardando busca...';
  searchInput.value = '';

  currentMovies = [];

  currentPage = 1;

  totalResults = 0;

  clearError();

  updatePagination();

  movieGrid.innerHTML = `
    <p class="empty">
      Digite um filme para começar
    </p>
  `;

});

nextPage.addEventListener('click', async () => {

  const totalPages =
    Math.ceil(totalResults / 10);

  if (currentPage >= totalPages) return;

  currentPage++;

  const movies = await fetchMovies(
    searchInput.value,
    currentPage
  );

  currentMovies = movies;

  updateView();

});

prevPage.addEventListener('click', async () => {

  if (currentPage === 1) return;

  currentPage--;

  const movies = await fetchMovies(
    searchInput.value,
    currentPage
  );

  currentMovies = movies;

  updateView();

});

closeModal.addEventListener(
  'click',
  closeMovieModal
);

movieModal.addEventListener(
  'click',
  (event) => {

    if (event.target === movieModal) {

      closeMovieModal();

    }

  }
);

document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === 'Escape' &&
      !movieModal.classList.contains('hidden')
    ) {

      closeMovieModal();

    }

  }
);