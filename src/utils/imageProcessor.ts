import { ArtworkItem } from '../data/artworks';

export interface SiteContent {
  mainHeroImage: string;
  smallHeroImage: string;
  heroArchiveLabel: string;
  heroSubtitle: string;
  myStoryLabel: string;
  myStoryHeading: string;
  myStoryLead: string;
  myStorySubtext: string;
  aboutSectionLabel: string;
  aboutEstablishedLabel: string;
  aboutHeadline: string;
  evolutionTitle: string;
  evolutionSummary: string;
  evolutionDetail1: string;
  evolutionDetail2: string;
  approachTitle: string;
  approachSummary: string;
  approachDetail1: string;
  approachDetail2: string;
  aboutLeftImage: string;
  aboutRightImage: string;
  contactHeading: string;
  contactSubtext: string;
  studioEmail: string;
  studioWhatsappDisplay: string;
  studioWhatsappUrl: string;
  footerTagline: string;
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  mainHeroImage:
    '/assets/aistudio/Dual_Portraits__Purple_Glow_and_Pink_Sunlight_11cf5606.png',
  smallHeroImage:
    '/assets/aistudio/Casual_Portrait_with_Pink_Hair_and_Gold_Glasses_c215e3fd.png',
  heroArchiveLabel: 'ArtbyMo · Digital & Physical Archive',
  heroSubtitle: 'From Inner Turbulence to Visual Sanctuary',
  myStoryLabel: 'Welcome to ArtbyMo',
  myStoryHeading: 'MY STORY',
  myStoryLead:
    'ArtbyMo began in 2020 during a season of heavy mental health struggles. Drawing started as a quiet lifeline, a raw and honest outlet to release the emotional turbulence inside when spoken words felt out of reach.',
  myStorySubtext:
    'What began as survival sketching in 2020 gradually progressed over the years into a deliberate, aesthetic, and deeply personal form of inner expression.',
  aboutSectionLabel: '02 · Who I Am',
  aboutEstablishedLabel: 'ArtbyMo · Established 2020',
  aboutHeadline:
    'TRANSLATING INNER TURBULENCE INTO SILENT GEOMETRY, LINE, AND CHROMATIC SANCTUARY.',
  evolutionTitle: 'Evolution (Since 2020)',
  evolutionSummary:
    'In 2020, sketching began not as a career ambition, but as a quiet sanctuary for the mental health struggles I was passing through at the time.',
  evolutionDetail1:
    'Putting pen and brush to paper offered a safe vessel to pour out the weight, restlessness, and emotional turbulence inside when nothing else could express it.',
  evolutionDetail2:
    'Over the years, those raw, instinctive 2020 drawings evolved into a disciplined visual vocabulary. The lines grew sharper, the symbols more intentional, and the colors bolder, transforming a private coping mechanism into ArtbyMo: an ongoing chronicle of healing, resilience, and self-discovery.',
  approachTitle: 'Approach & Inner Expression',
  approachSummary:
    'Every physical canvas and digital composition is an intimate mirror of internal states, balancing vulnerability with structural calm.',
  approachDetail1:
    'Through interlocking cubist faces, bisected color fields, and poetic visual chapters, my work explores the duality between what we show the world and what we carry within.',
  approachDetail2:
    'Whether working with India ink and acrylics on paper or layering digital impasto brushes, the goal remains unchanged since 2020: honest inner expression that allows both artist and viewer room to breathe.',
  aboutLeftImage: '/assets/artworks/mo_work_10.svg',
  aboutRightImage: '/assets/artworks/mo_work_05.svg',
  contactHeading: 'Connect with ArtbyMo',
  contactSubtext:
    'Available for private physical commissions, archival digital editions, collaborations, and gallery inquiries.',
  studioEmail: 'artbymoinspired@gmail.com',
  studioWhatsappDisplay: '+234 906 715 6870',
  studioWhatsappUrl: 'https://wa.me/2349067156870',
  footerTagline:
    'Contemporary physical canvases and digital editions born from inner expression.',
};

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

export async function saveSiteContentToDB(
  key: 'published_site_content' | 'draft_site_content',
  content: SiteContent
): Promise<void> {
  try {
    const db = await openStudioDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(content, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to localStorage
  }
  try {
    localStorage.setItem(`artbymo_${key}_v2`, JSON.stringify(content));
  } catch {
    // Ignore quota errors
  }
}

export async function loadSiteContentFromDB(
  key: 'published_site_content' | 'draft_site_content'
): Promise<SiteContent | null> {
  let loaded: Partial<SiteContent> | null = null;
  try {
    const db = await openStudioDB();
    const result = await new Promise<SiteContent | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }
    );
    if (result && typeof result === 'object') {
      loaded = result;
    }
  } catch {
    // Fallback to localStorage
  }

  if (!loaded) {
    try {
      const raw = localStorage.getItem(`artbymo_${key}_v2`);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          loaded = parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  if (!loaded) return null;

  const merged: SiteContent = {
    ...DEFAULT_SITE_CONTENT,
    ...loaded,
  };

  // Migrate legacy email / whatsapp if still set to older defaults
  if (merged.studioEmail === 'travismo1998@gmail.com') {
    merged.studioEmail = DEFAULT_SITE_CONTENT.studioEmail;
  }
  if (
    merged.studioWhatsappDisplay === '+234 904 627 4402' ||
    merged.studioWhatsappUrl.includes('2349046274402')
  ) {
    merged.studioWhatsappDisplay = DEFAULT_SITE_CONTENT.studioWhatsappDisplay;
    merged.studioWhatsappUrl = DEFAULT_SITE_CONTENT.studioWhatsappUrl;
  }

  return merged;
}
