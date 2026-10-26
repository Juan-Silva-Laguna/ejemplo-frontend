const byId = (id) => document.getElementById(id);
const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'https://prueba.hostless.app'
  : '';

async function api(path, method = 'GET', body) {
  const response = await fetch(`${API_BASE_URL}/api/${path}`, {
    method,
    headers: body === undefined ? {} : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (response.status === 204) return null;
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.');
  return data;
}

function showMessage(text, isError = false) {
  byId('status').textContent = text;
  byId('status').classList.toggle('error', isError);
}

function renderCategories(categories) {
  const items = categories.map((category) => {
    const row = document.createElement('div');
    row.className = 'category-item';
    const name = document.createElement('span');
    name.textContent = category.nombre;
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'danger';
    remove.textContent = 'Eliminar';
    remove.addEventListener('click', async () => {
      if (!confirm(`¿Eliminar "${category.nombre}"? Sus notas quedarán sin categoría.`)) return;
      remove.disabled = true;
      try {
        await api(`categorias/${category.id}`, 'DELETE');
        await refresh();
        showMessage('Categoría eliminada. Las notas se conservaron.');
      } catch (error) {
        showMessage(error.message, true);
      } finally {
        remove.disabled = false;
      }
    });
    row.append(name, remove);
    return row;
  });
  byId('categories').replaceChildren(...items);
  if (!categories.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Todavía no hay categorías.';
    byId('categories').append(empty);
  }
}

async function refresh() {
  renderCategories(await api('categorias'));
}

byId('category-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button');
  button.disabled = true;
  try {
    await api('categorias', 'POST', { nombre: byId('category-name').value });
    byId('category-form').reset();
    await refresh();
    showMessage('Categoría creada.');
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    button.disabled = false;
  }
});

refresh().catch((error) => {
  byId('categories').textContent = 'No se pudieron cargar las categorías.';
  showMessage(error.message, true);
});