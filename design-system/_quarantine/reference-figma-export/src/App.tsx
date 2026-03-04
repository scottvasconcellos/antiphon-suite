import React, { useState } from "react";
import logo from "figma:asset/3f3349ce41bce8abce498586f76a3d89a3f847c9.png";

// UI Components
import { Button } from "./components/ui/Button";
import { Input } from "./components/ui/Input";
import { Select } from "./components/ui/Select";
import { Toggle } from "./components/ui/Toggle";
import { Slider } from "./components/ui/Slider";
import { Card, CardHeader } from "./components/ui/Card";
import { Modal } from "./components/ui/Modal";
import { Tabs } from "./components/ui/Tabs";
import { Badge } from "./components/ui/Badge";
import { Toast } from "./components/ui/Toast";
import { ProgressBar } from "./components/ui/ProgressBar";

// Audio Components
import { PianoRoll } from "./components/audio/PianoRoll";
import { PianoKeyboard } from "./components/audio/PianoKeyboard";
import {
  Waveform,
  SpectrumAnalyzer,
} from "./components/audio/Waveform";
import { Transport } from "./components/audio/Transport";
import { GrooveGrid } from "./components/audio/GrooveGrid";
import { Knob } from "./components/audio/Knob";
import { Fretboard } from "./components/audio/Fretboard";
import { Synthesizer } from "./components/audio/Synthesizer";

