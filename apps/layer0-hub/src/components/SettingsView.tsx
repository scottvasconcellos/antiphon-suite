import { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardHeader, Input, Button } from "@antiphon/design-system/components";
import type { HubSession } from "../domain/types";
import { isFirebaseConfigured } from "../config/firebaseConfig";
import type { User } from "firebase/auth";
import {
  subscribeToAuthState,
  updateProfileDisplayName,
  updateProfilePhotoURL,
  sendEmailChangeVerification,
  sendPhoneVerificationCode,
  confirmPhoneAndUpdate
} from "../services/firebaseAuth";

const STORAGE_KEY_PREFIX = "antiphon.manager.paths.";
const DEFAULT_DOWNLOAD = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
  ? "/Users/Shared/Downloads"
  : typeof navigator !== "undefined" && /Win/.test(navigator.userAgent)
    ? "Downloads"
    : "~/Downloads";
const DEFAULT_APP = "~/.antiphon/apps";
const DEFAULT_CONTENT = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.userAgent)
  ? "/Users/Shared"
  : typeof navigator !== "undefined" && /Win/.test(navigator.userAgent)
    ? "Music"
    : "~/Music";

function loadPath(key: string, fallback: string): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return v ?? fallback;
  } catch {
    return fallback;
  }
}

function savePath(key: string, value: string): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, value);
  } catch {
    /* ignore */
  }
}

type SettingsViewProps = {
  session: HubSession | null;
  onSignOut: () => void;
  onSessionUpdate?: (session: HubSession) => void;
};

