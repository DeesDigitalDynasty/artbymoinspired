import { ArtworkItem } from '../data/artworks';

/**
 * Processes an uploaded image file from the user's device into an optimized
 * high-resolution Data URL suitable for persistent browser storage.
 */
export const processUploadedImageFile = (
  file: File,
  maxDimension = 1400
): Promise<{ dataUrl: string; width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const resultStr = event.target?.result as string;
      if (!resultStr) {
        reject(new Error('Could not read image file.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        const origW = width;
        const origH = height;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ dataUrl: resultStr, width: origW, height: origH });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType =
          file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const quality = mimeType === 'image/jpeg' ? 0.88 : undefined;
        const optimizedDataUrl = canvas.toDataURL(mimeType, quality);

        resolve({
          dataUrl: optimizedDataUrl,
          width: origW,
          height: origH,
        });
      };
      img.onerror = () => reject(new Error('Invalid image file.'));
      img.src = resultStr;
    };
    reader.onerror = () => reject(new Error('Error reading file.'));
    reader.readAsDataURL(file);
  });
};

const DB_NAME = 'ArtbyMoStudioDB';
const DB_VERSION = 1;
const STORE_NAME = 'portfolio_store';

function openStudioDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function savePortfolioToDB(
  key: 'published_artworks' | 'draft_artworks',
  items: ArtworkItem[]
): Promise<void> {
  try {
    const db = await openStudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(items, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage if IndexedDB is unavailable
  }
  try {
    localStorage.setItem(`artbymo_${key}_v3`, JSON.stringify(items));
  } catch {
    // Ignore localStorage quota exceeded when large photos are stored in IndexedDB
  }
}

export async function loadPortfolioFromDB(
  key: 'published_artworks' | 'draft_artworks'
): Promise<ArtworkItem[] | null> {
  try {
    const db = await openStudioDB();
    const result = await new Promise<ArtworkItem[] | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }
    );
    if (Array.isArray(result) && result.length > 0) {
      return result;
    }
  } catch {
    // Fallback to localStorage
  }

  try {
    const raw = localStorage.getItem(`artbymo_${key}_v3`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // Ignore
  }
  return null;
}
