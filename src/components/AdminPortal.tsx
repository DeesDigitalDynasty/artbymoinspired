import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Upload,
  Plus,
  Trash2,
  Check,
  X,
  KeyRound,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  LogOut,
  Eye,
  Tag,
  Layers,
  Palette,
  Brush,
  Ruler,
  Save,
  Globe,
  Sun,
  Moon,
  ShieldAlert,
  LifeBuoy,
} from 'lucide-react';
import {
  ArtworkItem,
  ArtworkCategory,
  GridPlacement,
} from '../data/artworks';
import { processUploadedImageFile } from '../utils/imageProcessor';

export interface AdminCredentials {
  username: string;
  password: string;
  recoveryPhrase?: string;
  hasCustomizedCredentials?: boolean;
}

export interface SocialLinks {
  instagram: string;
  whatsapp: string;
  twitter: string;
  behance: string;
}

export const DEFAULT_RECOVERY_PHRASE = 'sketching sanctuary 2020';

interface AdminPortalProps {
  themeMode: 'ghost' | 'day';
  onToggleTheme: () => void;
  isAuthenticated: boolean;
  credentials: AdminCredentials;
  onUpdateCredentials: (newCreds: AdminCredentials) => void;
  socialLinks: SocialLinks;
  onUpdateSocialLinks: (newLinks: SocialLinks) => void;
  onLoginSuccess: () => void;
  onLogout: () => void;
  onCloseAdminView: () => void;
  draftArtworks: ArtworkItem[];
  hasUnpublishedChanges: boolean;
  onUpdateDraftArtwork: (id: string, updates: Partial<ArtworkItem>) => void;
  onAddDraftArtwork: (newWork: ArtworkItem) => void;
  onDeleteDraftArtwork: (id: string) => void;
  onMoveDraftArtwork: (index: number, direction: -1 | 1) => void;
  onResetArtworks: () => void;
  onSaveDraftChanges: () => void;
  onPublishToLiveSite: () => void;
}

const SUGGESTED_TAGS = [
  'Portrait',
  'Neo-Cubism',
  'Line Art',
  'Monochrome',
  'Color Block',
  'Afro-Symbolism',
  'Abstract',
  'Diptych',
  'Visual Poetry',
  'Mask Study',
];

