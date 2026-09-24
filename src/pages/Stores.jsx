import API_BASE_URL from "../services/api";
import { useCallback, useEffect, useMemo, useState } from "react";

const STORE_API_URL =
  `${API_BASE_URL}/snowflake/stores?limit=1000`;

function Stores() {
  const [stores, setStores] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStore, setSelectedStore] = useState(null);

  // Fetch stores from the backend
  const fetchStores = useCallback(async (signal) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(STORE_API_URL, {
        signal
      });

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(
            "The Store API is temporarily unavailable. " +
            "The backend or Snowflake connection may not be ready."
          );
        }

        throw new Error(
          `Store API request failed: HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (
        data.status !== "success" ||
        !Array.isArray(data.stores)
      ) {
        throw new Error(
          "Invalid response received from the Store API."
        );
      }

      // Use only fields provided by the backend.
      const validStores = data.stores
        .filter(
          (store) =>
            store &&
            store.store_id !== null &&
            store.store_id !== undefined
        )
        .map((store) => ({
          store_id: store.store_id,
          store_name: store.store_name ?? "Unnamed Store",
          latitude: store.latitude,
          longitude: store.longitude
        }));

      setStores(validStores);
      setSelectedStore(null);
    } catch (err) {
      if (err.name === "AbortError") {
        return;
      }

      console.error("Store API Error:", err);

      setError(
        err instanceof TypeError
          ? "Cannot connect to the Store API. " +
            "Check that the backend is running and reachable."
          : err.message
      );

      setStores([]);
      setSelectedStore(null);
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, []);

  // Load stores when the page opens
  useEffect(() => {
    const controller = new AbortController();

    fetchStores(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchStores]);

  // Search by Store ID or Store Name
  const filteredStores = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    if (!search) {
      return stores;
    }

    return stores.filter((store) => {
      const id = String(store.store_id).toLowerCase();

      const name = String(
        store.store_name
      ).toLowerCase();

      return (
        id.includes(search) ||
        name.includes(search)
      );
    });
  }, [stores, searchTerm]);

  // Count stores with valid geographical coordinates
  const mappedLocations = useMemo(() => {
    return stores.filter((store) => {
      if (
        store.latitude === null ||
        store.longitude === null ||
        store.latitude === "" ||
        store.longitude === ""
      ) {
        return false;
      }

      const latitude = Number(store.latitude);
      const longitude = Number(store.longitude);

      return (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude >= -180 &&
        longitude <= 180
      );
    }).length;
  }, [stores]);

  const formatCoordinate = (value) => {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      return "N/A";
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number.toFixed(6)
      : "N/A";
  };

  return (
    <div className="stores-page">
      {/* Page Introduction */}

      <div className="page-intro">
        <div>
          <h2>Stores</h2>

          <p>
            Explore retail store locations monitored by
            GeoPulse.
          </p>
        </div>

        <button
          className="map-button"
          onClick={() => fetchStores()}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh Stores"}
        </button>
      </div>

      {/* Store Summary */}

      <div className="mobility-stats">
        <div className="mobility-stat-card">
          <span className="mobility-stat-icon">
            ▤
          </span>

          <div>
            <p>Total Stores</p>
            <h3>{loading || error ? "--" : stores.length}</h3>
          </div>
        </div>

        <div className="mobility-stat-card">
          <span className="mobility-stat-icon">
            ◉
          </span>

          <div>
            <p>Displayed Stores</p>

            <h3>
              {loading || error
                ? "--"
                : filteredStores.length}
            </h3>
          </div>
        </div>

        <div className="mobility-stat-card">
          <span className="mobility-stat-icon">
            ⌖
          </span>

          <div>
            <p>Mapped Locations</p>

            <h3>
              {loading || error ? "--" : mappedLocations}
            </h3>
          </div>
        </div>

        <div className="mobility-stat-card">
          <span className="mobility-stat-icon">
            ↑
          </span>

          <div>
            <p>Store Analytics</p>
            <h3>--</h3>
          </div>
        </div>
      </div>

      {/* Store List */}

      <div className="stores-card">
        <div className="stores-card-header">
          <div>
            <h3>Store Locations</h3>

            <p>
              Retail locations received from the backend
              Store API.
            </p>
          </div>

          <input
            type="search"
            placeholder="Search by Store ID or Name..."
            aria-label="Search stores"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="store-search"
          />
        </div>

        {/* Loading State */}

        {loading && (
          <div className="store-message">
            <h3>Loading Stores...</h3>

            <p>
              Fetching store data from the backend.
            </p>
          </div>
        )}

        {/* Error State */}

        {!loading && error && (
          <div className="store-error">
            <strong>Store API Error</strong>

            <p>{error}</p>

            <button
              className="store-view-button"
              onClick={() => fetchStores()}
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}

        {!loading && !error && stores.length === 0 && (
          <div className="store-message">
            <h3>No Stores Found</h3>

            <p>
              The backend returned no store records.
            </p>
          </div>
        )}

        {/* No Search Results */}

        {!loading &&
          !error &&
          stores.length > 0 &&
          filteredStores.length === 0 && (
            <div className="store-message">
              <h3>No Matching Stores</h3>

              <p>
                No stores match "{searchTerm}".
              </p>

              <button
                className="store-view-button"
                onClick={() => setSearchTerm("")}
              >
                Clear Search
              </button>
            </div>
          )}

        {/* Store Table */}

        {!loading &&
          !error &&
          filteredStores.length > 0 && (
            <div className="stores-table-container">
              <table className="stores-table">
                <thead>
                  <tr>
                    <th>Store ID</th>
                    <th>Store Name</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStores.map((store) => (
                    <tr key={String(store.store_id)}>
                      <td>
                        <strong>
                          {store.store_id}
                        </strong>
                      </td>

                      <td>{store.store_name}</td>

                      <td>
                        {formatCoordinate(store.latitude)}
                      </td>

                      <td>
                        {formatCoordinate(store.longitude)}
                      </td>

                      <td>
                        <button
                          className="store-view-button"
                          onClick={() =>
                            setSelectedStore(store)
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Selected Store Details */}

      {selectedStore && (
        <div className="store-details-panel">
          <div className="store-details-header">
            <div>
              <h3>{selectedStore.store_name}</h3>
              <p>Selected Store Information</p>
            </div>

            <button
              className="store-details-close"
              onClick={() => setSelectedStore(null)}
              aria-label="Close store details"
            >
              ×
            </button>
          </div>

          <div className="store-details-grid">
            <div>
              <span>Store ID</span>
              <strong>{selectedStore.store_id}</strong>
            </div>

            <div>
              <span>Store Name</span>
              <strong>{selectedStore.store_name}</strong>
            </div>

            <div>
              <span>Latitude</span>
              <strong>
                {formatCoordinate(
                  selectedStore.latitude
                )}
              </strong>
            </div>

            <div>
              <span>Longitude</span>
              <strong>
                {formatCoordinate(
                  selectedStore.longitude
                )}
              </strong>
            </div>
          </div>

          <p className="store-details-note">
            Additional store analytics will be integrated
            when the corresponding backend API is available.
          </p>
        </div>
      )}
    </div>
  );
}

export default Stores;