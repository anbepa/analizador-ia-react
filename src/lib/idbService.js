const DB_NAME = 'ia-analyzer-db';
const STORE_NAME = 'reports';
const BUG_STORE = 'bugReports';
const DB_VERSION = 2;

let db;

const initDB = () => {
    return new Promise((resolve, reject) => {
        if (db) {
            return resolve(db);
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error('Error al abrir IndexedDB:', event);
            reject('Error al abrir IndexedDB');
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains(BUG_STORE)) {
                db.createObjectStore(BUG_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
};

export const saveReports = async (reports) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        
        // Limpiar la tienda antes de guardar los nuevos reportes
        const clearRequest = store.clear();

        clearRequest.onerror = (event) => {
            console.error('Error al limpiar la tienda de reportes:', event);
            reject('Error al limpiar la tienda de reportes');
        };

        clearRequest.onsuccess = () => {
            // Guardar cada reporte individualmente
            if (reports.length === 0) {
                return resolve();
            }

            let completed = 0;
            reports.forEach(report => {
                const putRequest = store.add(report);
                putRequest.onsuccess = () => {
                    completed++;
                    if (completed === reports.length) {
                        resolve();
                    }
                };
                putRequest.onerror = (event) => {
                    console.error('Error al guardar el reporte:', event);
                    reject('Error al guardar el reporte');
                };
            });
        };

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = (event) => {
            console.error('Error en la transacción de guardado:', event);
            reject('Error en la transacción de guardado');
        };
    });
};

export const loadReports = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onerror = (event) => {
            console.error('Error al cargar los reportes:', event);
            reject('Error al cargar los reportes');
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
};

export const saveBugReports = async (reports) => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BUG_STORE], 'readwrite');
        const store = transaction.objectStore(BUG_STORE);

        const clearRequest = store.clear();

        clearRequest.onerror = (event) => {
            console.error('Error al limpiar la tienda de bugReports:', event);
            reject('Error al limpiar la tienda de bugReports');
        };

        clearRequest.onsuccess = () => {
            if (reports.length === 0) {
                return resolve();
            }

            let completed = 0;
            reports.forEach(report => {
                const putRequest = store.add(report);
                putRequest.onsuccess = () => {
                    completed++;
                    if (completed === reports.length) {
                        resolve();
                    }
                };
                putRequest.onerror = (event) => {
                    console.error('Error al guardar el bugReport:', event);
                    reject('Error al guardar el bugReport');
                };
            });
        };

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = (event) => {
            console.error('Error en la transacción de bugReports:', event);
            reject('Error en la transacción de bugReports');
        };
    });
};

export const loadBugReports = async () => {
    const db = await initDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([BUG_STORE], 'readonly');
        const store = transaction.objectStore(BUG_STORE);
        const request = store.getAll();

        request.onerror = (event) => {
            console.error('Error al cargar los bugReports:', event);
            reject('Error al cargar los bugReports');
        };

        request.onsuccess = () => {
            resolve(request.result);
        };
    });
};

