/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  ArrowUpRight,
  Layers,
  Palette,
  Ruler,
  Brush,
  Send,
  Image as ImageIcon,
  Lock,
  ShieldCheck,
  MessageCircle,
  Mail,
  Instagram,
  Globe,
  Sun,
  Moon,
  Menu,
  Facebook,
  Music2,
  FileText,
} from 'lucide-react';
import {
  ArtworkItem,
  ArtworkCategory,
  INITIAL_ARTWORKS,
} from './data/artworks';
import {
  savePortfolioToDB,
  loadPortfolioFromDB,
  SiteContent,
  DEFAULT_SITE_CONTENT,
  saveSiteContentToDB,
  loadSiteContentFromDB,
} from './utils/imageProcessor';
import AdminPortal, {
  AdminCredentials,
  SocialLinks,
} from './components/AdminPortal';
import {
  DEFAULT_PASSWORD_HASH,
  DEFAULT_RECOVERY_QUESTION,
  DEFAULT_RECOVERY_HASH,
  hashPassword,
} from './utils/security';

const STORAGE_KEY_ADMIN_CREDS = 'artbymo_admin_creds_v6';
const LEGACY_STORAGE_KEY_V5 = 'artbymo_admin_creds_v5';
const LEGACY_STORAGE_KEY_V4 = 'artbymo_admin_creds_v4';
const LEGACY_STORAGE_KEY_V3 = 'artbymo_admin_creds_v3';
const STORAGE_KEY_ADMIN_SESSION = 'artbymo_admin_session_v3';
const STORAGE_KEY_SOCIAL_LINKS = 'artbymo_social_links_v4';
const STORAGE_KEY_THEME_MODE = 'artbymo_theme_mode_v1';

const STUDIO_EMAIL = 'artbymoinspired@gmail.com';
const STUDIO_WHATSAPP_DISPLAY = '+234 906 715 6870';
const STUDIO_WHATSAPP_URL = 'https://wa.me/2349067156870';

/**
 * Resilient Image component implementing the Zero-Broken-Image Policy.
 */
