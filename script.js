button = document.getElementById("add");
let contenido = document.getElementById("contenido");

const INDEXDB_NAME = "clickBD";
const INDEXDB_VERSION = 1;
const STORE_NAME = "cliksStore";

let db = null;
let counter = 1;

openDB()
  .then(() => {
    loadNotes(); // Load existing notes when the page is opened
    button.addEventListener("click", addNots);
  })
  .catch((error) => {
    console.error("Error al abrir la base de datos: " + error);
  });

function openDB() {
  return new Promise((resolve, reject) => {
    let request = indexedDB.open(INDEXDB_NAME, INDEXDB_VERSION);

    request.onsuccess = (event) => {
      db = event.target.result;
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };

    request.onupgradeneeded = (event) => {
      db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        let objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

function loadNotes() {
  if (!db) {
    console.error("La base de datos no está abierta.");
    return;
  }

  let transaction = db.transaction([STORE_NAME], "readonly");
  let objectStore = transaction.objectStore(STORE_NAME);
  let request = objectStore.openCursor();

  request.onsuccess = (event) => {
    let cursor = event.target.result;

    if (cursor) {
      let notas = document.createElement("div");
      notas.id = cursor.value.id;
      notas.className = "notas";
      notas.innerHTML = `
        <div class="opcionesNotas">
          <button class="anadirNota">😀</button>
          <button class="borrarNota">🗑</button>
        </div>
        <div class="contenidoNota">
          <textarea class="textarea">${cursor.value.content}</textarea>
        </div>
      `;
      contenido.appendChild(notas);

      let anadirNota = notas.querySelector(".anadirNota");
      anadirNota.addEventListener("click", () => addClick(cursor.value.id));

      let borrarNota = notas.querySelector(".borrarNota");
      borrarNota.addEventListener('click', () => {
        notas.remove();
        deleteNota(cursor.value.id);
      });

      cursor.continue();
    }
  };

  request.onerror = (event) => {
    console.error("Error al cargar las notas: " + event.target.error);
  };
}

function addNots() {
  let notas = document.createElement("div");
  let notaId = "nota" + counter;

  notas.innerHTML = `
    <div id="${notaId}" class="notas">
      <div class="opcionesNotas">
        <button class="anadirNota">😀</button>
        <button class="borrarNota">🗑</button>
      </div>
      <div class="contenidoNota">
        <textarea class="textarea"></textarea>
      </div>
    </div>`;

  contenido.appendChild(notas);

  let anadirNota = notas.querySelector(".anadirNota");
  anadirNota.addEventListener("click", () => addClick(notaId));

  let borrarNota = notas.querySelector(".borrarNota");
  borrarNota.addEventListener('click', () => {
    deleteNota(notaId);
    notas.remove();
    
  });

  counter++;
}

function addClick(notaId) {
  let textarea = document.getElementById(notaId).querySelector(".textarea");
  let noteText = textarea.value.trim();

  if (noteText !== "") {
    addData(notaId, noteText)
      .then(() => {
        console.log("Nota añadida a la base de datos:", noteText);
      })
      .catch((error) => {
        console.error("Error al añadir nota a la base de datos: " + error);
      });
  } else {
    alert("Por favor, escribe algo en la nota antes de guardar.");
  }
}

function addData(notaId, data) {
  if (!db) {
    return Promise.reject(new Error("La base de datos no está abierta."));
  }

  return new Promise((resolve, reject) => {
    let transaction = db.transaction([STORE_NAME], "readwrite");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.put({ id: notaId, content: data });

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

function deleteNota(notaId) {
  console.log("Intentando eliminar nota con ID: " + notaId);

  let notaElement = document.getElementById(notaId);

  if (notaElement) {
    deleteData(notaId)
      .then(() => {
        if (notaElement.parentNode === contenido) {
          contenido.removeChild(notaElement);
          console.log("Nota eliminada del DOM y de la base de datos");
        } else {
          console.error("Error: La nota no es un hijo válido del nodo de contenido");
        }
      })
      .catch((error) => {
        console.error("Error al eliminar nota: " + error);
      });
  } else {
    console.error("Error: No se pudo encontrar el elemento de la nota con ID " + notaId);
  }
}

function deleteData(notaId) {
  if (!db) {
    return Promise.reject(new Error("La base de datos no está abierta."));
  }

  return new Promise((resolve, reject) => {
    let transaction = db.transaction([STORE_NAME], "readwrite");
    let objectStore = transaction.objectStore(STORE_NAME);
    let request = objectStore.delete(notaId);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}