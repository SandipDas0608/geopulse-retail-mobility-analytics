import { useEffect, useState } from "react";
import {
  User,
  Palette,
  Map,
  Bell,
  Save,
  RotateCcw,
  CheckCircle,
  Settings as SettingsIcon,
} from "lucide-react";

import "./Settings.css";

const DEFAULT_SETTINGS = {
  //name: "Nikhil",
  role: "Frontend & UI Developer",
  theme: "light",
  density: "comfortable",
  mapZoom: "12",
  autoFitMap: true,
  showGpsPoints: true,
  showStores: true,
  emailNotifications: true,
  browserNotifications: false,
};

function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedSettings = localStorage.getItem("geopulse-settings");

    if (storedSettings) {
      try {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...JSON.parse(storedSettings),
        });
      } catch (error) {
        console.error("Failed to load saved settings:", error);
      }
    }
  }, []);

  const updateSetting = (key, value) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem(
      "geopulse-settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  const handleReset = () => {
    const confirmReset = window.confirm(
      "Are you sure you want to reset all GeoPulse settings?"
    );

    if (!confirmReset) return;

    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "geopulse-settings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  };

  return (
    <div
      className={`settings-page ${
        settings.theme === "dark" ? "settings-dark" : ""
      }`}
    >
      {/* Page Header */}
      <div className="settings-header">
        <div>
          <div className="settings-title-row">
            <SettingsIcon size={24} />
            <h1>Settings</h1>
          </div>

          <p>
            Manage your GeoPulse frontend preferences and application
            settings.
          </p>
        </div>

        <div className="settings-actions">
          <button
            className="settings-reset-btn"
            onClick={handleReset}
          >
            <RotateCcw size={17} />
            Reset
          </button>

          <button
            className="settings-save-btn"
            onClick={handleSave}
          >
            <Save size={17} />
            Save Settings
          </button>
        </div>
      </div>

      {/* Save Message */}
      {saved && (
        <div className="settings-success">
          <CheckCircle size={18} />
          Settings saved successfully.
        </div>
      )}

      <div className="settings-layout">

        {/* Profile */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <User size={20} />
            </div>

            <div>
              <h2>Profile</h2>
              <p>Your GeoPulse profile information.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label htmlFor="name">Name</label>

              <input
                id="name"
                type="text"
                value={settings.name}
                onChange={(e) =>
                  updateSetting("name", e.target.value)
                }
                placeholder="Enter your name"
              />
            </div>

            <div className="settings-field">
              <label htmlFor="role">Role</label>

              <input
                id="role"
                type="text"
                value={settings.role}
                onChange={(e) =>
                  updateSetting("role", e.target.value)
                }
                placeholder="Enter your role"
              />
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Palette size={20} />
            </div>

            <div>
              <h2>Appearance</h2>
              <p>Customize the visual preferences of the application.</p>
            </div>
          </div>

          <div className="settings-form-grid">
            <div className="settings-field">
              <label htmlFor="theme">Theme</label>

              <select
                id="theme"
                value={settings.theme}
                onChange={(e) =>
                  updateSetting("theme", e.target.value)
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>

            <div className="settings-field">
              <label htmlFor="density">Interface Density</label>

              <select
                id="density"
                value={settings.density}
                onChange={(e) =>
                  updateSetting("density", e.target.value)
                }
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>
          </div>
        </section>

        {/* Map Settings */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Map size={20} />
            </div>

            <div>
              <h2>Map Preferences</h2>
              <p>Configure the default GeoPulse mobility map behavior.</p>
            </div>
          </div>

          <div className="settings-form-grid">

            <div className="settings-field">
              <label htmlFor="mapZoom">
                Default Map Zoom
              </label>

              <select
                id="mapZoom"
                value={settings.mapZoom}
                onChange={(e) =>
                  updateSetting("mapZoom", e.target.value)
                }
              >
                <option value="10">10 - City Overview</option>
                <option value="11">11 - City Area</option>
                <option value="12">12 - Standard</option>
                <option value="13">13 - Detailed</option>
                <option value="14">14 - High Detail</option>
                <option value="15">15 - Street Level</option>
              </select>
            </div>

            <div className="settings-toggle-group">

              <label className="settings-toggle">
                <div>
                  <strong>Auto Fit Map</strong>
                  <span>
                    Automatically fit the map to available points.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={settings.autoFitMap}
                  onChange={(e) =>
                    updateSetting(
                      "autoFitMap",
                      e.target.checked
                    )
                  }
                />
              </label>

              <label className="settings-toggle">
                <div>
                  <strong>Show GPS Points</strong>
                  <span>
                    Display mobility GPS points on the map.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={settings.showGpsPoints}
                  onChange={(e) =>
                    updateSetting(
                      "showGpsPoints",
                      e.target.checked
                    )
                  }
                />
              </label>

              <label className="settings-toggle">
                <div>
                  <strong>Show Stores</strong>
                  <span>
                    Display store locations on the map.
                  </span>
                </div>

                <input
                  type="checkbox"
                  checked={settings.showStores}
                  onChange={(e) =>
                    updateSetting(
                      "showStores",
                      e.target.checked
                    )
                  }
                />
              </label>

            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <Bell size={20} />
            </div>

            <div>
              <h2>Notifications</h2>
              <p>Manage GeoPulse notification preferences.</p>
            </div>
          </div>

          <div className="settings-toggle-group">

            <label className="settings-toggle">
              <div>
                <strong>Email Notifications</strong>
                <span>
                  Receive important GeoPulse updates by email.
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  updateSetting(
                    "emailNotifications",
                    e.target.checked
                  )
                }
              />
            </label>

            <label className="settings-toggle">
              <div>
                <strong>Browser Notifications</strong>
                <span>
                  Allow browser notifications for important alerts.
                </span>
              </div>

              <input
                type="checkbox"
                checked={settings.browserNotifications}
                onChange={(e) =>
                  updateSetting(
                    "browserNotifications",
                    e.target.checked
                  )
                }
              />
            </label>

          </div>
        </section>

      </div>

      {/* Bottom Save Area */}
      <div className="settings-bottom">
        <div>
          <strong>GeoPulse Preferences</strong>
          <span>
            Settings are stored locally in your browser.
          </span>
        </div>

        <button
          className="settings-save-btn"
          onClick={handleSave}
        >
          <Save size={17} />
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default Settings;