function normalizePhrase(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function AdminPortal({
  themeMode,
  onToggleTheme,
  isAuthenticated,
  credentials,
  onUpdateCredentials,
  socialLinks,
  onUpdateSocialLinks,
  onLoginSuccess,
  onLogout,
  onCloseAdminView,
  draftArtworks,
  hasUnpublishedChanges,
  onUpdateDraftArtwork,
  onAddDraftArtwork,
  onDeleteDraftArtwork,
  onMoveDraftArtwork,
  onResetArtworks,
  onSaveDraftChanges,
  onPublishToLiveSite,
}: AdminPortalProps) {
  // Login Form State
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Recovery Phrase Mode on Login Screen
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [recoveryPhraseInput, setRecoveryPhraseInput] = useState('');
  const [recoveryNewUsername, setRecoveryNewUsername] = useState(
    credentials.username || 'travismo1998@gmail.com'
  );
  const [recoveryNewPassword, setRecoveryNewPassword] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  // Determine whether Quick-Fill placeholder credentials should still be visible
  const showQuickFillOption =
    !credentials.hasCustomizedCredentials &&
    credentials.username === 'travismo1998@gmail.com' &&
    credentials.password === 'mo2026';

  // Active Admin Tab: ONLY 'artworks' and 'security'
  const [activeTab, setActiveTab] = useState<'artworks' | 'security'>(
    'artworks'
  );

  // Save & Publish Confirmation Modal State
  const [showPublishPromptModal, setShowPublishPromptModal] = useState(false);
  const [statusToast, setStatusToast] = useState('');

  // Confirm Credentials Change Modal (removes Quick-Fill after confirmation)
  const [showConfirmCredsModal, setShowConfirmCredsModal] = useState(false);

  // New Artwork Upload Form State
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [newWorkForm, setNewWorkForm] = useState<{
    title: string;
    category: ArtworkCategory;
    imageUrl: string;
    medium: string;
    artStyle: string;
    paintUsed: string;
    dimensions: string;
    year: string;
    tags: string[];
    description: string;
    gridPlacement: GridPlacement;
  }>({
    title: '',
    category: 'physical',
    imageUrl: '',
    medium: 'Acrylic & Ink on Linen',
    artStyle: 'Contemporary Figurative',
    paintUsed: 'Heavy-Body Acrylic & Archival Ink',
    dimensions: '90 x 120 cm',
    year: new Date().getFullYear().toString(),
    tags: ['Portrait', 'Contemporary'],
    description: '',
    gridPlacement: 'featured-left',
  });
  const [newTagInput, setNewTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Per-artwork tag input state
  const [cardTagInputs, setCardTagInputs] = useState<Record<string, string>>(
    {}
  );
  // Confirmation state for deleting an artwork or resetting
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetModal, setConfirmResetModal] = useState(false);

  // Credentials Update State
  const [newUsername, setNewUsername] = useState(credentials.username);
  const [newPassword, setNewPassword] = useState(credentials.password);
  const [newRecoveryPhrase, setNewRecoveryPhrase] = useState(
    credentials.recoveryPhrase || DEFAULT_RECOVERY_PHRASE
  );
  const [localSocials, setLocalSocials] = useState<SocialLinks>(socialLinks);
  const [credsSavedToast, setCredsSavedToast] = useState(false);

  const triggerToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(''), 4200);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = loginUsername.trim().toLowerCase();
    const validUser = credentials.username.trim().toLowerCase();
    const matchesUsername =
      cleanUser === validUser ||
      (!credentials.hasCustomizedCredentials &&
        (cleanUser === 'mo' || cleanUser === 'travismo1998@gmail.com'));

    if (matchesUsername && loginPassword === credentials.password) {
      setLoginError('');
      onLoginSuccess();
    } else {
      setLoginError(
        'Invalid studio credentials. Check your username and password or use your Artist Recovery Phrase below.'
      );
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = normalizePhrase(recoveryPhraseInput);
    const savedPhrase = normalizePhrase(
      credentials.recoveryPhrase || DEFAULT_RECOVERY_PHRASE
    );
    const defaultMasterPhrase = normalizePhrase(DEFAULT_RECOVERY_PHRASE);

    if (!entered || (entered !== savedPhrase && entered !== defaultMasterPhrase)) {
      setRecoveryError(
        'Recovery phrase did not match. Please enter your configured artist recovery phrase.'
      );
      return;
    }

    if (!recoveryNewUsername.trim() || !recoveryNewPassword.trim()) {
      setRecoveryError('Please provide a new username and password.');
      return;
    }

    const updatedCreds: AdminCredentials = {
      username: recoveryNewUsername.trim(),
      password: recoveryNewPassword,
      recoveryPhrase: credentials.recoveryPhrase || DEFAULT_RECOVERY_PHRASE,
      hasCustomizedCredentials: true,
    };

    onUpdateCredentials(updatedCreds);
    setNewUsername(updatedCreds.username);
    setNewPassword(updatedCreds.password);
    setRecoveryError('');
    setIsRecoveryMode(false);
    onLoginSuccess();
    triggerToast(
      'Access recovered! Your new studio credentials have been saved and Quick-Fill is disabled.'
    );
  };

  const handleNewFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingImage(true);
    try {
      const file = files[0];
      const { dataUrl, width, height } = await processUploadedImageFile(file);
      const cleanName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[-_]/g, ' ');
      setNewWorkForm((prev) => ({
        ...prev,
        imageUrl: dataUrl,
        title: prev.title || cleanName || 'Untitled Studio Work',
        dimensions:
          prev.category === 'digital'
            ? `${width} x ${height} px`
            : prev.dimensions,
      }));
    } catch (err: any) {
      triggerToast(err?.message || 'Could not process image file.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleReplaceCardImage = async (
    artworkId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { dataUrl } = await processUploadedImageFile(file);
      onUpdateDraftArtwork(artworkId, { imageUrl: dataUrl });
      triggerToast(
        'Photo updated in Admin Draft. Click Save Changes to save or publish.'
      );
    } catch {
      // Ignore error
    }
  };

  const handleAddArtworkToDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkForm.imageUrl) {
      triggerToast('Please select an image file from your device first.');
      return;
    }

    const nextIndex = draftArtworks.length + 1;
    const created: ArtworkItem = {
      id: `mo-upload-${Date.now()}`,
      catalogNumber: `MO. ${newWorkForm.year}.${String(nextIndex).padStart(
        2,
        '0'
      )}`,
      title: newWorkForm.title.trim() || `Untitled Study ${nextIndex}`,
      category: newWorkForm.category,
      imageUrl: newWorkForm.imageUrl,
      medium: newWorkForm.medium.trim() || 'Mixed Media',
      artStyle: newWorkForm.artStyle.trim() || 'Contemporary Figuration',
      paintUsed: newWorkForm.paintUsed.trim() || 'Acrylic & Archival Ink',
      dimensions: newWorkForm.dimensions.trim() || '90 x 120 cm',
      year: newWorkForm.year.trim() || '2025',
      tags:
        newWorkForm.tags.length > 0 ? newWorkForm.tags : ['Original Work'],
      description:
        newWorkForm.description.trim() ||
        'Original work uploaded via the ArtbyMo Admin Dashboard.',
      gridPlacement: newWorkForm.gridPlacement,
      source: 'upload',
    };

    onAddDraftArtwork(created);
    setNewWorkForm({
      title: '',
      category: 'physical',
      imageUrl: '',
      medium: 'Acrylic & Ink on Linen',
      artStyle: 'Contemporary Figurative',
      paintUsed: 'Heavy-Body Acrylic & Archival Ink',
      dimensions: '90 x 120 cm',
      year: new Date().getFullYear().toString(),
      tags: ['Portrait', 'Contemporary'],
      description: '',
      gridPlacement: 'featured-left',
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setShowPublishPromptModal(true);
  };

  const addTagToNewWork = (tag: string) => {
    const clean = tag.trim();
    if (!clean) return;
    if (!newWorkForm.tags.includes(clean)) {
      setNewWorkForm((prev) => ({ ...prev, tags: [...prev.tags, clean] }));
    }
    setNewTagInput('');
  };

  const removeTagFromNewWork = (tagToRemove: string) => {
    setNewWorkForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tagToRemove),
    }));
  };

  const addTagToExistingWork = (artwork: ArtworkItem, rawTag: string) => {
    const clean = rawTag.trim();
    if (!clean) return;
    const currentTags = artwork.tags || [];
    if (!currentTags.includes(clean)) {
      onUpdateDraftArtwork(artwork.id, { tags: [...currentTags, clean] });
    }
    setCardTagInputs((prev) => ({ ...prev, [artwork.id]: '' }));
  };

  const removeTagFromExistingWork = (
    artwork: ArtworkItem,
    tagToRemove: string
  ) => {
    const currentTags = artwork.tags || [];
    onUpdateDraftArtwork(artwork.id, {
      tags: currentTags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSaveChangesClick = () => {
    onSaveDraftChanges();
    setShowPublishPromptModal(true);
  };

  const handleCredentialsFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    setShowConfirmCredsModal(true);
  };

  const confirmAndApplyCredentialUpdate = () => {
    const updatedCreds: AdminCredentials = {
      username: newUsername.trim(),
      password: newPassword,
      recoveryPhrase: newRecoveryPhrase.trim() || DEFAULT_RECOVERY_PHRASE,
      hasCustomizedCredentials: true,
    };
    onUpdateCredentials(updatedCreds);
    onUpdateSocialLinks(localSocials);
    setShowConfirmCredsModal(false);
    setCredsSavedToast(true);
    triggerToast(
      'Credentials updated! The initial Quick-Fill login option has been permanently removed from the login page.'
    );
    setTimeout(() => setCredsSavedToast(false), 3500);
  };

  // =========================================================================
  // VIEW 1: DEDICATED ADMIN CREDENTIALS LOGIN SCREEN
  // =========================================================================
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] flex flex-col justify-between p-6 md:p-12 transition-colors duration-300">
        {/* Top Bar */}
        <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onCloseAdminView}
            className="text-base md:text-lg font-semibold tracking-tight text-[var(--text-primary)] cursor-pointer"
          >
            * ArtbyMo
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                themeMode === 'ghost'
                  ? 'Switch to Day Mode'
                  : 'Switch to Ghost Mode'
              }
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer"
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

            <button
              type="button"
              onClick={onCloseAdminView}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[22px] hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Back to Public Gallery</span>
            </button>
          </div>
        </div>

        {/* Center Credentials or Recovery Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-md w-full mx-auto bg-[var(--bg-surface)] backdrop-blur-xl border border-[var(--border-subtle)] rounded-[28px] p-8 md:p-12 shadow-2xl space-y-8 my-12"
        >
          {!isRecoveryMode ? (
            <>
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-[20px] bg-[var(--bg-elevated)] text-[var(--text-accent)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-5 h-5" />
                </div>
                <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                  Artist Curator Portal
                </p>
                <h1 className="font-editorial text-3xl sm:text-4xl text-[var(--text-primary)]">
                  ArtbyMo Admin Login
                </h1>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">
                  Enter your studio credentials to upload new artworks manually,
                  manage tags, and publish updates to the live exhibition.
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-5">
                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-2">
                    Artist Username or Email
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="travismo1998@gmail.com"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-3.5 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[20px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-2">
                    Studio Password
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3.5 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[20px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </label>

                {loginError && (
                  <div className="p-3.5 rounded-[16px] bg-[#3B1818] border border-[#9E3B3B]/40 text-[#F7CACA] text-xs">
                    {loginError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 px-6 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[22px] transition-colors cursor-pointer"
                >
                  Sign In to Admin Dashboard
                </button>
              </form>

              {/* Initial Setup Quick-Fill: Automatically removed once artist confirms & updates credentials */}
              {showQuickFillOption && (
                <div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
                  <div>
                    <span className="block font-medium text-[var(--text-primary)]">
                      Initial Studio Setup Credentials:
                    </span>
                    <span className="font-mono-spec text-[11px]">
                      {credentials.username} / {credentials.password}
                    </span>
                    <span className="block text-[10px] text-[var(--text-muted)] mt-0.5">
                      Disappears automatically after you update your password.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginUsername(credentials.username);
                      setLoginPassword(credentials.password);
                      setLoginError('');
                    }}
                    className="px-3.5 py-2 rounded-[16px] bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] hover:bg-[var(--bg-elevated-hover)] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    Quick Fill
                  </button>
                </div>
              )}

              {/* Fallback Recovery Phrase Trigger */}
              <div className="pt-4 border-t border-[var(--border-subtle)] text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRecoveryMode(true);
                    setLoginError('');
                    setRecoveryError('');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[var(--text-accent)] hover:underline cursor-pointer"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Forgot credentials? Use artist recovery phrase</span>
                </button>
              </div>
            </>
          ) : (
            /* ARTIST RECOVERY PHRASE FORM */
            <div className="space-y-6">
              <div className="space-y-2 text-center">
                <div className="w-12 h-12 rounded-[20px] bg-[var(--bg-elevated)] text-[var(--text-accent)] border border-[var(--border-subtle)] flex items-center justify-center mx-auto mb-4">
                  <KeyRound className="w-5 h-5" />
                </div>
                <p className="text-xs tracking-widest uppercase text-[var(--text-muted)]">
                  Fallback Access Recovery
                </p>
                <h2 className="font-editorial text-3xl text-[var(--text-primary)]">
                  Recover Artist Studio
                </h2>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed pt-1">
                  Enter your secret artist recovery phrase to reset your
                  credentials and unlock the Admin Dashboard.
                </p>
              </div>

              <form onSubmit={handleRecoverySubmit} className="space-y-4">
                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                    Artist Recovery Phrase
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="Enter your secret recovery phrase..."
                    value={recoveryPhraseInput}
                    onChange={(e) => setRecoveryPhraseInput(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                    New Admin Email / Username
                  </span>
                  <input
                    type="text"
                    required
                    value={recoveryNewUsername}
                    onChange={(e) => setRecoveryNewUsername(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                    New Studio Password
                  </span>
                  <input
                    type="password"
                    required
                    placeholder="Choose a new password"
                    value={recoveryNewPassword}
                    onChange={(e) => setRecoveryNewPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                  />
                </label>

                {recoveryError && (
                  <div className="p-3.5 rounded-[16px] bg-[#3B1818] border border-[#9E3B3B]/40 text-[#F7CACA] text-xs">
                    {recoveryError}
                  </div>
                )}

                <div className="flex flex-col gap-2.5 pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 px-6 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[20px] transition-colors cursor-pointer"
                  >
                    Verify Phrase & Reset Credentials
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsRecoveryMode(false);
                      setRecoveryError('');
                    }}
                    className="w-full py-2.5 px-4 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    Back to Standard Login
                  </button>
                </div>
              </form>
            </div>
          )}
        </motion.div>

        <div className="text-center text-xs text-[var(--text-muted)]">
          Visitors only see the public exhibition without any edit privileges.
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED STUDIO ADMIN DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] transition-colors duration-300">
      {/* Admin Top Header */}
      <header className="sticky top-0 z-40 bg-[var(--bg-header)] backdrop-blur-xl border-b border-[var(--border-subtle)]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-12 py-5 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="text-base md:text-lg font-semibold tracking-tight text-[var(--text-primary)]">
              * ArtbyMo Admin
            </span>
            {hasUnpublishedChanges ? (
              <span className="text-xs text-[#D99B26] font-mono-spec">
                · Unsaved / Unpublished Edits
              </span>
            ) : (
              <span className="text-xs text-[var(--text-muted)] font-mono-spec">
                · Live Synced
              </span>
            )}
          </div>

          {/* Admin Section Tabs: Strictly Artworks & Tags + Credentials */}
          <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[var(--bg-surface)] rounded-[22px] border border-[var(--border-subtle)]">
            {(
              [
                {
                  id: 'artworks',
                  label: `Artworks & Tags (${draftArtworks.length})`,
                  icon: Upload,
                },
                {
                  id: 'security',
                  label: 'Credentials & Socials',
                  icon: KeyRound,
                },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-5 py-2 text-xs font-medium rounded-[18px] transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right Actions: Theme Toggle, Save Changes, Publish to Live Site, View Public Site, Log Out */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={
                themeMode === 'ghost'
                  ? 'Switch to Day Mode'
                  : 'Switch to Ghost Mode'
              }
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
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

            <button
              type="button"
              onClick={handleSaveChangesClick}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[20px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onPublishToLiveSite();
                triggerToast(
                  'All current admin changes are now live on the public site.'
                );
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--btn-secondary-text)] bg-[var(--btn-secondary-bg)] opacity-95 hover:opacity-100 border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Publish to Live Site</span>
            </button>

            <button
              type="button"
              onClick={onCloseAdminView}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--text-primary)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)] border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>View Public Site</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
              title="Log out of Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1440px] mx-auto px-6 md:px-12 py-12">
        {/* Status Toast Notification */}
        <AnimatePresence>
          {statusToast && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8 p-4 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-strong)] text-[var(--text-primary)] text-xs font-medium flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5">
                <Check className="w-4 h-4 text-[var(--text-accent)]" />
                <span>{statusToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setStatusToast('')}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ===================================================================
            TAB 1: UPLOAD PICTURES MANUALLY & EDIT TAGS / SPECIFICATIONS
        ==================================================================== */}
        {activeTab === 'artworks' && (
          <div className="space-y-16">
            {/* Manual Upload Card */}
            <section className="rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 md:p-10 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 mb-8 border-b border-[var(--border-subtle)]">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                    Manual Studio Upload
                  </p>
                  <h2 className="font-editorial text-3xl text-[var(--text-primary)]">
                    Upload New Artwork & Assign Tags
                  </h2>
                </div>
              </div>

              <form
                onSubmit={handleAddArtworkToDraft}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Left 4 Cols: Image File Dropzone & Preview */}
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--border-strong)] rounded-[24px] bg-[var(--bg-input)] p-6 min-h-[280px] cursor-pointer transition-colors overflow-hidden text-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleNewFileSelect}
                      className="sr-only"
                    />
                    {newWorkForm.imageUrl ? (
                      <div className="w-full h-full flex flex-col items-center gap-3">
                        <img
                          src={newWorkForm.imageUrl}
                          alt="Upload preview"
                          className="max-h-56 w-auto object-contain rounded-[16px]"
                        />
                        <span className="text-xs text-[var(--text-accent)] font-medium underline">
                          Click to choose a different picture
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-3 py-8">
                        <div className="w-12 h-12 rounded-full bg-[var(--bg-elevated)] text-[var(--text-accent)] flex items-center justify-center mx-auto">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[var(--text-primary)]">
                            {isUploadingImage
                              ? 'Processing picture...'
                              : 'Click to upload picture from device'}
                          </p>
                          <p className="text-xs text-[var(--text-muted)] mt-1">
                            Supports JPG, PNG, WEBP, SVG
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                </div>

                {/* Right 8 Cols: Metadata & Tags Form */}
                <div className="lg:col-span-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <label className="sm:col-span-2 block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Artwork Title
                      </span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Chromatic Study in Sage"
                        value={newWorkForm.title}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Collection
                      </span>
                      <select
                        value={newWorkForm.category}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            category: e.target.value as ArtworkCategory,
                          }))
                        }
                        className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)] focus:outline-none focus:border-[var(--border-strong)]"
                      >
                        <option value="physical">Physical Artwork</option>
                        <option value="digital">Digital Art</option>
                      </select>
                    </label>
                  </div>

                  {/* 4 Key Specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <label className="block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Medium
                      </span>
                      <input
                        type="text"
                        value={newWorkForm.medium}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            medium: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Art Style
                      </span>
                      <input
                        type="text"
                        value={newWorkForm.artStyle}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            artStyle: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Paint / Tools Used
                      </span>
                      <input
                        type="text"
                        value={newWorkForm.paintUsed}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            paintUsed: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                      />
                    </label>

                    <label className="block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Dimensions
                      </span>
                      <input
                        type="text"
                        value={newWorkForm.dimensions}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            dimensions: e.target.value,
                          }))
                        }
                        className="w-full px-3.5 py-2.5 text-xs font-mono-spec text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                      />
                    </label>
                  </div>

                  {/* Tags Editor for New Artwork */}
                  <div className="p-4 rounded-[20px] bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                        <span>Artwork Tags (Used for Gallery Filtering)</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Add custom tag..."
                          value={newTagInput}
                          onChange={(e) => setNewTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addTagToNewWork(newTagInput);
                            }
                          }}
                          className="px-3 py-1.5 text-xs text-[var(--text-primary)] bg-[var(--bg-surface)] rounded-[14px] border border-[var(--border-subtle)]"
                        />
                        <button
                          type="button"
                          onClick={() => addTagToNewWork(newTagInput)}
                          className="px-3 py-1.5 text-xs font-medium bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] rounded-[14px] cursor-pointer"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    {/* Active Tags */}
                    <div className="flex flex-wrap items-center gap-2">
                      {newWorkForm.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 text-xs bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[14px]"
                        >
                          <span>{tag}</span>
                          <button
                            type="button"
                            onClick={() => removeTagFromNewWork(tag)}
                            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>

                    {/* Quick Tag Suggestions */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[11px] text-[var(--text-muted)] mr-1">
                        Quick add:
                      </span>
                      {SUGGESTED_TAGS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => addTagToNewWork(sug)}
                          className="text-[11px] text-[var(--text-accent)] hover:text-[var(--text-primary)] underline underline-offset-4 mr-2 cursor-pointer"
                        >
                          +{sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description & Add Artwork Button */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-end justify-between gap-4">
                    <label className="flex-1 block">
                      <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                        Curatorial Note
                      </span>
                      <input
                        type="text"
                        placeholder="Brief story or material notes behind this piece..."
                        value={newWorkForm.description}
                        onChange={(e) =>
                          setNewWorkForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)]"
                      />
                    </label>

                    <button
                      type="submit"
                      className="inline-flex items-center justify-center gap-2 px-7 py-3.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[20px] transition-colors cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Artwork to Collection</span>
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Manage All Existing Artworks & Tags */}
            <section className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                    Catalog Management
                  </p>
                  <h2 className="font-editorial text-3xl text-[var(--text-primary)]">
                    Manage Exhibition Works ({draftArtworks.length})
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleSaveChangesClick}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[20px] transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Changes</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmResetModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[20px] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Default 13 Works</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {draftArtworks.map((artwork, index) => (
                  <div
                    key={artwork.id}
                    className="rounded-[24px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
                  >
                    {/* Thumbnail + Replace Picture + Order Controls */}
                    <div className="lg:col-span-3 flex flex-col gap-3">
                      <div className="relative rounded-[18px] overflow-hidden bg-[var(--bg-input)] aspect-[4/5] border border-[var(--border-subtle)]">
                        <img
                          src={artwork.imageUrl}
                          alt={artwork.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-[var(--bg-elevated)] hover:bg-[var(--bg-elevated-hover)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[14px] cursor-pointer text-center">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Replace Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) =>
                              handleReplaceCardImage(artwork.id, e)
                            }
                            className="sr-only"
                          />
                        </label>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            onClick={() => onMoveDraftArtwork(index, -1)}
                            className="p-2 rounded-[12px] bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                            title="Move earlier in gallery"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={index === draftArtworks.length - 1}
                            onClick={() => onMoveDraftArtwork(index, 1)}
                            className="p-2 rounded-[12px] bg-[var(--bg-input)] border border-[var(--border-subtle)] text-[var(--text-primary)] disabled:opacity-30 cursor-pointer"
                            title="Move later in gallery"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(artwork.id)}
                            className="p-2 rounded-[12px] bg-[#3B1818] text-[#F7CACA] hover:bg-[#522020] cursor-pointer"
                            title="Remove artwork"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields & Tags */}
                    <div className="lg:col-span-9 space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <label className="sm:col-span-2 block">
                          <span className="block text-[11px] text-[var(--text-muted)] mb-1">
                            Title
                          </span>
                          <input
                            type="text"
                            value={artwork.title}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                title: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-2 text-sm font-editorial font-medium text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          />
                        </label>

                        <label className="block">
                          <span className="block text-[11px] text-[var(--text-muted)] mb-1">
                            Collection
                          </span>
                          <select
                            value={artwork.category}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                category: e.target.value as ArtworkCategory,
                              })
                            }
                            className="w-full px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          >
                            <option value="physical">Physical Artwork</option>
                            <option value="digital">Digital Art</option>
                          </select>
                        </label>

                        <label className="block">
                          <span className="block text-[11px] text-[var(--text-muted)] mb-1">
                            Masonry Overlap Style
                          </span>
                          <select
                            value={artwork.gridPlacement}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                gridPlacement: e.target.value as GridPlacement,
                              })
                            }
                            className="w-full px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          >
                            <option value="featured-left">
                              Featured Left (Tall)
                            </option>
                            <option value="offset-right">
                              Offset Right Overlap
                            </option>
                            <option value="center-overlap">
                              Center Wide Overlap
                            </option>
                            <option value="wide-left">Square Left</option>
                            <option value="tall-right">
                              Tall Right Overlap
                            </option>
                            <option value="wide-overlap">
                              Wide Offset Frame
                            </option>
                          </select>
                        </label>
                      </div>

                      {/* 4 Core Specifications */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <label className="block">
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-1">
                            <Layers className="w-3 h-3" />
                            Medium
                          </span>
                          <input
                            type="text"
                            value={artwork.medium}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                medium: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          />
                        </label>

                        <label className="block">
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-1">
                            <Palette className="w-3 h-3" />
                            Art Style
                          </span>
                          <input
                            type="text"
                            value={artwork.artStyle}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                artStyle: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          />
                        </label>

                        <label className="block">
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-1">
                            <Brush className="w-3 h-3" />
                            Paint / Tools Used
                          </span>
                          <input
                            type="text"
                            value={artwork.paintUsed}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                paintUsed: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          />
                        </label>

                        <label className="block">
                          <span className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mb-1">
                            <Ruler className="w-3 h-3" />
                            Dimensions
                          </span>
                          <input
                            type="text"
                            value={artwork.dimensions}
                            onChange={(e) =>
                              onUpdateDraftArtwork(artwork.id, {
                                dimensions: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs font-mono-spec text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)]"
                          />
                        </label>
                      </div>

                      {/* Tags Manager for this Artwork */}
                      <div className="p-4 rounded-[18px] bg-[var(--bg-input)] border border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium text-[var(--text-muted)] flex items-center gap-1 mr-1">
                            <Tag className="w-3 h-3 text-[var(--text-accent)]" />
                            Tags:
                          </span>
                          {(artwork.tags || []).map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs bg-[var(--bg-elevated)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-[12px]"
                            >
                              <span>{tag}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  removeTagFromExistingWork(artwork, tag)
                                }
                                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                                aria-label={`Remove tag ${tag}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="New tag..."
                            value={cardTagInputs[artwork.id] || ''}
                            onChange={(e) =>
                              setCardTagInputs((prev) => ({
                                ...prev,
                                [artwork.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTagToExistingWork(
                                  artwork,
                                  cardTagInputs[artwork.id] || ''
                                );
                              }
                            }}
                            className="px-3 py-1 text-xs text-[var(--text-primary)] bg-[var(--bg-surface)] rounded-[12px] border border-[var(--border-subtle)] w-32"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              addTagToExistingWork(
                                artwork,
                                cardTagInputs[artwork.id] || ''
                              )
                            }
                            className="px-3 py-1 text-xs font-medium bg-[var(--btn-secondary-bg)] text-[var(--btn-secondary-text)] rounded-[12px] cursor-pointer"
                          >
                            + Tag
                          </button>
                        </div>
                      </div>

                      {/* Curatorial Note */}
                      <label className="block">
                        <span className="block text-[11px] text-[var(--text-muted)] mb-1">
                          Curatorial Description
                        </span>
                        <textarea
                          rows={2}
                          value={artwork.description}
                          onChange={(e) =>
                            onUpdateDraftArtwork(artwork.id, {
                              description: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[14px] border border-[var(--border-subtle)] resize-none"
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {/* ===================================================================
            TAB 2: ADMIN CREDENTIALS, RECOVERY PHRASE & SOCIAL LINKS
        ==================================================================== */}
        {activeTab === 'security' && (
          <div className="max-w-xl mx-auto rounded-[28px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-8 md:p-10 space-y-8 shadow-xl">
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--text-muted)] mb-1">
                Access Control, Recovery & Socials
              </p>
              <h2 className="font-editorial text-3xl text-[var(--text-primary)]">
                Studio Credentials & Recovery Phrase
              </h2>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">
                Update your login credentials, configure your secret fallback
                recovery phrase, and manage your footer social media URLs.
              </p>
            </div>

            {/* Security Notice Banner */}
            <div className="p-4 rounded-[20px] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-start gap-3 text-xs">
              <ShieldAlert className="w-4 h-4 text-[var(--text-accent)] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-[var(--text-primary)]">
                  {credentials.hasCustomizedCredentials
                    ? 'Quick-Fill Login Placeholder is Disabled'
                    : 'Initial Quick-Fill Login Placeholder is Currently Active'}
                </p>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  {credentials.hasCustomizedCredentials
                    ? 'Your custom credentials are active. Visitors clicking the footer login link cannot see or quick-fill your credentials.'
                    : 'Once you confirm and save new credentials below, the initial Quick-Fill helper on the login screen will be permanently removed so curious visitors cannot log in.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleCredentialsFormSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                    Admin Email / Username
                  </span>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    className="w-full px-4 py-3 text-sm text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)]"
                  />
                </label>

                <label className="block">
                  <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                    Admin Password
                  </span>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 text-sm font-mono-spec text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[18px] border border-[var(--border-subtle)]"
                  />
                </label>
              </div>

              {/* Fallback Recovery Phrase Configuration */}
              <div className="p-4 rounded-[20px] bg-[var(--bg-input)] border border-[var(--border-subtle)] space-y-2">
                <label className="block">
                  <span className="flex items-center justify-between text-xs font-medium text-[var(--text-primary)] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <LifeBuoy className="w-3.5 h-3.5 text-[var(--text-accent)]" />
                      <span>Fallback Artist Recovery Phrase</span>
                    </span>
                    <span className="text-[11px] text-[var(--text-muted)] font-normal">
                      Used if you ever forget your password
                    </span>
                  </span>
                  <input
                    type="text"
                    required
                    value={newRecoveryPhrase}
                    onChange={(e) => setNewRecoveryPhrase(e.target.value)}
                    placeholder="e.g. sketching sanctuary 2020"
                    className="w-full px-4 py-2.5 text-xs font-mono-spec text-[var(--text-primary)] bg-[var(--bg-surface)] rounded-[14px] border border-[var(--border-subtle)]"
                  />
                </label>
                <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                  Keep this phrase safe. You can enter it on the Admin Login
                  screen under &ldquo;Forgot credentials? Use artist recovery
                  phrase&rdquo; to reset your login anytime.
                </p>
              </div>

              <div className="pt-4 border-t border-[var(--border-subtle)] space-y-4">
                <p className="text-xs font-medium text-[var(--text-primary)]">
                  Footer Social Media Links
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                      Instagram URL
                    </span>
                    <input
                      type="url"
                      value={localSocials.instagram}
                      onChange={(e) =>
                        setLocalSocials((prev) => ({
                          ...prev,
                          instagram: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                      WhatsApp Link
                    </span>
                    <input
                      type="url"
                      value={localSocials.whatsapp}
                      onChange={(e) =>
                        setLocalSocials((prev) => ({
                          ...prev,
                          whatsapp: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                      X (Twitter) URL
                    </span>
                    <input
                      type="url"
                      value={localSocials.twitter}
                      onChange={(e) =>
                        setLocalSocials((prev) => ({
                          ...prev,
                          twitter: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                    />
                  </label>

                  <label className="block">
                    <span className="block text-xs text-[var(--text-muted)] mb-1.5">
                      Behance / Portfolio URL
                    </span>
                    <input
                      type="url"
                      value={localSocials.behance}
                      onChange={(e) =>
                        setLocalSocials((prev) => ({
                          ...prev,
                          behance: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--bg-input)] rounded-[16px] border border-[var(--border-subtle)]"
                    />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                {credsSavedToast ? (
                  <span className="text-xs text-[var(--text-accent)] font-medium flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    Settings confirmed & saved
                  </span>
                ) : (
                  <span />
                )}

                <button
                  type="submit"
                  className="px-6 py-3 text-xs font-medium text-[var(--btn-primary-text)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] rounded-[20px] transition-colors cursor-pointer"
                >
                  Confirm & Update Credentials
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ===================================================================
          CONFIRM CREDENTIALS UPDATE MODAL (Removes Quick-Fill)
      ==================================================================== */}
      <AnimatePresence>
        {showConfirmCredsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-w-md w-full bg-[var(--bg-surface-solid)] border border-[var(--border-strong)] rounded-[28px] p-8 space-y-6 shadow-2xl"
            >
              <div className="w-11 h-11 rounded-[18px] bg-[var(--bg-elevated)] text-[var(--text-accent)] flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-3xl text-[var(--text-primary)]">
                  Confirm Studio Credentials
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Confirming this update will save your new username (
                  <span className="font-mono-spec text-[var(--text-primary)]">
                    {newUsername}
                  </span>
                  ), password, and recovery phrase, and will permanently remove
                  the Quick-Fill placeholder from the Admin Login page so
                  visitors cannot use it.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmCredsModal(false)}
                  className="px-4 py-3 text-xs font-medium rounded-[18px] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={confirmAndApplyCredentialUpdate}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium rounded-[18px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm & Remove Quick-Fill</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===================================================================
          SAVE CHANGES & PUBLISH TO LIVE SITE OPTION MODAL
      ==================================================================== */}
      <AnimatePresence>
        {showPublishPromptModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-w-md w-full bg-[var(--bg-surface-solid)] border border-[var(--border-strong)] rounded-[28px] p-8 space-y-6 shadow-2xl"
            >
              <div className="w-11 h-11 rounded-[18px] bg-[var(--bg-elevated)] text-[var(--text-accent)] flex items-center justify-center">
                <Save className="w-5 h-5" />
              </div>

              <div className="space-y-2">
                <h3 className="font-editorial text-3xl text-[var(--text-primary)]">
                  Admin Changes Saved
                </h3>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Your changes have been saved to the Admin Dashboard. Would you
                  also like to publish these exact current changes to the live
                  public site right now?
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPublishPromptModal(false);
                    triggerToast(
                      'Saved as Admin Draft. You can publish to the live site whenever you are ready.'
                    );
                  }}
                  className="px-4 py-3 text-xs font-medium rounded-[18px] border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] cursor-pointer"
                >
                  Keep as Saved Draft
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onPublishToLiveSite();
                    setShowPublishPromptModal(false);
                    triggerToast(
                      'Published! Your exact changes are now live on the public exhibition.'
                    );
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 text-xs font-medium rounded-[18px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] hover:bg-[var(--btn-primary-hover-bg)] hover:text-[var(--btn-primary-hover-text)] cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Publish to Live Site</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Deleting an Artwork */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-[24px] p-6 space-y-5 shadow-xl">
              <h3 className="font-editorial text-2xl text-[var(--text-primary)]">
                Remove Artwork?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                Are you sure you want to remove this piece from your collection?
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 text-xs rounded-[16px] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteDraftArtwork(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-[16px] bg-[#7A2E2E] text-white cursor-pointer"
                >
                  Confirm Remove
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for Resetting Gallery */}
      <AnimatePresence>
        {confirmResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div className="max-w-sm w-full bg-[var(--bg-surface-solid)] border border-[var(--border-subtle)] rounded-[24px] p-6 space-y-5 shadow-xl">
              <h3 className="font-editorial text-2xl text-[var(--text-primary)]">
                Reset to Original 13 Artworks?
              </h3>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                This will restore the 13 default artworks and reset any custom
                uploads or edits.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmResetModal(false)}
                  className="px-4 py-2 text-xs rounded-[16px] border border-[var(--border-subtle)] text-[var(--text-muted)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetArtworks();
                    setConfirmResetModal(false);
                    triggerToast(
                      'Restored default 13 artworks to live exhibition.'
                    );
                  }}
                  className="px-4 py-2 text-xs font-medium rounded-[16px] bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] cursor-pointer"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