function ResilientArtworkImage({
  src,
  alt,
  title,
  className = '',
}: {
  src: string;
  alt: string;
  title?: string;
  className?: string;
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-[var(--bg-elevated)] text-[var(--text-muted)] p-8 text-center ${className}`}
      >
        <ImageIcon className="w-8 h-8 mb-3 opacity-60 stroke-[1.5]" />
        {title && (
          <span className="font-editorial italic text-lg text-[var(--text-primary)]">
            {title}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}

/**
 * Returns responsive CSS Grid classes that create the modern overlapping masonry layout on desktop & tablet
 * while maintaining spacious, uncluttered flow on mobile devices.
 */
function getMasonryGridClasses(placement: ArtworkItem['gridPlacement']): {
  wrapper: string;
  aspect: string;
  plaqueOffset: string;
} {
  switch (placement) {
    case 'featured-left':
      return {
        wrapper: 'md:col-span-7 md:col-start-1 z-10',
        aspect: 'aspect-[4/5]',
        plaqueOffset: 'md:-mt-10 md:ml-8',
      };
    case 'offset-right':
      return {
        wrapper: 'md:col-span-6 md:col-start-7 md:mt-24 md:-ml-12 z-20',
        aspect: 'aspect-[3/4]',
        plaqueOffset: 'md:-mt-12 md:mr-6',
      };
    case 'center-overlap':
      return {
        wrapper: 'md:col-span-8 md:col-start-3 md:-mt-10 z-20',
        aspect: 'aspect-[4/3]',
        plaqueOffset: 'md:-mt-10 md:ml-12',
      };
    case 'wide-left':
      return {
        wrapper: 'md:col-span-6 md:col-start-1 md:mt-6 z-10',
        aspect: 'aspect-square',
        plaqueOffset: 'md:-mt-10 md:ml-6',
      };
    case 'tall-right':
      return {
        wrapper: 'md:col-span-6 md:col-start-7 md:-mt-16 md:-ml-8 z-20',
        aspect: 'aspect-[4/5]',
        plaqueOffset: 'md:-mt-12 md:ml-10',
      };
    case 'wide-overlap':
    default:
      return {
        wrapper: 'md:col-span-8 md:col-start-2 md:mt-8 z-10',
        aspect: 'aspect-[4/5]',
        plaqueOffset: 'md:-mt-10 md:ml-10',
      };
  }
}

export default function App() {
  // Theme Mode State ('ghost' | 'day')
  const [themeMode, setThemeMode] = useState<'ghost' | 'day'>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_THEME_MODE);
      if (saved === 'day' || saved === 'ghost') {
        return saved;
      }
    } catch {
      // Fallback
    }
    return 'ghost';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeMode);
    try {
      localStorage.setItem(STORAGE_KEY_THEME_MODE, themeMode);
    } catch {
      // Ignore
    }
  }, [themeMode]);

  const handleToggleTheme = () => {
    setThemeMode((prev) => (prev === 'ghost' ? 'day' : 'ghost'));
  };

  // Clean up legacy localStorage keys that pointed to missing files
  useEffect(() => {
    try {
      localStorage.removeItem('artbymo_portfolio_artworks_v1');
      localStorage.removeItem('artbymo_portfolio_artworks_v2');
    } catch {
      // Ignore
    }
  }, []);

  // Published & Draft Artworks
  const [publishedArtworks, setPublishedArtworks] =
    useState<ArtworkItem[]>(INITIAL_ARTWORKS);
  const [draftArtworks, setDraftArtworks] =
    useState<ArtworkItem[]>(INITIAL_ARTWORKS);

  // Published & Draft Front-End Site Content (Hero Images, My Story, Who I Am, Contact)
  const [publishedSiteContent, setPublishedSiteContent] =
    useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [draftSiteContent, setDraftSiteContent] =
    useState<SiteContent>(DEFAULT_SITE_CONTENT);

  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false);

  // Load saved Published & Draft artworks + Site Content from IndexedDB / localStorage on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [
        savedPublishedWorks,
        savedDraftWorks,
        savedPublishedContent,
        savedDraftContent,
      ] = await Promise.all([
        loadPortfolioFromDB('published_artworks'),
        loadPortfolioFromDB('draft_artworks'),
        loadSiteContentFromDB('published_site_content'),
        loadSiteContentFromDB('draft_site_content'),
      ]);

      if (!mounted) return;

      if (savedPublishedWorks && savedPublishedWorks.length > 0) {
        setPublishedArtworks(savedPublishedWorks);
      }
      if (savedDraftWorks && savedDraftWorks.length > 0) {
        setDraftArtworks(savedDraftWorks);
      } else if (savedPublishedWorks && savedPublishedWorks.length > 0) {
        setDraftArtworks(savedPublishedWorks);
      }

      if (savedPublishedContent) {
        setPublishedSiteContent(savedPublishedContent);
      }
      if (savedDraftContent) {
        setDraftSiteContent(savedDraftContent);
      } else if (savedPublishedContent) {
        setDraftSiteContent(savedPublishedContent);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Admin Credentials & Session State (Salted SHA-256 hashes only)
  const [adminCredentials, setAdminCredentials] = useState<AdminCredentials>(
    () => {
      try {
        const savedV6 = localStorage.getItem(STORAGE_KEY_ADMIN_CREDS);
        if (savedV6) {
          const parsed = JSON.parse(savedV6);
          return {
            username: parsed.username || STUDIO_EMAIL,
            passwordHash: parsed.passwordHash || DEFAULT_PASSWORD_HASH,
            recoveryQuestion:
              parsed.recoveryQuestion || DEFAULT_RECOVERY_QUESTION,
            recoveryPhraseHash:
              parsed.recoveryPhraseHash || DEFAULT_RECOVERY_HASH,
            hasCustomizedCredentials: Boolean(parsed.hasCustomizedCredentials),
          };
        }

        // Migrate any legacy storage to v6 with artbymoinspired@gmail.com default
        const legacyRaw =
          localStorage.getItem(LEGACY_STORAGE_KEY_V5) ||
          localStorage.getItem(LEGACY_STORAGE_KEY_V4) ||
          localStorage.getItem(LEGACY_STORAGE_KEY_V3);
        if (legacyRaw) {
          const parsedLegacy = JSON.parse(legacyRaw);
          const migratedUser =
            parsedLegacy.username === 'travismo1998@gmail.com'
              ? STUDIO_EMAIL
              : parsedLegacy.username || STUDIO_EMAIL;
          const migrated: AdminCredentials = {
            username: migratedUser,
            passwordHash: parsedLegacy.passwordHash
              ? parsedLegacy.passwordHash
              : parsedLegacy.password
                ? hashPassword(parsedLegacy.password)
                : DEFAULT_PASSWORD_HASH,
            recoveryQuestion:
              parsedLegacy.recoveryQuestion || DEFAULT_RECOVERY_QUESTION,
            recoveryPhraseHash:
              parsedLegacy.recoveryPhraseHash || DEFAULT_RECOVERY_HASH,
            hasCustomizedCredentials: Boolean(
              parsedLegacy.hasCustomizedCredentials
            ),
          };
          localStorage.setItem(
            STORAGE_KEY_ADMIN_CREDS,
            JSON.stringify(migrated)
          );
          localStorage.removeItem(LEGACY_STORAGE_KEY_V5);
          localStorage.removeItem(LEGACY_STORAGE_KEY_V4);
          localStorage.removeItem(LEGACY_STORAGE_KEY_V3);
          return migrated;
        }
      } catch {
        // Fallback
      }
      return {
        username: STUDIO_EMAIL,
        passwordHash: DEFAULT_PASSWORD_HASH,
        recoveryQuestion: DEFAULT_RECOVERY_QUESTION,
        recoveryPhraseHash: DEFAULT_RECOVERY_HASH,
        hasCustomizedCredentials: false,
      };
    }
  );

  const [socialLinks, setSocialLinks] = useState<SocialLinks>(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY_SOCIAL_LINKS) ||
        localStorage.getItem('artbymo_social_links_v3');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          instagram: parsed.instagram || 'https://instagram.com',
          whatsapp:
            parsed.whatsapp && !parsed.whatsapp.includes('2349046274402')
              ? parsed.whatsapp
              : STUDIO_WHATSAPP_URL,
          tiktok: parsed.tiktok || 'https://tiktok.com',
          facebook: parsed.facebook || 'https://facebook.com',
          twitter: parsed.twitter || 'https://x.com',
          behance: parsed.behance || 'https://behance.net',
        };
      }
    } catch {
      // Fallback
    }
    return {
      instagram: 'https://instagram.com',
      whatsapp: STUDIO_WHATSAPP_URL,
      tiktok: 'https://tiktok.com',
      facebook: 'https://facebook.com',
      twitter: 'https://x.com',
      behance: 'https://behance.net',
    };
  });

  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(
    () => {
      try {
        return sessionStorage.getItem(STORAGE_KEY_ADMIN_SESSION) === 'true';
      } catch {
        return false;
      }
    }
  );

  const [isAdminViewOpen, setIsAdminViewOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Public Gallery Filter State (Collection + Tags)
  const [activeCategory, setActiveCategory] = useState<
    'all' | ArtworkCategory
  >('all');
  const [activeTag, setActiveTag] = useState<string>('All Tags');

  // Per-Artwork Write-Up Dropdown State (Closed by default on all screens)
  const [expandedWriteUpIds, setExpandedWriteUpIds] = useState<
    Record<string, boolean>
  >({});

  const toggleArtworkWriteUp = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedWriteUpIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Selected Artwork Lightbox Modal State
  const [selectedArtworkId, setSelectedArtworkId] = useState<string | null>(
    null
  );
  const [isZoomed, setIsZoomed] = useState(false);
  const [isDetailNotesOpen, setIsDetailNotesOpen] = useState(true);

  // About Section Progressive Disclosure Accordions
  const [expandedAboutCard, setExpandedAboutCard] = useState<
    'evolution' | 'approach' | null
  >('evolution');

  // Contact Section State
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    inquiryType: 'Commission',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);

  // Compute all unique tags across published artworks for the visitor tag filter bar
  const allUniqueTags = useMemo(() => {
    const set = new Set<string>();
    publishedArtworks.forEach((item) => {
      (item.tags || []).forEach((t) => set.add(t));
    });
    return ['All Tags', ...Array.from(set)];
  }, [publishedArtworks]);

  // Filtered artworks for the public gallery
  const filteredArtworks = useMemo(() => {
    return publishedArtworks.filter((item) => {
      const matchesCategory =
        activeCategory === 'all' || item.category === activeCategory;
      const matchesTag =
        activeTag === 'All Tags' || (item.tags || []).includes(activeTag);
      return matchesCategory && matchesTag;
    });
  }, [publishedArtworks, activeCategory, activeTag]);

  // Currently selected artwork for the detail modal
  const selectedArtwork = useMemo(
    () =>
      publishedArtworks.find((item) => item.id === selectedArtworkId) || null,
    [publishedArtworks, selectedArtworkId]
  );

  // Keyboard navigation for Artwork Lightbox Modal
  useEffect(() => {
    if (!selectedArtworkId) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedArtworkId(null);
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight') {
        navigateLightbox(1);
      } else if (e.key === 'ArrowLeft') {
        navigateLightbox(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedArtworkId, filteredArtworks]);

  const navigateLightbox = (direction: 1 | -1) => {
    if (!selectedArtworkId || filteredArtworks.length === 0) return;
    const currentIndex = filteredArtworks.findIndex(
      (a) => a.id === selectedArtworkId
    );
    if (currentIndex === -1) return;
    const nextIndex =
      (currentIndex + direction + filteredArtworks.length) %
      filteredArtworks.length;
    setSelectedArtworkId(filteredArtworks[nextIndex].id);
    setIsZoomed(false);
  };

  // =========================================================================
  // ADMIN DRAFT & LIVE PUBLISH HANDLERS
  // =========================================================================
  const handleUpdateDraftArtwork = (
    id: string,
    updates: Partial<ArtworkItem>
  ) => {
    setDraftArtworks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
    setHasUnpublishedChanges(true);
  };

  const handleAddDraftArtwork = (newWork: ArtworkItem) => {
    setDraftArtworks((prev) => {
      const next = [newWork, ...prev];
      savePortfolioToDB('draft_artworks', next);
      return next;
    });
    setHasUnpublishedChanges(true);
  };

  const handleDeleteDraftArtwork = (id: string) => {
    setDraftArtworks((prev) => prev.filter((item) => item.id !== id));
    setHasUnpublishedChanges(true);
  };

  const handleMoveDraftArtwork = (index: number, direction: -1 | 1) => {
    setDraftArtworks((prev) => {
      const nextIndex = index + direction;
      if (nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, moved);
      return copy;
    });
    setHasUnpublishedChanges(true);
  };

  const handleUpdateDraftSiteContent = (updates: Partial<SiteContent>) => {
    setDraftSiteContent((prev) => ({
      ...prev,
      ...updates,
    }));
    setHasUnpublishedChanges(true);
  };

  const handleSaveDraftChanges = () => {
    savePortfolioToDB('draft_artworks', draftArtworks);
    saveSiteContentToDB('draft_site_content', draftSiteContent);
  };

  const handlePublishToLiveSite = () => {
    setPublishedArtworks(draftArtworks);
    setPublishedSiteContent(draftSiteContent);
    setHasUnpublishedChanges(false);
    savePortfolioToDB('draft_artworks', draftArtworks);
    savePortfolioToDB('published_artworks', draftArtworks);
    saveSiteContentToDB('draft_site_content', draftSiteContent);
    saveSiteContentToDB('published_site_content', draftSiteContent);
  };

  const handleResetGallery = () => {
    setDraftArtworks(INITIAL_ARTWORKS);
    setPublishedArtworks(INITIAL_ARTWORKS);
    setHasUnpublishedChanges(false);
    setActiveCategory('all');
    setActiveTag('All Tags');
    savePortfolioToDB('draft_artworks', INITIAL_ARTWORKS);
    savePortfolioToDB('published_artworks', INITIAL_ARTWORKS);
  };

  const handleResetSiteContent = () => {
    setDraftSiteContent(DEFAULT_SITE_CONTENT);
    setPublishedSiteContent(DEFAULT_SITE_CONTENT);
    setHasUnpublishedChanges(false);
    saveSiteContentToDB('draft_site_content', DEFAULT_SITE_CONTENT);
    saveSiteContentToDB('published_site_content', DEFAULT_SITE_CONTENT);
  };

  const handleUpdateAdminCredentials = (newCreds: AdminCredentials) => {
    setAdminCredentials(newCreds);
    try {
      localStorage.setItem(STORAGE_KEY_ADMIN_CREDS, JSON.stringify(newCreds));
    } catch {
      // Ignore
    }
  };

  const handleUpdateSocialLinks = (newLinks: SocialLinks) => {
    setSocialLinks(newLinks);
    try {
      localStorage.setItem(STORAGE_KEY_SOCIAL_LINKS, JSON.stringify(newLinks));
    } catch {
      // Ignore
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    try {
      sessionStorage.setItem(STORAGE_KEY_ADMIN_SESSION, 'true');
    } catch {
      // Ignore
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setIsAdminViewOpen(false);
    try {
      sessionStorage.removeItem(STORAGE_KEY_ADMIN_SESSION);
    } catch {
      // Ignore
    }
  };

  const handleCopyEmail = async () => {
    const emailToCopy = publishedSiteContent.studioEmail || STUDIO_EMAIL;
    try {
      await navigator.clipboard.writeText(emailToCopy);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2600);
    } catch {
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2600);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim()) return;
    setContactSubmitted(true);
    setTimeout(() => {
      setContactForm({
        name: '',
        email: '',
        inquiryType: 'Commission',
        message: '',
      });
    }, 400);
  };

  const handleNavigateToSection = (
    sectionId: 'top' | 'works' | 'about' | 'contact',
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
    }
    const wasMobileMenuOpen = isMobileMenuOpen;
    setIsMobileMenuOpen(false);

    const performScroll = () => {
      if (sectionId === 'top') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
      const target = document.getElementById(sectionId);
      if (target) {
        const headerEl = document.querySelector('header');
        const headerHeight = headerEl
          ? Math.min(headerEl.getBoundingClientRect().height, 88)
          : 80;
        const targetTop =
          target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
        window.scrollTo({
          top: Math.max(0, targetTop),
          behavior: 'smooth',
        });
      }
    };

    // Perform immediate scroll and, if the mobile drawer was open, re-align once the drawer collapse finishes
    requestAnimationFrame(performScroll);
    if (wasMobileMenuOpen) {
      setTimeout(performScroll, 270);
    }
  };

  return (
    <div
      data-theme={themeMode}
      className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] selection:bg-[#879D90]/30 transition-colors duration-300"
    >
      {/* If Admin View is active, render the Dedicated Admin Portal */}
      {isAdminViewOpen ? (
        <AdminPortal
          themeMode={themeMode}
          onToggleTheme={handleToggleTheme}
          isAuthenticated={isAdminAuthenticated}
          credentials={adminCredentials}
          onUpdateCredentials={handleUpdateAdminCredentials}
          socialLinks={socialLinks}
          onUpdateSocialLinks={handleUpdateSocialLinks}
          onLoginSuccess={handleAdminLoginSuccess}
          onLogout={handleAdminLogout}
          onCloseAdminView={() => setIsAdminViewOpen(false)}
          draftArtworks={draftArtworks}
          draftSiteContent={draftSiteContent}
          hasUnpublishedChanges={hasUnpublishedChanges}
          onUpdateDraftArtwork={handleUpdateDraftArtwork}
          onAddDraftArtwork={handleAddDraftArtwork}
          onDeleteDraftArtwork={handleDeleteDraftArtwork}
          onMoveDraftArtwork={handleMoveDraftArtwork}
          onUpdateDraftSiteContent={handleUpdateDraftSiteContent}
          onResetArtworks={handleResetGallery}
          onResetSiteContent={handleResetSiteContent}
          onSaveDraftChanges={handleSaveDraftChanges}
          onPublishToLiveSite={handlePublishToLiveSite}
        />
      ) : (
        <>
          {/* =====================================================================
              TOP NAVIGATION BAR (Minimalist 3-Zone Contract with Day/Ghost Toggle)
              No Artist Admin link in the navbar (moved strictly to footer)
          ====================================================================== */}
          <header className="sticky top-0 z-40 bg-[var(--bg-header)] backdrop-blur-xl border-b border-[var(--border-subtle)] transition-colors duration-300">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-8 px-6 md:px-12 py-5">
              {/* Zone 1: Case-sensitive brand wordmark ArtbyMo */}
              <a
                href="#top"
                onClick={(e) => handleNavigateToSection('top', e)}
                className="text-base md:text-lg font-semibold tracking-tight text-[var(--text-primary)] whitespace-nowrap shrink-0 cursor-pointer"
              >
                * ArtbyMo
              </a>

              {/* Zone 2: Clean single-line public navigation links */}
              <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-[var(--text-muted)]">
                <a
                  href="#works"
                  onClick={(e) => handleNavigateToSection('works', e)}
                  className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Works
                </a>
                <a
                  href="#about"
                  onClick={(e) => handleNavigateToSection('about', e)}
                  className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  About
                </a>
                <a
                  href="#contact"
                  onClick={(e) => handleNavigateToSection('contact', e)}
                  className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Contacts
                </a>
              </nav>

              {/* Zone 3: Minimalist Day / Ghost Toggle + Primary Action + Mobile Hamburger */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleToggleTheme}
                  aria-label={
                    themeMode === 'ghost'
                      ? 'Switch to Day Mode'
                      : 'Switch to Ghost Mode'
                  }
                  title={
                    themeMode === 'ghost'
                      ? 'Switch to Day Mode (Light)'
                      : 'Switch to Ghost Mode (Dark)'
                  }
                  className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-subtle)] rounded-[22px] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {themeMode === 'ghost' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                      <span>Day</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                      <span>Ghost</span>
                    </>
                  )}
                </button>

                <a
                  href="#contact"
                  onClick={(e) => handleNavigateToSection('contact', e)}
                  className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] rounded-[22px] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] transition-all duration-200 whitespace-nowrap shrink-0 shadow-xs cursor-pointer"
                >
                  <span>Inquire</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>

                {/* Mobile Hamburger Menu Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  aria-expanded={isMobileMenuOpen}
                  aria-label={
                    isMobileMenuOpen
                      ? 'Close navigation menu'
                      : 'Open navigation menu'
                  }
                  className="md:hidden inline-flex items-center justify-center p-2.5 text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer"
                >
                  {isMobileMenuOpen ? (
                    <X className="w-4 h-4" />
                  ) : (
                    <Menu className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Mobile Collapsible Navigation Menu Drawer */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.nav
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  aria-label="Mobile Navigation"
                  className="md:hidden overflow-hidden border-t border-[var(--border-subtle)] bg-[var(--bg-surface-solid)]"
                >
                  <div className="px-6 py-6 flex flex-col gap-3">
                    <a
                      href="#works"
                      onClick={(e) => handleNavigateToSection('works', e)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-[20px] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                      <span>Works</span>
                      <span className="text-xs font-mono-spec text-[var(--text-muted)]">
                        01
                      </span>
                    </a>
                    <a
                      href="#about"
                      onClick={(e) => handleNavigateToSection('about', e)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-[20px] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                      <span>About</span>
                      <span className="text-xs font-mono-spec text-[var(--text-muted)]">
                        02
                      </span>
                    </a>
                    <a
                      href="#contact"
                      onClick={(e) => handleNavigateToSection('contact', e)}
                      className="flex items-center justify-between px-4 py-3.5 rounded-[20px] text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] active:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                      <span>Contacts</span>
                      <span className="text-xs font-mono-spec text-[var(--text-muted)]">
                        03
                      </span>
                    </a>
                    <a
                      href="#contact"
                      onClick={(e) => handleNavigateToSection('contact', e)}
                      className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] rounded-[22px] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] transition-all cursor-pointer"
                    >
                      <span>Inquire</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </motion.nav>
              )}
            </AnimatePresence>
          </header>

          {/* =====================================================================
              HERO LANDING SECTION (Architectural Grid — Editable via Admin)
          ====================================================================== */}
          <main
            id="top"
            className="max-w-[1440px] mx-auto px-6 md:px-12 pt-8 pb-24"
          >
            <section aria-label="Introduction" className="mb-24">
              {/* 4-Column Architectural Grid Container */}
              <div className="grid grid-cols-1 lg:grid-cols-12 border border-[var(--border-subtle)] rounded-[28px] bg-[var(--bg-surface)] backdrop-blur-xl overflow-hidden shadow-2xl transition-colors duration-300">
                {/* Left Column (3 of 12 cols on desktop): Smaller Hero Portrait + Geometric Asterisk */}
                <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-[var(--border-subtle)] p-6 md:p-8 flex flex-col justify-between gap-12">
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="overflow-hidden rounded-[22px] aspect-[3/4] bg-[var(--bg-elevated)] border border-[var(--border-subtle)]"
                  >
                    <ResilientArtworkImage
                      src={publishedSiteContent.smallHeroImage}
                      alt="ArtbyMo Studio Portrait"
                      title="ArtbyMo Studio Portrait"
                      className="w-full h-full object-cover object-center hover:scale-105 transition-all duration-700"
                    />
                  </motion.div>

                  <div className="hidden lg:flex flex-col justify-end pt-12 space-y-4">
                    {/* Architectural 8-spoke asterisk */}
                    <svg
                      viewBox="0 0 64 64"
                      className="w-14 h-14 text-[var(--text-accent)] stroke-current stroke-[3.5]"
                      aria-hidden="true"
                    >
                      <line x1="32" y1="4" x2="32" y2="60" />
                      <line x1="4" y1="32" x2="60" y2="32" />
                      <line x1="12" y1="12" x2="52" y2="52" />
                      <line x1="52" y1="12" x2="12" y2="52" />
                    </svg>
                    <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                      ArtbyMo Exhibition
                    </p>
                  </div>
                </div>

                {/* Right 3 Columns (9 of 12 cols on desktop): Bigger Main Hero + MY STORY Row */}
                <div className="lg:col-span-9 flex flex-col justify-between">
                  {/* Top Main Hero Portrait Container */}
                  <div className="p-6 md:p-8 border-b border-[var(--border-subtle)]">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.985 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                      className="relative overflow-hidden rounded-[24px] bg-[#0B0F0E] aspect-[4/3] sm:aspect-[16/11] border border-[var(--border-subtle)] shadow-xl"
                    >
                      <ResilientArtworkImage
                        src={publishedSiteContent.mainHeroImage}
                        alt="ArtbyMo Main Hero Portrait"
                        title="ArtbyMo"
                        className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.015]"
                      />

                      {/* Subtle studio vignette scrim for readable lower caption on photo */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0E]/85 via-transparent to-transparent pointer-events-none" />

                      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-[#EEF2F0]">
                        <div>
                          <p className="text-xs tracking-widest uppercase text-[#A3B8AC] mb-1">
                            {publishedSiteContent.heroArchiveLabel}
                          </p>
                          <p className="font-editorial italic text-2xl md:text-3xl">
                            {publishedSiteContent.heroSubtitle}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  {/* Lower Architectural Grid Row: MY STORY + Detailed Origin Write-Up */}
                  <div className="grid grid-cols-1 md:grid-cols-9 divide-y md:divide-y-0 md:divide-x divide-[var(--border-subtle)]">
                    <div className="md:col-span-5 p-8 md:p-10 flex flex-col justify-between gap-6">
                      <span className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                        {publishedSiteContent.myStoryLabel}
                      </span>
                      <h1 className="font-editorial text-5xl sm:text-6xl lg:text-7xl font-normal tracking-tight leading-[0.94] text-[var(--text-primary)] text-balance whitespace-pre-line">
                        {publishedSiteContent.myStoryHeading}
                      </h1>
                    </div>

                    <div className="md:col-span-4 p-8 md:p-10 flex flex-col justify-between gap-6 bg-[var(--bg-surface-subtle)]">
                      <div className="space-y-3 text-sm text-[var(--text-secondary)] leading-relaxed">
                        <p>{publishedSiteContent.myStoryLead}</p>
                        <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                          {publishedSiteContent.myStorySubtext}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                        <a
                          href="#contact"
                          onClick={(e) => handleNavigateToSection('contact', e)}
                          className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-[var(--text-primary)] pb-1.5 border-b-2 border-[var(--text-accent)] hover:text-[var(--text-accent)] transition-colors cursor-pointer"
                        >
                          <span>Contact Me</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </a>

                        <a
                          href="#works"
                          onClick={(e) => handleNavigateToSection('works', e)}
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                        >
                          <span>Explore {publishedArtworks.length} Works</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calming Soft Sage Accent Bar */}
              <div className="mt-6 h-1.5 w-full rounded-full bg-gradient-to-r from-[#879D90]/60 via-[#A3B8AC]/35 to-transparent" />
            </section>

            {/* =====================================================================
                PORTFOLIO GALLERY (Overlapping CSS Grid Masonry + Per-Artwork Write-Up Dropdown)
            ====================================================================== */}
            <section id="works" className="py-12 md:py-20 scroll-mt-24">
              {/* Gallery Header & Collection Filter Controls */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-8 pb-8 border-b border-[var(--border-subtle)]">
                <div>
                  <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-3">
                    01 · Curated Exhibition ({filteredArtworks.length} Works)
                  </p>
                  <h2 className="font-editorial text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight text-balance">
                    Selected Works
                  </h2>
                </div>

                {/* Collection Segmented Filter */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    role="tablist"
                    aria-label="Artwork Collections"
                    className="inline-flex items-center p-1.5 bg-[var(--bg-surface)] rounded-[22px] border border-[var(--border-subtle)]"
                  >
                    {(
                      [
                        { id: 'all', label: 'All Works' },
                        { id: 'physical', label: 'Physical Artworks' },
                        { id: 'digital', label: 'Digital Art' },
                      ] as const
                    ).map((tab) => {
                      const active = activeCategory === tab.id;
                      return (
                        <button
                          key={tab.id}
                          role="tab"
                          aria-selected={active}
                          onClick={() => setActiveCategory(tab.id)}
                          className={`px-5 py-2 text-xs font-medium rounded-[18px] transition-all duration-200 whitespace-nowrap shrink-0 cursor-pointer ${
                            active
                              ? 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] shadow-xs'
                              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Interactive Tag Filter Bar */}
              <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-14">
                {allUniqueTags.map((tag) => {
                  const isSelected = activeTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setActiveTag(tag)}
                      className={`px-4 py-1.5 text-xs font-medium rounded-[18px] border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        isSelected
                          ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--btn-primary-bg)]'
                          : 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              {/* Overlapping CSS Grid Masonry Exhibition */}
              <motion.div
                layout
                className="grid grid-cols-1 md:grid-cols-12 gap-y-16 md:gap-y-24 md:gap-x-8 items-start"
              >
                <AnimatePresence mode="popLayout">
                  {filteredArtworks.map((artwork) => {
                    const gridStyle = getMasonryGridClasses(
                      artwork.gridPlacement
                    );
                    const isWriteUpOpen = Boolean(
                      expandedWriteUpIds[artwork.id]
                    );

                    return (
                      <motion.article
                        key={artwork.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        transition={{
                          duration: 0.45,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                        className={`group relative transition-all duration-300 hover:z-30 ${gridStyle.wrapper}`}
                      >
                        {/* Artwork Frame */}
                        <div
                          onClick={() => {
                            setSelectedArtworkId(artwork.id);
                            setIsDetailNotesOpen(true);
                          }}
                          className={`relative overflow-hidden rounded-[24px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-xl transition-transform duration-500 cursor-pointer group-hover:-translate-y-1 ${gridStyle.aspect}`}
                        >
                          <ResilientArtworkImage
                            src={artwork.imageUrl}
                            alt={artwork.title}
                            title={artwork.title}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                          />

                          {/* Subtle Hover Inspection Cue */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors duration-300 flex items-end justify-end p-6">
                            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 inline-flex items-center gap-2 px-4 py-2 rounded-[20px] bg-[var(--bg-surface-solid)] text-[var(--text-primary)] border border-[var(--border-subtle)] text-xs font-medium shadow-md">
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span>Inspect Work</span>
                            </span>
                          </div>
                        </div>

                        {/* Overlapping Specification Plaque + Process & Experience Dropdown */}
                        <div
                          className={`relative z-20 mt-4 ${gridStyle.plaqueOffset} max-w-xl rounded-[22px] bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-subtle)] p-6 md:p-7 shadow-xl transition-all duration-300 hover:border-[var(--border-strong)]`}
                        >
                          {/* Plaque Header: Catalog Number, Collection, Year & Unboxed Tags */}
                          <div
                            onClick={() => setSelectedArtworkId(artwork.id)}
                            className="flex items-start justify-between gap-4 mb-4 cursor-pointer"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)] mb-1.5">
                                <span className="font-mono-spec">
                                  {artwork.catalogNumber}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="capitalize">
                                  {artwork.category === 'physical'
                                    ? 'Physical Artwork'
                                    : 'Digital Art'}
                                </span>
                                <span aria-hidden="true">·</span>
                                <span className="font-mono-spec">
                                  {artwork.year}
                                </span>
                              </div>

                              <h3 className="font-editorial text-2xl md:text-3xl text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors truncate">
                                {artwork.title}
                              </h3>

                              {/* Unboxed Typographic Tags */}
                              {artwork.tags && artwork.tags.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-1.5">
                                  {artwork.tags.map((tag, idx) => (
                                    <React.Fragment key={tag}>
                                      {idx > 0 && (
                                        <span aria-hidden="true">·</span>
                                      )}
                                      <span>{tag}</span>
                                    </React.Fragment>
                                  ))}
                                </div>
                              )}
                            </div>

                            <span
                              className="p-2.5 rounded-[16px] text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:bg-[var(--bg-elevated)] transition-colors shrink-0"
                              title="Open full-screen artwork inspection"
                            >
                              <Maximize2 className="w-4 h-4" />
                            </span>
                          </div>

                          {/* 4 Specification Fields: Medium, Art Style, Paint Used, Dimensions */}
                          <dl
                            onClick={() => setSelectedArtworkId(artwork.id)}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 pt-3 border-t border-[var(--border-subtle)] text-xs cursor-pointer"
                          >
                            <div
                              className="flex items-center gap-2 text-[var(--text-secondary)] truncate"
                              title={`Medium: ${artwork.medium}`}
                            >
                              <Layers className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                              <dt className="sr-only">Medium</dt>
                              <dd className="truncate">{artwork.medium}</dd>
                            </div>

                            <div
                              className="flex items-center gap-2 text-[var(--text-secondary)] truncate"
                              title={`Art Style: ${artwork.artStyle}`}
                            >
                              <Palette className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                              <dt className="sr-only">Art Style</dt>
                              <dd className="truncate">{artwork.artStyle}</dd>
                            </div>

                            <div
                              className="flex items-center gap-2 text-[var(--text-secondary)] truncate"
                              title={`Paint Used: ${artwork.paintUsed}`}
                            >
                              <Brush className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                              <dt className="sr-only">Paint Used</dt>
                              <dd className="truncate">{artwork.paintUsed}</dd>
                            </div>

                            <div
                              className="flex items-center gap-2 text-[var(--text-primary)] font-mono-spec truncate"
                              title={`Dimensions: ${artwork.dimensions}`}
                            >
                              <Ruler className="w-3.5 h-3.5 text-[var(--text-accent)] shrink-0" />
                              <dt className="sr-only">Dimensions</dt>
                              <dd className="truncate">{artwork.dimensions}</dd>
                            </div>
                          </dl>

                          {/* Per-Artwork Process & Experience Write-Up Dropdown (Closed by Default on All Screens) */}
                          <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                            <button
                              type="button"
                              onClick={(e) =>
                                toggleArtworkWriteUp(artwork.id, e)
                              }
                              aria-expanded={isWriteUpOpen}
                              className="w-full flex items-center justify-between gap-3 py-1.5 px-2.5 rounded-[14px] hover:bg-[var(--bg-elevated)] text-xs font-medium text-[var(--text-accent)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  {isWriteUpOpen
                                    ? 'Hide Process & Artist Experience'
                                    : 'Read Process & Artist Experience'}
                                </span>
                              </span>
                              <ChevronDown
                                className={`w-4 h-4 shrink-0 transition-transform duration-300 ${
                                  isWriteUpOpen ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            <AnimatePresence initial={false}>
                              {isWriteUpOpen && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  transition={{
                                    duration: 0.28,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2.5 p-4 rounded-[16px] bg-[var(--bg-input)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                                    {artwork.description}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            </section>

            {/* =====================================================================
                ABOUT SECTION ("02 · Who I Am" — Editable via Admin)
            ====================================================================== */}
            <section
              id="about"
              className="py-20 md:py-28 border-t border-[var(--border-subtle)] scroll-mt-24"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Margin Label */}
                <div className="lg:col-span-3 space-y-3">
                  <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                    {publishedSiteContent.aboutSectionLabel}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    {publishedSiteContent.aboutEstablishedLabel}
                  </p>
                </div>

                {/* Right Main Editorial Content */}
                <div className="lg:col-span-9 space-y-14">
                  <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-[1.08] text-[var(--text-primary)] text-balance">
                    {publishedSiteContent.aboutHeadline}
                  </h2>

                  {/* Evolution & Approach Cards with Progressive Disclosure Accordions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* EVOLUTION CARD */}
                    <div className="rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                          {publishedSiteContent.evolutionTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAboutCard((prev) =>
                              prev === 'evolution' ? null : 'evolution'
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-accent)] hover:text-[var(--text-primary)] cursor-pointer"
                          aria-expanded={expandedAboutCard === 'evolution'}
                        >
                          <span>
                            {expandedAboutCard === 'evolution'
                              ? 'Show Less'
                              : 'Read Full Story'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedAboutCard === 'evolution'
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {publishedSiteContent.evolutionSummary}
                      </p>

                      <AnimatePresence>
                        {expandedAboutCard === 'evolution' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] leading-relaxed max-h-48 overflow-y-auto pr-2 space-y-3">
                              <p>{publishedSiteContent.evolutionDetail1}</p>
                              <p>{publishedSiteContent.evolutionDetail2}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* APPROACH CARD */}
                    <div className="rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                          {publishedSiteContent.approachTitle}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAboutCard((prev) =>
                              prev === 'approach' ? null : 'approach'
                            )
                          }
                          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-accent)] hover:text-[var(--text-primary)] cursor-pointer"
                          aria-expanded={expandedAboutCard === 'approach'}
                        >
                          <span>
                            {expandedAboutCard === 'approach'
                              ? 'Show Less'
                              : 'Read Full Note'}
                          </span>
                          <ChevronDown
                            className={`w-4 h-4 transition-transform duration-200 ${
                              expandedAboutCard === 'approach'
                                ? 'rotate-180'
                                : ''
                            }`}
                          />
                        </button>
                      </div>

                      <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                        {publishedSiteContent.approachSummary}
                      </p>

                      <AnimatePresence>
                        {expandedAboutCard === 'approach' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="pt-4 mt-4 border-t border-[var(--border-subtle)] text-xs text-[var(--text-muted)] leading-relaxed max-h-48 overflow-y-auto pr-2 space-y-3">
                              <p>{publishedSiteContent.approachDetail1}</p>
                              <p>{publishedSiteContent.approachDetail2}</p>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Asymmetric Studio Diptych featuring Mo's works */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-4">
                    <div className="md:col-span-5 overflow-hidden rounded-[24px] bg-[var(--bg-surface)] aspect-[3/4] border border-[var(--border-subtle)]">
                      <ResilientArtworkImage
                        src={publishedSiteContent.aboutLeftImage}
                        alt="ArtbyMo Studio Study I"
                        title="ArtbyMo Studio Study I"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                    <div className="md:col-span-7 overflow-hidden rounded-[24px] bg-[var(--bg-surface)] aspect-[4/3] border border-[var(--border-subtle)]">
                      <ResilientArtworkImage
                        src={publishedSiteContent.aboutRightImage}
                        alt="ArtbyMo Studio Study II"
                        title="ArtbyMo Studio Study II"
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* =====================================================================
                CONTACT SECTION (artbymoinspired@gmail.com + WhatsApp +2349067156870)
            ====================================================================== */}
            <section
              id="contact"
              className="py-20 md:py-28 border-t border-[var(--border-subtle)] scroll-mt-24"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                {/* Left Column: Direct Studio Email & WhatsApp Cards */}
                <div className="lg:col-span-5 space-y-6">
                  <div>
                    <p className="text-xs tracking-widest uppercase text-[var(--text-muted)] mb-3">
                      03 · Inquiries & Commissions
                    </p>
                    <h2 className="font-editorial text-4xl sm:text-5xl text-[var(--text-primary)] tracking-tight text-balance">
                      {publishedSiteContent.contactHeading}
                    </h2>
                  </div>

                  <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-md">
                    {publishedSiteContent.contactSubtext}
                  </p>

                  {/* Direct Email Card: artbymoinspired@gmail.com */}
                  <div className="p-6 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                        <span>Direct Studio Email</span>
                      </p>
                      <a
                        href={`mailto:${publishedSiteContent.studioEmail}`}
                        className="font-mono-spec text-sm text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors truncate block"
                      >
                        {publishedSiteContent.studioEmail}
                      </a>
                    </div>

                    <button
                      type="button"
                      onClick={handleCopyEmail}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-[18px] bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-text)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      {emailCopied ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Email</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Direct WhatsApp Card: +234 906 715 6870 */}
                  <div className="p-6 rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wider text-[var(--text-muted)] mb-1 flex items-center gap-1.5">
                        <MessageCircle className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                        <span>Studio WhatsApp</span>
                      </p>
                      <a
                        href={publishedSiteContent.studioWhatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-spec text-sm text-[var(--text-primary)] hover:text-[var(--text-accent)] transition-colors truncate block"
                      >
                        {publishedSiteContent.studioWhatsappDisplay}
                      </a>
                    </div>

                    <a
                      href={publishedSiteContent.studioWhatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium rounded-[18px] bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] border border-[var(--border-subtle)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-text)] transition-colors whitespace-nowrap shrink-0"
                    >
                      <span>Chat on WhatsApp</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Right Column: Minimalist Message Form */}
                <div className="lg:col-span-7">
                  <form
                    onSubmit={handleContactSubmit}
                    className="rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 md:p-12 space-y-6 shadow-xl"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <label className="block">
                        <span className="block text-xs text-[var(--text-muted)] mb-2">
                          Your Name
                        </span>
                        <input
                          type="text"
                          required
                          placeholder="Elena Vance"
                          value={contactForm.name}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full px-5 py-3.5 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[20px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                        />
                      </label>

                      <label className="block">
                        <span className="block text-xs text-[var(--text-muted)] mb-2">
                          Email Address
                        </span>
                        <input
                          type="email"
                          required
                          placeholder="elena@gallery.org"
                          value={contactForm.email}
                          onChange={(e) =>
                            setContactForm((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full px-5 py-3.5 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[20px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)] transition-colors"
                        />
                      </label>
                    </div>

                    {/* Inquiry Type Selector */}
                    <div>
                      <span className="block text-xs text-[var(--text-muted)] mb-2">
                        Subject
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {(
                          [
                            'Commission',
                            'Exhibition Loan',
                            'Acquisition',
                            'Collaboration',
                          ] as const
                        ).map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() =>
                              setContactForm((prev) => ({
                                ...prev,
                                inquiryType: type,
                              }))
                            }
                            className={`px-4 py-2 text-xs font-medium rounded-[18px] transition-colors cursor-pointer ${
                              contactForm.inquiryType === type
                                ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                                : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]'
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="block">
                      <span className="block text-xs text-[var(--text-muted)] mb-2">
                        Message
                      </span>
                      <textarea
                        rows={4}
                        required
                        placeholder="Share a brief note about the space, piece, or project timeline..."
                        value={contactForm.message}
                        onChange={(e) =>
                          setContactForm((prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        className="w-full px-5 py-3.5 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[20px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)] transition-colors resize-none"
                      />
                    </label>

                    <div className="flex items-center justify-between gap-4 pt-2">
                      <AnimatePresence>
                        {contactSubmitted ? (
                          <motion.p
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0 }}
                            className="text-xs text-[var(--text-accent)] font-medium flex items-center gap-2"
                          >
                            <Check className="w-4 h-4" />
                            <span>
                              Thank you. Your inquiry has been logged for
                              ArtbyMo.
                            </span>
                          </motion.p>
                        ) : (
                          <span className="text-xs text-[var(--text-muted)]">
                            Replies within 2 studio days
                          </span>
                        )}
                      </AnimatePresence>

                      <button
                        type="submit"
                        className="inline-flex items-center gap-2.5 px-7 py-3.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[22px] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <span>Send Note</span>
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </main>

          {/* =====================================================================
              FOOTER WITH SOCIAL MEDIA LINKS (INCLUDING TIKTOK & FACEBOOK) & ADMIN LOGIN
          ====================================================================== */}
          <footer className="border-t border-[var(--border-subtle)] bg-[var(--bg-footer)] transition-colors duration-300">
            <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-14 space-y-10">
              {/* Top Footer Row: Brand + Social Media Links */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-10 border-b border-[var(--border-subtle)]">
                <div className="space-y-2">
                  <span className="text-lg font-semibold tracking-tight text-[var(--text-primary)]">
                    * ArtbyMo
                  </span>
                  <p className="text-xs text-[var(--text-muted)] max-w-sm">
                    {publishedSiteContent.footerTagline}
                  </p>
                </div>

                {/* Social Media Links Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>Instagram</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={publishedSiteContent.studioWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>
                      WhatsApp ({publishedSiteContent.studioWhatsappDisplay})
                    </span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Music2 className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>TikTok</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Facebook className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>Facebook</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={socialLinks.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>X / Twitter</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={socialLinks.behance}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Palette className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>Behance</span>
                    <ArrowUpRight className="w-3 h-3 opacity-60" />
                  </a>

                  <a
                    href={`mailto:${publishedSiteContent.studioEmail}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[18px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                    <span>{publishedSiteContent.studioEmail}</span>
                  </a>
                </div>
              </div>

              {/* Bottom Footer Row: Copyright + Developer Credit + Navigation + Discreet Artist Admin Login */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-2">
                  <span>
                    © {new Date().getFullYear()} ArtbyMo. All rights reserved.
                  </span>

                  <span
                    aria-hidden="true"
                    className="text-[var(--border-strong)] select-none"
                  >
                    ·
                  </span>

                  {/* Responsive Developer Credit Link with Underlined Muted Glowing Rainbow Effect */}
                  <a
                    href="https://my-react-portfolio-six-vert.vercel.app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Visit Dayo's Digital Dynasty Portfolio"
                    className="inline-block pb-0.5 transition-opacity"
                  >
                    {/* Desktop / Big Screens: "Developed by Dayo's Digital Dynasty" */}
                    <span className="hidden lg:inline text-sm dynasty-rainbow-text">
                      Developed by Dayo&apos;s Digital Dynasty
                    </span>
                    {/* Tablet View: "Developed by Digital Dynasty" */}
                    <span className="hidden md:inline lg:hidden text-sm dynasty-rainbow-text">
                      Developed by Digital Dynasty
                    </span>
                    {/* Mobile Screens: "Developed by Dynasty" */}
                    <span className="inline md:hidden text-sm dynasty-rainbow-text">
                      Developed by Dynasty
                    </span>
                  </a>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-6">
                  <a
                    href="#works"
                    onClick={(e) => handleNavigateToSection('works', e)}
                    className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Exhibition
                  </a>
                  <a
                    href="#about"
                    onClick={(e) => handleNavigateToSection('about', e)}
                    className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Who I Am
                  </a>
                  <a
                    href="#contact"
                    onClick={(e) => handleNavigateToSection('contact', e)}
                    className="hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    Inquiries
                  </a>
                  <button
                    type="button"
                    onClick={() => setIsAdminViewOpen(true)}
                    className="inline-flex items-center gap-1.5 text-[var(--text-accent)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                  >
                    {isAdminAuthenticated ? (
                      <>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Artist Admin Dashboard</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        <span>Artist Admin Login</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </footer>

          {/* =====================================================================
              ARTWORK DETAILS LIGHTBOX MODAL (Read-Only for Visitors)
          ====================================================================== */}
          <AnimatePresence>
            {selectedArtwork && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-8 overflow-y-auto"
                onClick={() => {
                  setSelectedArtworkId(null);
                  setIsZoomed(false);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 12 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-6xl bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-[28px] overflow-hidden shadow-2xl grid grid-cols-1 lg:grid-cols-12 max-h-[90vh]"
                >
                  {/* Left 7 Columns: High-Res Image Viewer with Zoom & Prev/Next */}
                  <div className="lg:col-span-7 relative bg-[var(--bg-input)] flex items-center justify-center overflow-hidden min-h-[340px] sm:min-h-[480px] lg:min-h-[620px]">
                    <div
                      onClick={() => setIsZoomed((z) => !z)}
                      className={`w-full h-full flex items-center justify-center p-6 sm:p-10 transition-transform duration-500 cursor-zoom-in ${
                        isZoomed ? 'scale-150 cursor-zoom-out' : 'scale-100'
                      }`}
                    >
                      <ResilientArtworkImage
                        src={selectedArtwork.imageUrl}
                        alt={selectedArtwork.title}
                        title={selectedArtwork.title}
                        className="max-h-[72vh] w-auto object-contain rounded-[16px] shadow-md"
                      />
                    </div>

                    {/* Prev / Next Navigation Controls */}
                    <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between pointer-events-none">
                      <div className="flex items-center gap-2 pointer-events-auto">
                        <button
                          type="button"
                          onClick={() => navigateLightbox(-1)}
                          className="p-3 rounded-full bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-xs transition-colors cursor-pointer"
                          aria-label="Previous artwork"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateLightbox(1)}
                          className="p-3 rounded-full bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] shadow-xs transition-colors cursor-pointer"
                          aria-label="Next artwork"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsZoomed((z) => !z)}
                        className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-[20px] bg-[var(--bg-surface-solid)] hover:bg-[var(--bg-elevated)] text-[var(--text-primary)] text-xs font-medium border border-[var(--border-subtle)] shadow-xs transition-colors cursor-pointer"
                      >
                        {isZoomed ? (
                          <>
                            <ZoomOut className="w-3.5 h-3.5" />
                            <span>Reset Zoom</span>
                          </>
                        ) : (
                          <>
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>Zoom Detail</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Right 5 Columns: Read-Only Accession Details */}
                  <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-8">
                      {/* Top Modal Bar */}
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                          <span className="font-mono-spec">
                            {selectedArtwork.catalogNumber}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">
                            {selectedArtwork.category === 'physical'
                              ? 'Physical Collection'
                              : 'Digital Collection'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedArtworkId(null);
                            setIsZoomed(false);
                          }}
                          className="p-2.5 rounded-full bg-[var(--bg-input)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
                          aria-label="Close detail view"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Artwork Title, Year & Tags */}
                      <div>
                        <h2 className="font-editorial text-3xl sm:text-4xl text-[var(--text-primary)] leading-tight">
                          {selectedArtwork.title}
                        </h2>
                        <p className="font-mono-spec text-xs text-[var(--text-muted)] mt-2">
                          Created {selectedArtwork.year}
                        </p>
                        {selectedArtwork.tags &&
                          selectedArtwork.tags.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-accent)] mt-3">
                              {selectedArtwork.tags.map((tag, idx) => (
                                <React.Fragment key={tag}>
                                  {idx > 0 && <span aria-hidden="true">·</span>}
                                  <span>{tag}</span>
                                </React.Fragment>
                              ))}
                            </div>
                          )}
                      </div>

                      {/* Museum Accession Specification List */}
                      <dl className="divide-y divide-[var(--border-subtle)] border-y border-[var(--border-subtle)] text-xs">
                        <div className="py-3.5 flex items-center justify-between gap-4">
                          <dt className="text-[var(--text-muted)] flex items-center gap-2 shrink-0">
                            <Layers className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                            <span>Medium</span>
                          </dt>
                          <dd className="text-[var(--text-primary)] font-medium text-right">
                            {selectedArtwork.medium}
                          </dd>
                        </div>

                        <div className="py-3.5 flex items-center justify-between gap-4">
                          <dt className="text-[var(--text-muted)] flex items-center gap-2 shrink-0">
                            <Palette className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                            <span>Art Style</span>
                          </dt>
                          <dd className="text-[var(--text-primary)] font-medium text-right">
                            {selectedArtwork.artStyle}
                          </dd>
                        </div>

                        <div className="py-3.5 flex items-center justify-between gap-4">
                          <dt className="text-[var(--text-muted)] flex items-center gap-2 shrink-0">
                            <Brush className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                            <span>Paint / Tools</span>
                          </dt>
                          <dd className="text-[var(--text-primary)] font-medium text-right">
                            {selectedArtwork.paintUsed}
                          </dd>
                        </div>

                        <div className="py-3.5 flex items-center justify-between gap-4">
                          <dt className="text-[var(--text-muted)] flex items-center gap-2 shrink-0">
                            <Ruler className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                            <span>Dimensions</span>
                          </dt>
                          <dd className="text-[var(--text-primary)] font-mono-spec text-right">
                            {selectedArtwork.dimensions}
                          </dd>
                        </div>
                      </dl>

                      {/* Collapsible Process & Experience Write-Up Accordion */}
                      <div className="rounded-[20px] bg-[var(--bg-input)] border border-[var(--border-subtle)] p-5">
                        <button
                          type="button"
                          onClick={() => setIsDetailNotesOpen((o) => !o)}
                          className="w-full flex items-center justify-between text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                          aria-expanded={isDetailNotesOpen}
                        >
                          <span>Process & Artist Experience</span>
                          <ChevronDown
                            className={`w-4 h-4 text-[var(--text-muted)] transition-transform duration-200 ${
                              isDetailNotesOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        <AnimatePresence>
                          {isDetailNotesOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="pt-3 mt-3 border-t border-[var(--border-subtle)] max-h-40 overflow-y-auto">
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed whitespace-pre-line">
                                  {selectedArtwork.description}
                                </p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>

                    {/* Modal Footer CTA */}
                    <div className="pt-8 mt-8 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4">
                      <a
                        href="#contact"
                        onClick={(e) => {
                          setSelectedArtworkId(null);
                          setContactForm((prev) => ({
                            ...prev,
                            inquiryType: 'Acquisition',
                            message: `Inquiring about "${selectedArtwork.title}" (${selectedArtwork.catalogNumber}, ${selectedArtwork.dimensions}).`,
                          }));
                          handleNavigateToSection('contact', e);
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[20px] transition-colors cursor-pointer"
                      >
                        <span>Inquire About This Work</span>
                        <ArrowUpRight className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