export function SettingsView({ session, onSignOut, onSessionUpdate }: SettingsViewProps) {
  const [downloadPath, setDownloadPath] = useState(() => loadPath("download", DEFAULT_DOWNLOAD));
  const [appPath, setAppPath] = useState(() => loadPath("app", DEFAULT_APP));
  const [contentPath, setContentPath] = useState(() => loadPath("content", DEFAULT_CONTENT));
  const [displayNameEdit, setDisplayNameEdit] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null | undefined>(undefined);
  const [photoCropPreview, setPhotoCropPreview] = useState<string | null>(null);
  const [photoCropDims, setPhotoCropDims] = useState<{ w: number; h: number } | null>(null);
  const [photoCropZoom, setPhotoCropZoom] = useState(1);
  const [photoCropOffset, setPhotoCropOffset] = useState({ x: 0, y: 0 });
  const [photoCropFile, setPhotoCropFile] = useState<File | null>(null);
  const photoCropDragRef = useRef({ isDragging: false, startX: 0, startY: 0, startOffset: { x: 0, y: 0 } });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [launchAtLogin, setLaunchAtLoginState] = useState(false);
  const [closeToTray, setCloseToTrayState] = useState(false);
  const [autoInstallUpdates, setAutoInstallUpdatesState] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<"idle" | "available" | "ready" | "error">("idle");
  const [updateError, setUpdateError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recaptchaPhoneRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firebase auth state so profile section appears when user is restored (e.g. after refresh with Google sign-in).
  useEffect(() => {
    if (!session || !isFirebaseConfigured()) {
      setFirebaseUser(undefined);
      return;
    }
    const unsubscribe = subscribeToAuthState((user) => setFirebaseUser(user));
    return unsubscribe;
  }, [session]);

  useEffect(() => {
    savePath("download", downloadPath);
  }, [downloadPath]);
  useEffect(() => {
    savePath("app", appPath);
  }, [appPath]);
  useEffect(() => {
    savePath("content", contentPath);
  }, [contentPath]);

  useEffect(() => {
    if (session) setDisplayNameEdit(session.displayName || "");
  }, [session?.displayName]);
  useEffect(() => {
    if (firebaseUser?.displayName != null) setDisplayNameEdit(firebaseUser.displayName);
  }, [firebaseUser?.displayName]);

  // Sync session with Firebase user once when auth state is ready (e.g. Google photo/displayName for topbar).
  const hasSyncedFirebaseRef = useRef(false);
  useEffect(() => {
    if (!session || !firebaseUser || !onSessionUpdate || hasSyncedFirebaseRef.current) return;
    const name = firebaseUser.displayName ?? session.displayName;
    const photo = firebaseUser.photoURL ?? session.photoURL;
    if (name !== session.displayName || photo !== session.photoURL) {
      hasSyncedFirebaseRef.current = true;
      onSessionUpdate({ ...session, displayName: name || session.displayName, photoURL: photo ?? session.photoURL });
    }
  }, [session, firebaseUser, onSessionUpdate]);
  useEffect(() => {
    if (!firebaseUser) hasSyncedFirebaseRef.current = false;
  }, [firebaseUser]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.electron) {
      window.electron.getLaunchAtLogin().then(setLaunchAtLoginState);
      window.electron.getCloseToTray().then(setCloseToTrayState);
      window.electron.getAutoInstallUpdates().then(setAutoInstallUpdatesState);
      window.electron.setUpdateCallback((status, errorMessage) => {
        setUpdateStatus(status);
        setUpdateError(errorMessage ?? null);
      });
    }
  }, []);

  const handleBrowse = useCallback(async (field: "download" | "app" | "content") => {
    try {
      if ("showDirectoryPicker" in window) {
        const dir = await (window as Window & { showDirectoryPicker?: () => Promise<{ name: string }> }).showDirectoryPicker?.();
        const name = dir?.name ?? "";
        if (name) {
          if (field === "download") setDownloadPath(name);
          else if (field === "app") setAppPath(name);
          else setContentPath(name);
        }
      } else {
        const input = document.createElement("input");
        input.type = "file";
        (input as HTMLInputElement & { webkitdirectory?: boolean }).webkitdirectory = true;
        input.onchange = () => {
          const first = input.files?.[0];
          const rel = first?.webkitRelativePath ?? "";
          const path = rel ? rel.split("/")[0] ?? "" : "";
          if (path) {
            if (field === "download") setDownloadPath(path);
            else if (field === "app") setAppPath(path);
            else setContentPath(path);
          }
        };
        input.click();
      }
    } catch {
      /* User cancelled or API not available; path remains editable */
    }
  }, []);

  const handleRestoreDefaults = useCallback(() => {
    setDownloadPath(DEFAULT_DOWNLOAD);
    setAppPath(DEFAULT_APP);
    setContentPath(DEFAULT_CONTENT);
  }, []);

  const firebaseReady = firebaseUser !== undefined;
  const useFirebaseProfile = isFirebaseConfigured() && firebaseReady && firebaseUser !== null;

  const handleSaveDisplayName = useCallback(async () => {
    if (!firebaseUser || profileBusy) return;
    const name = displayNameEdit.trim();
    if (!name) return;
    setProfileMessage(null);
    setProfileBusy(true);
    try {
      await updateProfileDisplayName(firebaseUser, name);
      setProfileMessage({ type: "success", text: "Display name updated." });
      onSessionUpdate?.({ ...session!, displayName: name });
    } catch (e) {
      setProfileMessage({ type: "error", text: e instanceof Error ? e.message : "Update failed." });
    } finally {
      setProfileBusy(false);
    }
  }, [firebaseUser, displayNameEdit, profileBusy, session, onSessionUpdate]);

  const handlePhotoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser || !session || profileBusy) return;
    if (!file.type.startsWith("image/")) {
      setProfileMessage({ type: "error", text: "Please choose an image file." });
      return;
    }
    setProfileMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoCropPreview(reader.result as string);
      setPhotoCropFile(file);
      setPhotoCropDims(null);
      setPhotoCropZoom(1);
      setPhotoCropOffset({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }, [firebaseUser, session, profileBusy]);

  const CROP_SIZE = 256;
  const PREVIEW_SIZE = 280;

  const getCroppedPhotoDataUrl = useCallback(async (): Promise<string> => {
    if (!photoCropPreview || !photoCropFile) return "";
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = CROP_SIZE;
        canvas.height = CROP_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Canvas not available"));
          return;
        }
        const baseScale = PREVIEW_SIZE / Math.min(img.width, img.height);
        const scale = baseScale * photoCropZoom;
        const sx = photoCropOffset.x / scale;
        const sy = photoCropOffset.y / scale;
        const sw = PREVIEW_SIZE / scale;
        const sh = PREVIEW_SIZE / scale;
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, CROP_SIZE, CROP_SIZE);
        resolve(canvas.toDataURL("image/jpeg", 0.9));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = photoCropPreview;
    });
  }, [photoCropPreview, photoCropFile, photoCropZoom, photoCropOffset]);

  const handlePhotoCropDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    photoCropDragRef.current = { isDragging: true, startX: clientX, startY: clientY, startOffset: { ...photoCropOffset } };
  }, [photoCropOffset]);

  const handlePhotoCropDragMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!photoCropDragRef.current.isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    setPhotoCropOffset({
      x: photoCropDragRef.current.startOffset.x + (clientX - photoCropDragRef.current.startX),
      y: photoCropDragRef.current.startOffset.y + (clientY - photoCropDragRef.current.startY)
    });
  }, []);

  const handlePhotoCropDragEnd = useCallback(() => {
    photoCropDragRef.current.isDragging = false;
  }, []);

  useEffect(() => {
    if (!photoCropPreview) return;
    window.addEventListener("mousemove", handlePhotoCropDragMove);
    window.addEventListener("mouseup", handlePhotoCropDragEnd);
    window.addEventListener("touchmove", handlePhotoCropDragMove, { passive: true });
    window.addEventListener("touchend", handlePhotoCropDragEnd);
    return () => {
      window.removeEventListener("mousemove", handlePhotoCropDragMove);
      window.removeEventListener("mouseup", handlePhotoCropDragEnd);
      window.removeEventListener("touchmove", handlePhotoCropDragMove);
      window.removeEventListener("touchend", handlePhotoCropDragEnd);
    };
  }, [photoCropPreview, handlePhotoCropDragMove, handlePhotoCropDragEnd]);

  const handlePhotoCropApply = useCallback(async () => {
    if (!firebaseUser || !session || !photoCropPreview) return;
    setProfileMessage(null);
    setProfileBusy(true);
    try {
      const dataUrl = await getCroppedPhotoDataUrl();
      if (!dataUrl) throw new Error("Could not process image");
      await updateProfilePhotoURL(firebaseUser, dataUrl);
      setProfileMessage({ type: "success", text: "Profile photo updated." });
      onSessionUpdate?.({ ...session, photoURL: dataUrl });
      setPhotoCropPreview(null);
      setPhotoCropFile(null);
    } catch (err) {
      setProfileMessage({ type: "error", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setProfileBusy(false);
    }
  }, [firebaseUser, session, photoCropPreview, getCroppedPhotoDataUrl, onSessionUpdate]);

  const handlePhotoCropCancel = useCallback(() => {
    setPhotoCropPreview(null);
    setPhotoCropFile(null);
    setPhotoCropDims(null);
  }, []);

  const handleChangeEmailClick = useCallback(async () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || !email.includes("@") || !firebaseUser || emailBusy) return;
    setProfileMessage(null);
    setEmailBusy(true);
    try {
      await sendEmailChangeVerification(firebaseUser, email);
      setProfileMessage({
        type: "success",
        text: "Verification email sent. Check the new inbox and click the link to complete the change."
      });
      setNewEmail("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed.";
      setProfileMessage({
        type: "error",
        text: msg.includes("requires-recent-login")
          ? "For security, please sign out and sign in again, then try changing email."
          : msg
      });
    } finally {
      setEmailBusy(false);
    }
  }, [firebaseUser, newEmail, emailBusy]);

  const handleSendPhoneCode = useCallback(async () => {
    const raw = phoneNumber.trim();
    const digits = raw.replace(/\D/g, "");
    if (digits.length < 10 || !firebaseUser) return;
    const e164 = raw.startsWith("+") ? "+" + digits : "+1" + digits;
    setProfileMessage(null);
    setPhoneBusy(true);
    try {
      const id = await sendPhoneVerificationCode(e164, recaptchaPhoneRef.current ?? "recaptcha-phone");
      setPhoneVerificationId(id);
      setProfileMessage({ type: "success", text: "Code sent. Enter it below." });
    } catch (e) {
      setProfileMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Send failed. Enable Phone sign-in in Firebase Console and add this domain."
      });
    } finally {
      setPhoneBusy(false);
    }
  }, [firebaseUser, phoneNumber]);

  const handleConfirmPhone = useCallback(async () => {
    if (!firebaseUser || !phoneVerificationId || !phoneCode.trim()) return;
    setProfileMessage(null);
    setPhoneBusy(true);
    try {
      await confirmPhoneAndUpdate(firebaseUser, phoneVerificationId, phoneCode.trim());
      setProfileMessage({ type: "success", text: "Phone number updated." });
      setPhoneVerificationId(null);
      setPhoneCode("");
      setPhoneNumber("");
    } catch (e) {
      setProfileMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Invalid code or update failed. You may need to sign in again."
      });
    } finally {
      setPhoneBusy(false);
    }
  }, [firebaseUser, phoneVerificationId, phoneCode]);

  return (
    <div className="settings-grid">
      <Card variant="raised" padding="default" className="settings-account-double">
        <CardHeader
          title="My Account"
          subtitle="Your Antiphon account details."
        />
        <div className="settings-field">
          {session ? (
            <div className="settings-account">
              <div className="settings-account-row">
                <div className="settings-account-avatar-wrap">
                  <div
                    className="settings-account-avatar"
                    aria-hidden="true"
                    style={
                      (firebaseUser?.photoURL ?? session.photoURL)
                        ? {
                            backgroundImage: `url(${firebaseUser?.photoURL ?? session.photoURL})`,
                            backgroundSize: "cover"
                          }
                        : undefined
                    }
                  >
                    {!(firebaseUser?.photoURL ?? session.photoURL) &&
                      (session.displayName?.slice(0, 2).toUpperCase() ??
                        session.email?.slice(0, 2).toUpperCase() ??
                        "?")}
                  </div>
                  {useFirebaseProfile && (
                    <>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="settings-avatar-file-input"
                        aria-label="Upload profile photo"
                        onChange={handlePhotoSelect}
                      />
                      {!photoCropPreview && (
                        <Button
                          variant="secondary"
                          size="compact"
                          type="button"
                          className="settings-avatar-upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={profileBusy}
                        >
                          Upload
                        </Button>
                      )}
                    </>
                  )}
                </div>
                <div className="settings-account-info">
                  {session && isFirebaseConfigured() && firebaseUser === undefined ? (
                    <p className="settings-muted">Loading profile…</p>
                  ) : session && isFirebaseConfigured() && firebaseUser === null ? (
                    <p className="settings-muted">
                      Profile editing is available when you sign in with Google or Apple in this browser.
                    </p>
                  ) : useFirebaseProfile ? (
                    <>
                      <label className="hardware-label" htmlFor="settings-display-name">
                        Display name
                      </label>
                      <div className="settings-display-name-row">
                        <Input
                          id="settings-display-name"
                          type="text"
                          value={displayNameEdit}
                          onChange={(e) => setDisplayNameEdit(e.target.value)}
                          placeholder="Your name"
                          disabled={profileBusy}
                          className="settings-display-name-input"
                        />
                        <Button
                          variant="primary"
                          size="compact"
                          onClick={handleSaveDisplayName}
                          disabled={profileBusy || !displayNameEdit.trim()}
                        >
                          Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="settings-value">{session.displayName || session.email}</p>
                  )}
                  {!(session && isFirebaseConfigured() && firebaseUser === undefined) && (
                    <p className="settings-muted">{session.email}</p>
                  )}
                  {profileMessage && (
                    <p
                      className={
                        profileMessage.type === "success" ? "settings-message success" : "settings-message error"
                      }
                      role="alert"
                    >
                      {profileMessage.text}
                    </p>
                  )}
                </div>
              </div>
              {useFirebaseProfile && (
                <div className="settings-change-email">
                  <label className="hardware-label" htmlFor="settings-new-email">
                    Change email linked to this account
                  </label>
                  <p className="settings-muted settings-change-email-note">
                    We send a verification link to the new address. You may need to sign in again first.
                  </p>
                  <div className="settings-display-name-row">
                    <Input
                      id="settings-new-email"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@example.com"
                      disabled={emailBusy}
                      className="settings-display-name-input"
                    />
                    <Button
                      variant="secondary"
                      size="compact"
                      onClick={handleChangeEmailClick}
                      disabled={emailBusy || !newEmail.trim().includes("@")}
                    >
                      {emailBusy ? "Sending…" : "Send verification"}
                    </Button>
                  </div>
                </div>
              )}
              {useFirebaseProfile && (
                <div className="settings-change-phone">
                  <div id="recaptcha-phone" ref={recaptchaPhoneRef} className="settings-recaptcha-container" aria-hidden="true" />
                  <label className="hardware-label" htmlFor="settings-phone">
                    Change phone linked to this account
                  </label>
                  <p className="settings-muted settings-change-email-note">
                    Enter phone with country code (e.g. +1 555 123 4567). We'll send a code to verify.
                  </p>
                  <div className="settings-display-name-row">
                    <Input
                      id="settings-phone"
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+1 555 123 4567"
                      disabled={phoneBusy}
                      className="settings-display-name-input"
                    />
                    <Button
                      variant="secondary"
                      size="compact"
                      onClick={handleSendPhoneCode}
                      disabled={phoneBusy || phoneNumber.trim().replace(/\D/g, "").length < 10}
                    >
                      {phoneBusy && !phoneVerificationId ? "Sending…" : "Send code"}
                    </Button>
                  </div>
                  {phoneVerificationId && (
                    <div className="settings-display-name-row">
                      <Input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="Verification code"
                        disabled={phoneBusy}
                        className="settings-display-name-input"
                      />
                      <Button variant="primary" size="compact" onClick={handleConfirmPhone} disabled={phoneBusy || !phoneCode.trim()}>
                        {phoneBusy ? "Updating…" : "Update phone"}
                      </Button>
                    </div>
                  )}
                </div>
              )}
              <div className="settings-account-actions">
                <Button variant="secondary" size="compact" onClick={onSignOut}>
                  Log out
                </Button>
              </div>
            </div>
          ) : (
            <p className="settings-muted">Sign in to see account info.</p>
          )}
        </div>
      </Card>

      {photoCropPreview && (
        <div className="settings-photo-crop-modal" role="dialog" aria-modal="true" aria-labelledby="photo-crop-title">
          <div className="settings-photo-crop-modal-scrim" onClick={handlePhotoCropCancel} aria-hidden="true" />
          <div className="settings-photo-crop-modal-panel">
            <h2 id="photo-crop-title" className="settings-photo-crop-title">Crop your photo</h2>
            <p className="settings-photo-crop-subtitle">Drag to position and use the slider to zoom.</p>
            <div
              className="settings-photo-crop-preview-wrap"
              onMouseDown={handlePhotoCropDragStart}
              onTouchStart={handlePhotoCropDragStart}
              style={{ cursor: photoCropDragRef.current?.isDragging ? "grabbing" : "grab" }}
            >
              {photoCropDims ? (
                (() => {
                  const baseScale = PREVIEW_SIZE / Math.min(photoCropDims.w, photoCropDims.h);
                  return (
                    <div
                      className="settings-photo-crop-preview-inner"
                      style={{
                        width: photoCropDims.w * baseScale * photoCropZoom,
                        height: photoCropDims.h * baseScale * photoCropZoom,
                        left: photoCropOffset.x,
                        top: photoCropOffset.y
                      }}
                    >
                      <img src={photoCropPreview} alt="" draggable={false} style={{ width: "100%", height: "100%", display: "block", pointerEvents: "none" }} />
                    </div>
                  );
                })()
              ) : (
                <img
                  src={photoCropPreview}
                  alt=""
                  style={{ maxWidth: "100%", maxHeight: "100%", visibility: "hidden" }}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    const w = img.naturalWidth;
                    const h = img.naturalHeight;
                    const base = PREVIEW_SIZE / Math.min(w, h);
                    const innerW = w * base;
                    const innerH = h * base;
                    setPhotoCropDims({ w, h });
                    setPhotoCropOffset({ x: PREVIEW_SIZE / 2 - innerW / 2, y: PREVIEW_SIZE / 2 - innerH / 2 });
                  }}
                />
              )}
            </div>
            <label className="hardware-label">Zoom</label>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={photoCropZoom}
              onChange={(e) => setPhotoCropZoom(Number(e.target.value))}
              className="settings-photo-crop-slider"
              aria-label="Zoom"
            />
            <div className="settings-display-name-row">
              <Button variant="primary" size="compact" onClick={handlePhotoCropApply} disabled={profileBusy}>
                {profileBusy ? "Updating…" : "Use this photo"}
              </Button>
              <Button variant="secondary" size="compact" onClick={handlePhotoCropCancel} disabled={profileBusy}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <Card variant="raised" padding="default">
        <CardHeader
          title="File Management"
          subtitle="Where files are stored on this machine."
        />
        <div className="settings-field settings-file-locations">
          <div className="settings-path-row">
            <label className="hardware-label" htmlFor="download-path">Download location</label>
            <div className="settings-path-input-row">
              <Input
                id="download-path"
                type="text"
                value={downloadPath}
                onChange={(e) => setDownloadPath(e.target.value)}
                className="settings-path-input"
              />
              <Button variant="secondary" size="compact" type="button" onClick={() => handleBrowse("download")}>
                Browse
              </Button>
            </div>
          </div>
          <div className="settings-path-row">
            <label className="hardware-label" htmlFor="app-path">Application location</label>
            <div className="settings-path-input-row">
              <Input
                id="app-path"
                type="text"
                value={appPath}
                onChange={(e) => setAppPath(e.target.value)}
                className="settings-path-input"
              />
              <Button variant="secondary" size="compact" type="button" onClick={() => handleBrowse("app")}>
                Browse
              </Button>
            </div>
          </div>
          <div className="settings-path-row">
            <label className="hardware-label" htmlFor="content-path">Content location</label>
            <div className="settings-path-input-row">
              <Input
                id="content-path"
                type="text"
                value={contentPath}
                onChange={(e) => setContentPath(e.target.value)}
                className="settings-path-input"
              />
              <Button variant="secondary" size="compact" type="button" onClick={() => handleBrowse("content")}>
                Browse
              </Button>
            </div>
          </div>
          <div className="settings-form-actions">
            <Button variant="secondary" size="compact" type="button" onClick={handleRestoreDefaults}>
              Restore defaults
            </Button>
          </div>
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="General" subtitle="Application preferences." />
        <p className="settings-muted">Launch at login and other options coming in a future update.</p>
      </Card>

      {typeof window !== "undefined" && window.electron && (
        <Card variant="raised" padding="default">
          <CardHeader
            title="Desktop app"
            subtitle="Start at login and minimize to tray."
          />
          <div className="settings-field">
            <label className="settings-desktop-toggle">
              <input
                type="checkbox"
                checked={launchAtLogin}
                onChange={async (e) => {
                  const v = e.target.checked;
                  const ok = await window.electron!.setLaunchAtLogin(v);
                  if (ok) setLaunchAtLoginState(v);
                }}
              />
              <span>Start Antiphon Manager when I log in</span>
            </label>
            <label className="settings-desktop-toggle">
              <input
                type="checkbox"
                checked={closeToTray}
                onChange={async (e) => {
                  const v = e.target.checked;
                  await window.electron!.setCloseToTray(v);
                  setCloseToTrayState(v);
                }}
              />
              <span>Close to tray (keep running in background)</span>
            </label>
            <label className="settings-desktop-toggle">
              <input
                type="checkbox"
                checked={autoInstallUpdates}
                onChange={async (e) => {
                  const v = e.target.checked;
                  await window.electron!.setAutoInstallUpdates(v);
                  setAutoInstallUpdatesState(v);
                }}
              />
              <span>Automatically install updates</span>
            </label>
            {updateStatus === "ready" && (
              <div className="settings-form-actions">
                <p className="settings-muted">Update ready. Restart to apply.</p>
                <Button variant="primary" onClick={() => window.electron!.restartToUpdate()}>
                  Restart to update
                </Button>
              </div>
            )}
            {updateStatus === "available" && !autoInstallUpdates && (
              <p className="settings-muted">An update is available. Enable automatic updates to install on quit.</p>
            )}
            {updateStatus === "error" && updateError && (
              <p className="settings-muted">Update check failed: {updateError}</p>
            )}
            <p className="settings-muted">
              You can change these in system settings: Login Items (Mac) or Startup (Windows Task Manager).
            </p>
          </div>
        </Card>
      )}

      <Card variant="raised" padding="default">
        <CardHeader
          title="Billing"
          subtitle="Manage your orders and payment methods."
        />
        <p className="settings-muted">
          All purchases are processed securely. No subscriptions.
        </p>
        <div className="settings-form-actions">
          <a
            href={import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL || "https://billing.stripe.com"}
            target="_blank"
            rel="noopener noreferrer"
            className="settings-link"
          >
            Manage billing and orders
          </a>
        </div>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="Appearance" subtitle="Theme and display." />
        <p className="settings-muted">Light, dark, or system preference. Coming soon.</p>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="Usage Data" subtitle="Anonymous analytics." />
        <p className="settings-muted">
          We never track for marketing or personally. We only collect anonymous usage data to improve our products.
        </p>
      </Card>

      <Card variant="raised" padding="default">
        <CardHeader title="Privacy & Legal" subtitle="Policies and terms." />
        <p className="settings-muted">
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer" className="settings-link">Privacy Policy</a>
          {" · "}
          <a href="/eula.html" target="_blank" rel="noopener noreferrer" className="settings-link">EULA</a>
        </p>
      </Card>
    </div>
  );
}