// Icons
import {
  IconHome,
  IconDashboard,
  IconProject,
  IconLibrary,
  IconSettings,
  IconUser,
  IconSearch,
  IconPlay,
  IconPause,
  IconVolume,
  IconMute,
  IconWaveform,
  IconSpectrum,
  IconMIDI,
  IconKeyboard,
  IconGrid,
  IconNote,
  IconChord,
  IconScale,
  IconEQ,
  IconCompressor,
  IconAutomation,
  IconEnvelope,
  IconCheck,
  IconWarning,
  IconError,
  IconInfo,
  IconAdd,
  IconEdit,
  IconDelete,
  IconDownload,
  IconUpload,
  IconGuitar,
  IconSynth,
  IconExpand,
  IconDraw,
  IconEraser,
  IconPiano,
  IconBass,
  IconDrums,
  IconReverb,
  IconDecay,
  IconChorus,
  IconLoop,
  IconRecord,
} from "./components/icons/IconLibrary";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("foundations");
  const [isPlaying, setIsPlaying] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [pianoNotes, setPianoNotes] = useState([
    { id: "1", pitch: 12, start: 0, duration: 4, velocity: 100 },
    { id: "2", pitch: 16, start: 4, duration: 4, velocity: 90 },
    { id: "3", pitch: 19, start: 8, duration: 4, velocity: 85 },
    { id: "4", pitch: 12, start: 12, duration: 4, velocity: 95 },
    { id: "5", pitch: 24, start: 16, duration: 8, velocity: 80 },
    { id: "6", pitch: 21, start: 24, duration: 8, velocity: 88 },
  ]);

  const simulateUpload = () => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
          }, 500);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)]">
      {/* App Shell */}
      <div className="flex h-screen">
        {/* Left Sidebar */}
        <aside className="w-64 bg-[var(--color-bg-app-shell)] border-r border-[var(--color-border-subtle)] flex flex-col shrink-0">
          {/* Logo */}
          <div className="p-6 border-b border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Antiphon"
                className="w-8 h-8 object-contain"
              />
              <h1 className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                ANTIPHON
              </h1>
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 uppercase tracking-widest">
              Design System
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              <div>
                <div className="hardware-label mb-2 px-2">
                  SYSTEM
                </div>
                <div className="space-y-1">
                  {[
                    { id: "foundations", label: "Foundations", icon: IconDashboard },
                    { id: "components", label: "Components", icon: IconGrid },
                    { id: "audio", label: "Audio UI", icon: IconWaveform },
                    { id: "instruments", label: "Instruments", icon: IconGuitar },
                    { id: "icons", label: "Icons", icon: IconLibrary },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveNav(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm
                        transition-all duration-100
                        ${
                          activeNav === item.id
                            ? "bg-[var(--color-overlay-selected)] text-[var(--color-accent-primary)] border border-[var(--color-accent-primary)]/30"
                            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] border border-transparent"
                        }
                      `}
                    >
                      <item.icon size={18} filled={activeNav === item.id} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="hardware-label mb-2 px-2">
                  PRODUCTS
                </div>
                <div className="space-y-1">
                  {[
                    { id: "marketing", label: "Marketing Site", icon: IconHome },
                    { id: "webapp", label: "Web App", icon: IconProject },
                    { id: "desktop", label: "Desktop App", icon: IconSettings },
                    { id: "plugins", label: "DAW Plugins", icon: IconNote },
                    { id: "hub", label: "Antiphon Hub", icon: IconUser },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveNav(item.id)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] text-sm transition-all border
                        ${activeNav === item.id
                          ? "bg-[var(--color-overlay-selected)] text-[var(--color-accent-primary)] border-[var(--color-accent-primary)]/30"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-overlay-hover)] border-transparent"
                        }
                      `}
                    >
                      <item.icon size={18} filled={activeNav === item.id} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-[var(--color-border-subtle)]">
            <div className="flex items-center gap-3 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-surface)] border border-[var(--color-border-strong)] flex items-center justify-center">
                <IconUser size={16} className="text-[var(--color-text-muted)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--color-text-primary)] font-medium">
                  Designer
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  v2.0.0
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-8 space-y-12">
            {/* Foundations Section */}
            {activeNav === "foundations" && (
              <>
                <section>
                  <div className="mb-6">
                    <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
                      Design Foundations
                    </h2>
                    <p className="text-[var(--color-text-secondary)]">
                      Premium dark-mode design system for professional audio software
                    </p>
                  </div>
                </section>

                {/* Color Tokens */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Color System
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Card>
                      <h4 className="hardware-label mb-3">BACKGROUND TIERS</h4>
                      <div className="space-y-2">
                        {[
                          { name: "Page", var: "--color-bg-page", hex: "#0a0a0b" },
                          { name: "App Shell", var: "--color-bg-app-shell", hex: "#111113" },
                          { name: "Surface", var: "--color-bg-surface", hex: "#18181b" },
                          { name: "Elevated", var: "--color-bg-surface-elevated", hex: "#1f1f23" },
                          { name: "Inset", var: "--color-bg-inset", hex: "#0d0d0f" },
                        ].map((color) => (
                          <div key={color.var} className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]"
                              style={{ backgroundColor: `var(${color.var})` }}
                            />
                            <div className="flex-1">
                              <div className="text-xs text-[var(--color-text-primary)]">{color.name}</div>
                              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">{color.hex}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card>
                      <h4 className="hardware-label mb-3">TEXT TOKENS</h4>
                      <div className="space-y-2">
                        {[
                          { name: "Primary", var: "--color-text-primary", hex: "#e8e8ea" },
                          { name: "Secondary", var: "--color-text-secondary", hex: "#a1a1a8" },
                          { name: "Muted", var: "--color-text-muted", hex: "#6b6b72" },
                          { name: "Disabled", var: "--color-text-disabled", hex: "#43434a" },
                          { name: "Accent", var: "--color-text-accent", hex: "#60a5fa" },
                        ].map((color) => (
                          <div key={color.var} className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]"
                              style={{ backgroundColor: `var(${color.var})` }}
                            />
                            <div className="flex-1">
                              <div className="text-xs text-[var(--color-text-primary)]">{color.name}</div>
                              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">{color.hex}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card>
                      <h4 className="hardware-label mb-3">ACCENT COLORS</h4>
                      <div className="space-y-2">
                        {[
                          { name: "Primary", var: "--color-accent-primary", hex: "#60a5fa" },
                          { name: "Success", var: "--color-accent-success", hex: "#22c55e" },
                          { name: "Warning", var: "--color-accent-warning", hex: "#f59e0b" },
                          { name: "Danger", var: "--color-accent-danger", hex: "#ef4444" },
                        ].map((color) => (
                          <div key={color.var} className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)]"
                              style={{ backgroundColor: `var(${color.var})` }}
                            />
                            <div className="flex-1">
                              <div className="text-xs text-[var(--color-text-primary)]">{color.name}</div>
                              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">{color.hex}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card>
                      <h4 className="hardware-label mb-3">BORDER TOKENS</h4>
                      <div className="space-y-2">
                        {[
                          { name: "Subtle", var: "--color-border-subtle", hex: "#28282d" },
                          { name: "Strong", var: "--color-border-strong", hex: "#38383f" },
                          { name: "Focus", var: "--color-border-focus", hex: "#60a5fa" },
                          { name: "Error", var: "--color-border-error", hex: "#f87171" },
                        ].map((color) => (
                          <div key={color.var} className="flex items-center gap-2">
                            <div
                              className="w-10 h-10 rounded-[var(--radius-sm)] border-2"
                              style={{ borderColor: `var(${color.var})`, backgroundColor: 'var(--color-bg-inset)' }}
                            />
                            <div className="flex-1">
                              <div className="text-xs text-[var(--color-text-primary)]">{color.name}</div>
                              <div className="text-[10px] font-mono text-[var(--color-text-muted)]">{color.hex}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </section>

                {/* Typography */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Typography Scale
                  </h3>
                  <Card>
                    <div className="space-y-4">
                      <div className="mb-6 p-4 bg-[var(--color-bg-inset)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                        <h4 className="hardware-label mb-3">FONT FAMILIES</h4>
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-3">
                            <span className="text-sm text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-display)' }}>Display / UI</span>
                            <span className="telemetry text-xs">ui-sans-serif, system-ui, sans-serif</span>
                          </div>
                          <div className="flex items-baseline gap-3">
                            <span className="text-sm text-[var(--color-text-primary)]" style={{ fontFamily: 'var(--font-mono)' }}>Monospace / Telemetry</span>
                            <span className="telemetry text-xs">ui-monospace, SF Mono, Monaco, Cascadia Code</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <span className="hardware-label">DISPLAY LARGE</span>
                        <h1 style={{ fontSize: "var(--font-size-display-lg)" }}>The quick brown fox</h1>
                      </div>
                      <div>
                        <span className="hardware-label">DISPLAY MEDIUM</span>
                        <h2 style={{ fontSize: "var(--font-size-display-md)" }}>The quick brown fox jumps</h2>
                      </div>
                      <div>
                        <span className="hardware-label">HEADING LARGE</span>
                        <h3 style={{ fontSize: "var(--font-size-heading-lg)" }}>The quick brown fox jumps over</h3>
                      </div>
                      <div>
                        <span className="hardware-label">BODY TEXT</span>
                        <p style={{ fontSize: "var(--font-size-body-lg)" }}>The quick brown fox jumps over the lazy dog</p>
                      </div>
                      <div>
                        <span className="hardware-label">HARDWARE LABEL STYLE</span>
                        <div className="hardware-label mt-2">GAIN REDUCTION</div>
                      </div>
                      <div>
                        <span className="hardware-label">TELEMETRY / MONOSPACE</span>
                        <div className="telemetry mt-2">48.0 kHz | -12.4 dB | 120 BPM</div>
                      </div>
                    </div>
                  </Card>
                </section>

                {/* Spacing */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Spacing Scale
                  </h3>
                  <Card>
                    <div className="space-y-3">
                      {[
                        { name: "XS", value: "4px" },
                        { name: "SM", value: "8px" },
                        { name: "MD", value: "12px" },
                        { name: "LG", value: "16px" },
                        { name: "XL", value: "24px" },
                        { name: "2XL", value: "32px" },
                        { name: "3XL", value: "48px" },
                      ].map((space) => (
                        <div key={space.name} className="flex items-center gap-4">
                          <div className="w-16 hardware-label">{space.name}</div>
                          <div className="h-8 bg-[var(--color-accent-primary)]" style={{ width: space.value }} />
                          <span className="telemetry text-xs">{space.value}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              </>
            )}

            {/* Components Section */}
            {activeNav === "components" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-6">
                    Core UI Components
                  </h2>
                </section>

                {/* Buttons */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Buttons
                  </h3>
                  <Card>
                    <div className="space-y-6">
                      <div>
                        <h4 className="hardware-label mb-3">VARIANTS</h4>
                        <p className="text-xs text-[var(--color-text-muted)] mb-3">
                          Secondary is default. Primary (blue) reserved for key actions. Danger turns red on hover.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="secondary">Secondary</Button>
                          <Button variant="primary">Primary Action</Button>
                          <Button variant="ghost">Ghost Button</Button>
                          <Button variant="danger">Delete Item</Button>
                          <Button variant="illuminated" toggle><IconRecord size={10} /> REC</Button>
                          <Button variant="secondary" disabled>Disabled</Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="hardware-label mb-3">TOGGLE BUTTONS (STAY PRESSED)</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="secondary" toggle>Toggle Me</Button>
                          <Button variant="secondary" toggle><IconGrid size={16} /> Grid Snap</Button>
                          <Button variant="secondary" toggle><IconVolume size={16} /> Monitor</Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="hardware-label mb-3">SIZES</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button size="compact" variant="secondary">Compact</Button>
                          <Button size="default" variant="secondary">Default</Button>
                          <Button size="spacious" variant="secondary">Spacious</Button>
                        </div>
                      </div>
                      <div>
                        <h4 className="hardware-label mb-3">WITH ICONS</h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <Button variant="primary"><IconPlay size={16} /> Play</Button>
                          <Button variant="secondary"><IconDownload size={16} /> Download</Button>
                          <Button variant="ghost"><IconSettings size={16} /> Settings</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>

                {/* Progress Bars */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Progress Bars
                  </h3>
                  <Card>
                    <div className="space-y-6">
                      <div>
                        <h4 className="hardware-label mb-3">VARIANTS</h4>
                        <div className="space-y-4">
                          <ProgressBar value={65} label="Uploading audio file..." icon={<IconUpload size={14} />} />
                          <ProgressBar value={100} label="Analysis complete" variant="success" icon={<IconCheck size={14} />} />
                          <ProgressBar value={45} label="High CPU usage" variant="warning" />
                          <ProgressBar value={80} label="Storage almost full" variant="danger" />
                        </div>
                      </div>
                      <div>
                        <h4 className="hardware-label mb-3">INTERACTIVE</h4>
                        <div className="space-y-3">
                          {isUploading ? (
                            <ProgressBar
                              value={uploadProgress}
                              label="Uploading now..."
                              icon={<IconUpload size={14} />}
                            />
                          ) : (
                            <Button variant="secondary" onClick={simulateUpload}>
                              <IconUpload size={16} /> Upload File
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>

                {/* Form Controls */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Form Controls
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <h4 className="hardware-label mb-4">INPUTS</h4>
                      <div className="space-y-4">
                        <Input label="Project Name" placeholder="Enter project name..." />
                        <Input label="Search" placeholder="Search presets..." prefix={<IconSearch size={16} />} />
                        <Input label="BPM" type="number" defaultValue="120" suffix="BPM" />
                        <Input label="Error State" error="Sample rate must be between 44.1 and 192 kHz" defaultValue="Invalid" />
                      </div>
                    </Card>

                    <Card>
                      <h4 className="hardware-label mb-4">CONTROLS</h4>
                      <div className="space-y-4">
                        <Select
                          label="Sample Rate"
                          options={[
                            { value: "44.1", label: "44.1 kHz" },
                            { value: "48", label: "48 kHz" },
                            { value: "96", label: "96 kHz" },
                            { value: "192", label: "192 kHz" },
                          ]}
                          defaultValue="48"
                        />
                        <div>
                          <span className="hardware-label mb-2 block">TOGGLES</span>
                          <div className="space-y-2">
                            <Toggle label="High Pass Filter" defaultChecked />
                            <Toggle label="Stereo Link" />
                            <Toggle label="Auto Gain" disabled />
                          </div>
                        </div>
                        <Slider label="Output Level" defaultValue={75} showValue unit=" dB" />
                      </div>
                    </Card>
                  </div>
                </section>

                {/* Cards & Layout */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Cards & Containers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card variant="flat">
                      <CardHeader
                        title="Flat Card"
                        subtitle="Default surface variant"
                        actions={<Button variant="ghost" size="compact"><IconEdit size={14} /></Button>}
                      />
                      <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                        Most commonly used for content sections.
                      </p>
                    </Card>

                    <Card variant="raised">
                      <CardHeader
                        title="Raised Card"
                        subtitle="Elevated surface"
                        actions={<Badge variant="success">Active</Badge>}
                      />
                      <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                        Used for modals and important UI elements.
                      </p>
                    </Card>

                    <Card variant="inset">
                      <CardHeader
                        title="Inset Card"
                        subtitle="Recessed surface"
                        actions={<Badge variant="info">New</Badge>}
                      />
                      <p className="text-sm text-[var(--color-text-secondary)] mt-3">
                        Perfect for input panels and control groups.
                      </p>
                    </Card>
                  </div>
                </section>

                {/* Badges & Status */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Badges & Status Indicators
                  </h3>
                  <Card>
                    <div className="space-y-4">
                      <div>
                        <h4 className="hardware-label mb-3">VARIANTS</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge>Default</Badge>
                          <Badge variant="success">Success</Badge>
                          <Badge variant="warning">Warning</Badge>
                          <Badge variant="danger">Error</Badge>
                          <Badge variant="info">Info</Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="hardware-label mb-3">USAGE EXAMPLES</h4>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="success">Synced</Badge>
                          <Badge variant="warning">Trial</Badge>
                          <Badge variant="info">Beta</Badge>
                          <Badge variant="danger">Offline</Badge>
                          <Badge>v2.1.0</Badge>
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>

                {/* Tabs */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Tabs & Navigation
                  </h3>
                  <Card>
                    <Tabs
                      tabs={[
                        {
                          id: "overview",
                          label: "Overview",
                          icon: <IconDashboard size={16} />,
                          content: (
                            <div className="p-4 bg-[var(--color-bg-inset)] rounded-[var(--radius-md)]">
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                Overview tab content with default tab styling.
                              </p>
                            </div>
                          ),
                        },
                        {
                          id: "settings",
                          label: "Settings",
                          icon: <IconSettings size={16} />,
                          content: (
                            <div className="p-4 bg-[var(--color-bg-inset)] rounded-[var(--radius-md)]">
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                Settings configuration panel.
                              </p>
                            </div>
                          ),
                        },
                        {
                          id: "advanced",
                          label: "Advanced",
                          icon: <IconProject size={16} />,
                          content: (
                            <div className="p-4 bg-[var(--color-bg-inset)] rounded-[var(--radius-md)]">
                              <p className="text-sm text-[var(--color-text-secondary)]">
                                Advanced options and controls.
                              </p>
                            </div>
                          ),
                        },
                      ]}
                    />
                  </Card>
                </section>

                {/* Toasts */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Toasts & Notifications
                  </h3>
                  <Card>
                    <div className="space-y-3">
                      <Toast message="Successfully exported MIDI file" type="success" />
                      <Toast message="Project is syncing to cloud" type="info" persistent />
                      <Toast message="High CPU usage detected" type="warning" persistent />
                      <Toast message="Failed to load plugin" type="error" onClose={() => {}} persistent />
                    </div>
                  </Card>
                </section>

                {/* Modal */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Modals & Dialogs
                  </h3>
                  <Card>
                    <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                      Open Modal
                    </Button>
                  </Card>
                </section>
              </>
            )}

            {/* Audio Components Section */}
            {activeNav === "audio" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
                    Audio-Specific Components
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Professional music production and audio processing UI elements
                  </p>
                </section>

                {/* Transport */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Transport Controls
                  </h3>
                  <Transport
                    isPlaying={isPlaying}
                    isRecording={false}
                    isLooping={true}
                    tempo={128}
                    position="2.3.1"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    onStop={() => setIsPlaying(false)}
                  />
                </section>

                {/* Piano Roll */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    MIDI Piano Roll
                  </h3>
                  <PianoRoll
                    notes={pianoNotes}
                    onNoteChange={setPianoNotes}
                    bars={4}
                  />
                </section>

                {/* Piano Keyboard */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Interactive Piano Keyboard
                  </h3>
                  <PianoKeyboard
                    octaves={3}
                    startOctave={3}
                    showNoteNames
                  />
                </section>

                {/* Visualizers */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Audio Visualizers
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Waveform />
                    <SpectrumAnalyzer />
                  </div>
                </section>

                {/* Groove Grid */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Groove Sequencer / Step Grid
                  </h3>
                  <GrooveGrid rows={8} cols={16} />
                </section>

                {/* Knobs & Faders */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Rotary Knobs & Parameter Controls
                  </h3>
                  <Card>
                    <div className="flex flex-wrap items-end justify-around gap-8 p-6">
                      <Knob label="GAIN" defaultValue={0} min={-24} max={24} unit=" dB" size="small" />
                      <Knob label="FREQUENCY" defaultValue={1000} min={20} max={20000} unit=" Hz" size="medium" />
                      <Knob label="RESONANCE" defaultValue={0.5} min={0} max={1} step={0.01} size="medium" />
                      <Knob label="MIX" defaultValue={50} min={0} max={100} unit="%" size="large" />
                      <Knob label="ATTACK" defaultValue={10} min={0} max={100} unit=" ms" size="medium" />
                    </div>
                  </Card>
                </section>

                {/* Plugin UI */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    DAW Plugin UI Example
                  </h3>
                  <Card variant="raised" padding="none">
                    <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={logo} alt="Antiphon" className="w-6 h-6 object-contain" />
                        <div>
                          <div className="text-sm font-semibold text-[var(--color-text-primary)]">
                            Antiphon Compressor
                          </div>
                          <div className="text-xs text-[var(--color-text-muted)]">
                            Preset: Modern Punch
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="compact">A/B</Button>
                        <Button variant="ghost" size="compact"><IconSettings size={14} /></Button>
                      </div>
                    </div>

                    <div className="p-6">
                      <div className="grid grid-cols-5 gap-8">
                        <Knob label="THRESHOLD" defaultValue={-12} min={-60} max={0} unit=" dB" size="medium" />
                        <Knob label="RATIO" defaultValue={4} min={1} max={20} unit=":1" size="medium" />
                        <Knob label="ATTACK" defaultValue={5} min={0.1} max={100} step={0.1} unit=" ms" size="medium" />
                        <Knob label="RELEASE" defaultValue={50} min={10} max={1000} unit=" ms" size="medium" />
                        <Knob label="MAKEUP" defaultValue={0} min={-12} max={12} unit=" dB" size="medium" />
                      </div>

                      <div className="mt-6 pt-6 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Toggle label="Sidechain" />
                          <Toggle label="Auto Release" />
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="hardware-label mb-1">GAIN REDUCTION</span>
                            <span className="telemetry">-6.2 dB</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="hardware-label mb-1">OUTPUT</span>
                            <span className="telemetry">-2.4 dB</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </section>
              </>
            )}

            {/* Instruments Section */}
            {activeNav === "instruments" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
                    Instruments
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Interactive instrument interfaces for composition and sound design
                  </p>
                </section>

                {/* Guitar */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Guitar Fretboard
                  </h3>
                  <Fretboard type="guitar" frets={15} />
                </section>

                {/* Bass */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Bass Fretboard
                  </h3>
                  <Fretboard type="bass" frets={15} />
                </section>

                {/* Synthesizer */}
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-4">
                    Synthesizer Module
                  </h3>
                  <Synthesizer />
                </section>
              </>
            )}

            {/* Icons Section */}
            {activeNav === "icons" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">
                    Icon Library
                  </h2>
                  <p className="text-[var(--color-text-secondary)] mb-6">
                    Hardware-inspired icon set with mechanical precision. All icons support filled variants for active states.
                  </p>
                </section>

                <Card>
                  <h4 className="hardware-label mb-4">OUTLINE (DEFAULT)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 mb-8">
                    {[
                      { Icon: IconHome, name: "Home" },
                      { Icon: IconDashboard, name: "Dashboard" },
                      { Icon: IconProject, name: "Project" },
                      { Icon: IconLibrary, name: "Library" },
                      { Icon: IconSettings, name: "Settings" },
                      { Icon: IconUser, name: "User" },
                      { Icon: IconSearch, name: "Search" },
                      { Icon: IconAdd, name: "Add" },
                      { Icon: IconEdit, name: "Edit" },
                      { Icon: IconDelete, name: "Delete" },
                      { Icon: IconDownload, name: "Download / Export" },
                      { Icon: IconUpload, name: "Upload / Import" },
                      { Icon: IconPlay, name: "Play" },
                      { Icon: IconPause, name: "Pause" },
                      { Icon: IconVolume, name: "Volume" },
                      { Icon: IconMute, name: "Mute" },
                      { Icon: IconWaveform, name: "Waveform" },
                      { Icon: IconSpectrum, name: "Spectrum" },
                      { Icon: IconMIDI, name: "MIDI" },
                      { Icon: IconKeyboard, name: "Keyboard" },
                      { Icon: IconGrid, name: "Grid" },
                      { Icon: IconNote, name: "Note" },
                      { Icon: IconChord, name: "Chord" },
                      { Icon: IconScale, name: "Scale" },
                      { Icon: IconEQ, name: "EQ" },
                      { Icon: IconCompressor, name: "Compressor" },
                      { Icon: IconAutomation, name: "Automation" },
                      { Icon: IconEnvelope, name: "Envelope" },
                      { Icon: IconCheck, name: "Check" },
                      { Icon: IconWarning, name: "Warning" },
                      { Icon: IconError, name: "Error" },
                      { Icon: IconInfo, name: "Info" },
                      { Icon: IconExpand, name: "Expand" },
                      { Icon: IconDraw, name: "Draw" },
                      { Icon: IconEraser, name: "Eraser" },
                      { Icon: IconGuitar, name: "Guitar" },
                      { Icon: IconSynth, name: "Synth" },
                      { Icon: IconPiano, name: "Piano" },
                      { Icon: IconBass, name: "Bass" },
                      { Icon: IconDrums, name: "Drums" },
                      { Icon: IconReverb, name: "Reverb" },
                      { Icon: IconDecay, name: "Decay" },
                      { Icon: IconChorus, name: "Chorus" },
                      { Icon: IconLoop, name: "Loop" },
                      { Icon: IconRecord, name: "Record" },
                    ].map(({ Icon, name }) => (
                      <div
                        key={name}
                        className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-overlay-hover)] transition-colors"
                      >
                        <Icon size={24} className="text-[var(--color-text-primary)]" />
                        <span className="text-xs text-[var(--color-text-secondary)] text-center">{name}</span>
                      </div>
                    ))}
                  </div>

                  <h4 className="hardware-label mb-4">FILLED (ACTIVE / SELECTED)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                    {[
                      { Icon: IconHome, name: "Home" },
                      { Icon: IconDashboard, name: "Dashboard" },
                      { Icon: IconProject, name: "Project" },
                      { Icon: IconLibrary, name: "Library" },
                      { Icon: IconSettings, name: "Settings" },
                      { Icon: IconUser, name: "User" },
                      { Icon: IconSearch, name: "Search" },
                      { Icon: IconAdd, name: "Add" },
                      { Icon: IconEdit, name: "Edit" },
                      { Icon: IconDelete, name: "Delete" },
                      { Icon: IconDownload, name: "Download" },
                      { Icon: IconUpload, name: "Upload" },
                      { Icon: IconPlay, name: "Play" },
                      { Icon: IconPause, name: "Pause" },
                      { Icon: IconVolume, name: "Volume" },
                      { Icon: IconMute, name: "Mute" },
                      { Icon: IconWaveform, name: "Waveform" },
                      { Icon: IconSpectrum, name: "Spectrum" },
                      { Icon: IconMIDI, name: "MIDI" },
                      { Icon: IconNote, name: "Note" },
                      { Icon: IconChord, name: "Chord" },
                      { Icon: IconScale, name: "Scale" },
                      { Icon: IconEQ, name: "EQ" },
                      { Icon: IconCompressor, name: "Compressor" },
                      { Icon: IconAutomation, name: "Automation" },
                      { Icon: IconEnvelope, name: "Envelope" },
                      { Icon: IconReverb, name: "Reverb" },
                      { Icon: IconDecay, name: "Decay" },
                      { Icon: IconChorus, name: "Chorus" },
                      { Icon: IconCheck, name: "Check" },
                      { Icon: IconWarning, name: "Warning" },
                      { Icon: IconError, name: "Error" },
                      { Icon: IconInfo, name: "Info" },
                      { Icon: IconExpand, name: "Expand" },
                      { Icon: IconDraw, name: "Draw" },
                      { Icon: IconEraser, name: "Eraser" },
                      { Icon: IconGuitar, name: "Guitar" },
                      { Icon: IconBass, name: "Bass" },
                      { Icon: IconPiano, name: "Piano" },
                      { Icon: IconDrums, name: "Drums" },
                      { Icon: IconSynth, name: "Synth" },
                      { Icon: IconLoop, name: "Loop" },
                    ].map(({ Icon, name }) => (
                      <div
                        key={`filled-${name}`}
                        className="flex flex-col items-center gap-2 p-3 rounded-[var(--radius-md)] hover:bg-[var(--color-overlay-hover)] transition-colors"
                      >
                        <Icon size={24} className="text-[var(--color-accent-primary)]" filled />
                        <span className="text-xs text-[var(--color-text-secondary)] text-center">{name}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* Marketing Site Mockup */}
            {activeNav === "marketing" && (
              <>
                <section>
                  <div className="text-center max-w-3xl mx-auto mb-16">
                    <Badge variant="info" className="mb-4">Now Available</Badge>
                    <h2 className="text-5xl font-semibold text-[var(--color-text-primary)] mb-4" style={{ fontSize: 'var(--font-size-display-lg)' }}>
                      Professional Audio,<br />Redefined.
                    </h2>
                    <p className="text-lg text-[var(--color-text-secondary)] mb-8 max-w-xl mx-auto">
                      Studio-grade tools built for the modern producer. From composition to master, Antiphon delivers precision at every stage.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Button variant="primary" size="spacious">Start Free Trial</Button>
                      <Button variant="secondary" size="spacious"><IconPlay size={18} /> Watch Demo</Button>
                    </div>
                  </div>
                </section>
                <section>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {[
                      { title: "MIDI Composition", desc: "Full piano roll, chord detection, and intelligent quantize.", icon: IconMIDI },
                      { title: "Real-Time Analysis", desc: "Spectrum analyzer, waveform display, and CPU monitoring.", icon: IconSpectrum },
                      { title: "Plugin Ecosystem", desc: "Professional compressor, EQ, and effects chain.", icon: IconCompressor },
                    ].map((f) => (
                      <Card key={f.title} variant="flat" padding="spacious">
                        <f.icon size={28} className="text-[var(--color-accent-primary)] mb-4" />
                        <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{f.title}</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">{f.desc}</p>
                      </Card>
                    ))}
                  </div>
                </section>
                <section>
                  <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6 text-center">Pricing</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {[
                      { name: "Starter", price: "Free", features: ["Basic Piano Roll", "2 Instruments", "Community Support"] },
                      { name: "Pro", price: "$19", features: ["Full Piano Roll", "All Instruments", "Plugin Suite", "Priority Support"], accent: true },
                      { name: "Studio", price: "$49", features: ["Everything in Pro", "Unlimited Projects", "Team Collaboration", "Custom Presets"] },
                    ].map((tier) => (
                      <Card key={tier.name} variant="flat" padding="spacious" className={tier.accent ? 'border-[var(--color-accent-primary)]' : ''}>
                        <h4 className="hardware-label mb-2">{tier.name}</h4>
                        <div className="mb-4">
                          <span className="text-3xl font-semibold text-[var(--color-text-primary)]">{tier.price}</span>
                          {tier.price !== "Free" && <span className="text-sm text-[var(--color-text-muted)]"> / month</span>}
                        </div>
                        <div className="space-y-2 mb-6">
                          {tier.features.map((f) => (
                            <div key={f} className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                              <IconCheck size={14} className="text-[var(--color-accent-success)]" /> {f}
                            </div>
                          ))}
                        </div>
                        <Button variant={tier.accent ? "primary" : "secondary"} className="w-full">Get Started</Button>
                      </Card>
                    ))}
                  </div>
                </section>
              </>
            )}

            {/* Web App Mockup */}
            {activeNav === "webapp" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-6">Web App</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { title: "Active Projects", value: "12", badge: "3 new" },
                      { title: "Total Tracks", value: "847", badge: "+24 this week" },
                      { title: "Storage Used", value: "4.2 GB", badge: "of 10 GB" },
                    ].map((stat) => (
                      <Card key={stat.title} variant="flat">
                        <span className="hardware-label">{stat.title}</span>
                        <div className="flex items-baseline gap-2 mt-2">
                          <span className="text-2xl font-semibold text-[var(--color-text-primary)]">{stat.value}</span>
                          <Badge variant="info" size="small">{stat.badge}</Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                  <Card variant="flat" padding="spacious">
                    <h3 className="hardware-label mb-4">RECENT PROJECTS</h3>
                    <div className="space-y-3">
                      {[
                        { name: "Summer Vibes EP", tracks: 8, bpm: 120, status: "success" as const },
                        { name: "Dark Ambient Score", tracks: 14, bpm: 80, status: "warning" as const },
                        { name: "Drum & Bass WIP", tracks: 6, bpm: 174, status: "info" as const },
                      ].map((p) => (
                        <div key={p.name} className="flex items-center justify-between p-3 bg-[var(--color-bg-inset)] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)]">
                          <div className="flex items-center gap-3">
                            <IconProject size={18} className="text-[var(--color-text-muted)]" />
                            <div>
                              <div className="text-sm text-[var(--color-text-primary)]">{p.name}</div>
                              <div className="text-xs text-[var(--color-text-muted)]">{p.tracks} tracks | {p.bpm} BPM</div>
                            </div>
                          </div>
                          <Badge variant={p.status}>{p.status === "success" ? "Synced" : p.status === "warning" ? "Unsaved" : "In Progress"}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              </>
            )}

            {/* Desktop App Mockup */}
            {activeNav === "desktop" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-6">Desktop App</h2>
                  <Card variant="raised" padding="none">
                    <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={logo} alt="Antiphon" className="w-5 h-5 object-contain" />
                        <span className="text-sm font-semibold text-[var(--color-text-primary)]">Antiphon Desktop</span>
                        <span className="telemetry text-xs">Project: Summer Vibes EP</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="success" size="small">Connected</Badge>
                        <span className="telemetry text-xs">48 kHz / 24-bit</span>
                      </div>
                    </div>
                    <div className="p-6">
                      <Transport isPlaying={isPlaying} tempo={120} position="1.1.1" onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} onStop={() => setIsPlaying(false)} />
                      <div className="grid grid-cols-2 gap-4 mt-6">
                        <Waveform />
                        <SpectrumAnalyzer />
                      </div>
                    </div>
                  </Card>
                </section>
              </>
            )}

            {/* DAW Plugins Mockup */}
            {activeNav === "plugins" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-6">DAW Plugins</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card variant="raised" padding="none">
                      <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={logo} alt="" className="w-4 h-4 object-contain" />
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Antiphon EQ</span>
                        </div>
                        <Button variant="illuminated" size="compact" toggle>BYPASS</Button>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-around">
                          <Knob label="LOW" defaultValue={0} min={-12} max={12} unit=" dB" size="small" />
                          <Knob label="LOW MID" defaultValue={2} min={-12} max={12} unit=" dB" size="small" />
                          <Knob label="HIGH MID" defaultValue={-3} min={-12} max={12} unit=" dB" size="small" />
                          <Knob label="HIGH" defaultValue={1} min={-12} max={12} unit=" dB" size="small" />
                        </div>
                      </div>
                    </Card>
                    <Card variant="raised" padding="none">
                      <div className="px-4 py-2 bg-[var(--color-bg-app-shell)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={logo} alt="" className="w-4 h-4 object-contain" />
                          <span className="text-sm font-semibold text-[var(--color-text-primary)]">Antiphon Reverb</span>
                        </div>
                        <Button variant="illuminated" size="compact" toggle>BYPASS</Button>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-around">
                          <Knob label="SIZE" defaultValue={60} min={0} max={100} unit="%" size="small" />
                          <Knob label="DECAY" defaultValue={2.5} min={0.1} max={10} step={0.1} unit=" s" size="small" />
                          <Knob label="DAMP" defaultValue={4000} min={200} max={20000} unit=" Hz" size="small" />
                          <Knob label="MIX" defaultValue={30} min={0} max={100} unit="%" size="small" />
                        </div>
                      </div>
                    </Card>
                  </div>
                </section>
              </>
            )}

            {/* Hub Mockup */}
            {activeNav === "hub" && (
              <>
                <section>
                  <h2 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-6">Antiphon Hub</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { name: "Antiphon Compressor", version: "2.1.0", status: "success" as const, label: "Up to Date" },
                      { name: "Antiphon EQ", version: "1.8.2", status: "warning" as const, label: "Update Available" },
                      { name: "Antiphon Reverb", version: "1.5.0", status: "success" as const, label: "Up to Date" },
                      { name: "Antiphon Chorus", version: "1.2.1", status: "danger" as const, label: "License Expired" },
                      { name: "Antiphon Delay", version: "1.0.0", status: "default" as const, label: "Not Installed" },
                      { name: "Antiphon Synth", version: "3.0.0", status: "info" as const, label: "Beta" },
                    ].map((p) => (
                      <Card key={p.name} variant="flat">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <img src={logo} alt="" className="w-6 h-6 object-contain" />
                            <div>
                              <div className="text-sm font-semibold text-[var(--color-text-primary)]">{p.name}</div>
                              <div className="text-xs font-mono text-[var(--color-text-muted)]">v{p.version}</div>
                            </div>
                          </div>
                          <Badge variant={p.status}>{p.label}</Badge>
                        </div>
                        <Button variant={p.status === "warning" ? "primary" : "secondary"} size="compact" className="w-full">
                          {p.status === "warning" ? "Update" : p.status === "default" ? "Install" : p.status === "danger" ? "Renew License" : "Open"}
                        </Button>
                      </Card>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Import MIDI File"
        size="medium"
      >
        <div className="space-y-4">
          <p className="text-[var(--color-text-secondary)]">
            Select a MIDI file to import into your project. The file will be analyzed and converted to match your project settings.
          </p>

          <div className="border-2 border-dashed border-[var(--color-border-strong)] rounded-[var(--radius-lg)] p-12 text-center bg-[var(--color-bg-inset)]">
            <IconUpload size={32} className="text-[var(--color-text-muted)] mx-auto mb-3" />
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              Drop MIDI file here or click to browse
            </p>
            <p className="text-xs text-[var(--color-text-muted)]">
              Supports .mid and .midi files
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              <IconUpload size={16} />
              Import File
            </Button>
          </div>
        </div>
      </Modal>

      {/* Toast Container */}
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast
            message="Upload completed successfully"
            type="success"
            onClose={() => setShowToast(false)}
          />
        </div>
      )}
    </div>
  );
}

export default App;