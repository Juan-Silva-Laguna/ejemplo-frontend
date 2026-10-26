const byId = (id) => document.getElementById(id);
const API_BASE_URL = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  ? 'https://prueba.hostless.app'
  : '';
const state = { notes: [], editing: null };

function message(text, isError = false) {
  byId('status').textContent = text;
  byId('status').classList.toggle('error', isError);
}

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

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

function renderNotes() {
  const search = byId('search').value.trim().toLocaleLowerCase();
  const notes = state.notes.filter((note) => (
    `${note.titulo} ${note.contenido}`.toLocaleLowerCase().includes(search)
  ));
  byId('note-count').textContent = `${notes.length} ${notes.length === 1 ? 'nota' : 'notas'}`;
  byId('notes').replaceChildren(...notes.map((note) => {
    const card = element('article', undefined, 'note');
    const actions = element('div', undefined, 'note-actions');
    const edit = element('button', 'Editar', 'secondary');
    const remove = element('button', 'Eliminar', 'danger');
    edit.type = remove.type = 'button';
    edit.addEventListener('click', () => editNote(note));
    remove.addEventListener('click', async () => {
      if (!confirm(`Eliminar la nota "${note.titulo}"?`)) return;
      remove.disabled = true;
      try {
        await api(`notas/${note.id}`, 'DELETE');
        if (state.editing === note.id) resetEditor();
        await refresh();
        message('Nota eliminada.');
      } catch (error) {
        message(error.message, true);
      } finally {
        remove.disabled = false;
      }
    });
    actions.append(edit, remove);
    card.append(
      element('span', note.categoria || 'Sin categoría', 'note-meta'),
      element('h3', note.titulo),
      element('p', note.contenido || 'Sin contenido', 'note-content'),
      actions,
    );
    return card;
  }));
  if (!notes.length) {
    byId('notes').append(element('p', state.notes.length
      ? 'No hay notas que coincidan con este filtro.'
      : 'Todavía no hay notas.', 'empty'));
  }
}

async function refresh() {
  const [notes, categories] = await Promise.all([api('notas'), api('categorias')]);
  state.notes = notes;
  const selected = byId('note-category').value;
  const options = [new Option('Sin categoría', '')];
  for (const category of categories) options.push(new Option(category.nombre, category.id));
  byId('note-category').replaceChildren(...options);
  byId('note-category').value = options.some((option) => option.value === selected) ? selected : '';
  renderNotes();
}

function resetEditor(focus = false) {
  state.editing = null;
  byId('note-form').reset();
  byId('editor-title').textContent = 'Nueva nota';
  byId('cancel-edit').hidden = true;
  if (focus) byId('title').focus();
}

function editNote(note) {
  state.editing = note.id;
  byId('title').value = note.titulo;
  byId('content').value = note.contenido;
  byId('note-category').value = note.categoria_id ?? '';
  byId('editor-title').textContent = 'Editar nota';
  byId('cancel-edit').hidden = false;
  byId('title').focus();
}

byId('note-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  byId('save-note').disabled = true;
  const category = byId('note-category').value;
  try {
    await api(state.editing === null ? 'notas' : `notas/${state.editing}`,
      state.editing === null ? 'POST' : 'PUT', {
        titulo: byId('title').value,
        contenido: byId('content').value,
        categoria_id: category ? Number(category) : null,
      });
    resetEditor();
    await refresh();
    message('Nota guardada.');
  } catch (error) {
    message(error.message, true);
  } finally {
    byId('save-note').disabled = false;
  }
});

byId('search').addEventListener('input', renderNotes);
byId('cancel-edit').addEventListener('click', () => resetEditor(true));
refresh().catch((error) => {
  byId('notes').replaceChildren(element('p', 'No se pudieron cargar las notas.', 'empty'));
  message(error.message, true);
});