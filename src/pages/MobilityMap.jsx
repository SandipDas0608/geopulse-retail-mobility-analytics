import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  useMap
} from "react-leaflet";

import L from "leaflet";

import API_BASE_URL from "../services/api";

import "leaflet/dist/leaflet.css";

const MOBILITY_API_URL =
  `${API_BASE_URL}/mobility/points?limit=1000`;

const STORE_API_URL =
  `${API_BASE_URL}/snowflake/stores?limit=1000`;

const DEFAULT_CENTER = [20.5937, 78.9629];

const storeIcon = L.divIcon({
  className: "geopulse-store-marker",
  html: `
    <div class="store-marker-pin">
      S
    </div>
  `,
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -30]
});

const gpsIcon = L.divIcon({
  className: "geopulse-gps-marker",
  html: `
    <div class="gps-marker-dot"></div>
  `,
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});


function MapBounds({
  points,
  stores,
  showPoints,
  showStores,
  skipFit
}) {
  const map = useMap();

  useEffect(() => {
    if (skipFit) {
      return;
    }

    const coordinates = [];

    if (showPoints) {
      points.forEach((point) => {
        coordinates.push([
          point.latitude,
          point.longitude
        ]);
      });
    }

    if (showStores) {
      stores.forEach((store) => {
        coordinates.push([
          store.latitude,
          store.longitude
        ]);
      });
    }

    if (coordinates.length === 0) {
      return;
    }

    const bounds =
      L.latLngBounds(coordinates);

    if (coordinates.length === 1) {
      map.setView(
        coordinates[0],
        14
      );
    } else {
      map.fitBounds(
        bounds,
        {
          padding: [40, 40]
        }
      );
    }
  }, [
    map,
    points,
    stores,
    showPoints,
    showStores,
    skipFit
  ]);

  return null;
}


function MapSearchController({
  selectedPoint,
  selectedStore,
  selectedMarkerRef,
  selectedStoreRef
}) {
  const map = useMap();

  useEffect(() => {
    if (!selectedPoint) {
      return;
    }

    map.flyTo(
      [
        selectedPoint.latitude,
        selectedPoint.longitude
      ],
      17,
      {
        duration: 1.2
      }
    );

    const timer = setTimeout(() => {
      if (selectedMarkerRef.current) {
        selectedMarkerRef.current.openPopup();
      }
    }, 1300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    selectedPoint,
    selectedMarkerRef,
    map
  ]);


  useEffect(() => {
    if (!selectedStore) {
      return;
    }

    map.flyTo(
      [
        selectedStore.latitude,
        selectedStore.longitude
      ],
      16,
      {
        duration: 1.2
      }
    );

    const timer = setTimeout(() => {
      if (selectedStoreRef.current) {
        selectedStoreRef.current.openPopup();
      }
    }, 1300);

    return () => {
      clearTimeout(timer);
    };
  }, [
    selectedStore,
    selectedStoreRef,
    map
  ]);

  return null;
}


function MobilityMap() {

  const [points, setPoints] =
    useState([]);

  const [stores, setStores] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [storesLoading, setStoresLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [storesError, setStoresError] =
    useState("");

  const [timeFilter, setTimeFilter] =
    useState("all");

  const [deviceSearch, setDeviceSearch] =
    useState("");

  const [mapSearch, setMapSearch] =
    useState("");

  const [selectedPoint, setSelectedPoint] =
    useState(null);

  const [selectedStore, setSelectedStore] =
    useState(null);

  const [searchMessage, setSearchMessage] =
    useState("");

  const [showPoints, setShowPoints] =
    useState(true);

  const [showStores, setShowStores] =
    useState(true);


  const selectedMarkerRef =
    useRef(null);

  const selectedStoreRef =
    useRef(null);


  /*
   * Fetch Mobility Data
   */
  const fetchMobilityPoints =
    useCallback(
      async (signal) => {

        try {

          setLoading(true);
          setError("");

          const response =
            await fetch(
              MOBILITY_API_URL,
              {
                signal
              }
            );


          if (!response.ok) {

            throw new Error(
              `Mobility API request failed: HTTP ${response.status}`
            );

          }


          const data =
            await response.json();


          if (
            data.status !== "success" ||
            !Array.isArray(data.points)
          ) {

            throw new Error(
              "Invalid mobility API response received from the backend."
            );

          }


          const validPoints =
            data.points.filter(
              (point) =>
                Number.isFinite(
                  Number(point.latitude)
                ) &&
                Number.isFinite(
                  Number(point.longitude)
                )
            );


          setPoints(
            validPoints.map(
              (point) => ({
                ...point,
                latitude:
                  Number(
                    point.latitude
                  ),
                longitude:
                  Number(
                    point.longitude
                  )
              })
            )
          );

        } catch (err) {

          if (
            err.name === "AbortError"
          ) {
            return;
          }


          console.error(
            "Mobility API Error:",
            err
          );


          if (
            err instanceof TypeError
          ) {

            setError(
              "Cannot connect to the Mobility API. " +
              "Please check that the backend is running and reachable."
            );

          } else {

            setError(
              err.message ||
              "Failed to load mobility data."
            );

          }

        } finally {

          if (
            !signal?.aborted
          ) {
            setLoading(false);
          }

        }

      },
      []
    );


  /*
   * Fetch Store Data
   */
  const fetchStores =
    useCallback(
      async (signal) => {

        try {

          setStoresLoading(true);
          setStoresError("");

          const response =
            await fetch(
              STORE_API_URL,
              {
                signal
              }
            );


          if (!response.ok) {

            if (
              response.status === 503
            ) {

              throw new Error(
                "Store API is temporarily unavailable. " +
                "The backend or Snowflake connection may not be ready."
              );

            }


            throw new Error(
              `Store API request failed: HTTP ${response.status}`
            );

          }


          const data =
            await response.json();


          if (
            data.status !== "success" ||
            !Array.isArray(data.stores)
          ) {

            throw new Error(
              "Invalid store API response received from the backend."
            );

          }


          const validStores =
            data.stores.filter(
              (store) =>
                Number.isFinite(
                  Number(store.latitude)
                ) &&
                Number.isFinite(
                  Number(store.longitude)
                )
            );


          setStores(
            validStores.map(
              (store) => ({
                ...store,
                latitude:
                  Number(
                    store.latitude
                  ),
                longitude:
                  Number(
                    store.longitude
                  )
              })
            )
          );

        } catch (err) {

          if (
            err.name === "AbortError"
          ) {
            return;
          }


          console.error(
            "Store API Error:",
            err
          );


          if (
            err instanceof TypeError
          ) {

            setStoresError(
              "Cannot connect to the Store API. " +
              "Please check that the backend is running and reachable."
            );

          } else {

            setStoresError(
              err.message ||
              "Failed to load store data."
            );

          }

        } finally {

          if (
            !signal?.aborted
          ) {
            setStoresLoading(false);
          }

        }

      },
      []
    );


  /*
   * Fetch All Map Data
   */
  const fetchMapData =
    useCallback(
      async (signal) => {

        await Promise.all([
          fetchMobilityPoints(signal),
          fetchStores(signal)
        ]);

      },
      [
        fetchMobilityPoints,
        fetchStores
      ]
    );


  /*
   * Initial Map Load
   */
  useEffect(() => {

    const controller =
      new AbortController();


    fetchMapData(
      controller.signal
    );


    return () => {
      controller.abort();
    };

  }, [
    fetchMapData
  ]);


  /*
   * Filter Mobility Points
   */
  const filteredPoints =
    useMemo(() => {

      let result = [
        ...points
      ];


      const now =
        new Date();


      if (
        timeFilter !== "all"
      ) {

        result =
          result.filter(
            (point) => {

              const pointDate =
                new Date(
                  point.timestamp
                );


              if (
                Number.isNaN(
                  pointDate.getTime()
                )
              ) {
                return false;
              }


              const diffHours =
                (
                  now -
                  pointDate
                ) /
                (1000 * 60 * 60);


              if (
                timeFilter === "today"
              ) {

                return (
                  pointDate.toDateString() ===
                  now.toDateString()
                );

              }


              if (
                timeFilter === "24h"
              ) {

                return (
                  diffHours >= 0 &&
                  diffHours <= 24
                );

              }


              if (
                timeFilter === "7d"
              ) {

                return (
                  diffHours >= 0 &&
                  diffHours <= 168
                );

              }


              return true;

            }
          );

      }


      if (
        deviceSearch.trim()
      ) {

        const query =
          deviceSearch
            .trim()
            .toLowerCase();


        result =
          result.filter(
            (point) =>
              String(
                point.device_id
              )
                .toLowerCase()
                .includes(query)
          );

      }


      return result;

    }, [
      points,
      timeFilter,
      deviceSearch
    ]);


  /*
   * Map Search
   */
  const handleMapSearch =
    () => {

      const query =
        mapSearch
          .trim()
          .toLowerCase();


      if (!query) {

        setSearchMessage(
          "Enter a Device ID, Store ID, Store Name, latitude, or longitude."
        );

        return;
      }


      const mobilityMatch =
        filteredPoints.find(
          (point) => {

            const deviceId =
              String(
                point.device_id
              )
                .toLowerCase();


            const latitude =
              String(
                point.latitude
              );


            const longitude =
              String(
                point.longitude
              );


            return (
              deviceId.includes(query) ||
              latitude.includes(query) ||
              longitude.includes(query)
            );

          }
        );


      if (
        mobilityMatch
      ) {

        setSelectedStore(null);
        setSelectedPoint(
          mobilityMatch
        );

        setSearchMessage(
          `GPS point found for device ${mobilityMatch.device_id}.`
        );

        return;
      }


      const storeMatch =
        stores.find(
          (store) => {

            const storeId =
              String(
                store.store_id
              )
                .toLowerCase();


            const storeName =
              String(
                store.store_name
              )
                .toLowerCase();


            const latitude =
              String(
                store.latitude
              );


            const longitude =
              String(
                store.longitude
              );


            return (
              storeId.includes(query) ||
              storeName.includes(query) ||
              latitude.includes(query) ||
              longitude.includes(query)
            );

          }
        );


      if (
        storeMatch
      ) {

        setSelectedPoint(null);
        setSelectedStore(
          storeMatch
        );

        setSearchMessage(
          `Store found: ${storeMatch.store_name}.`
        );

        return;
      }


      setSelectedPoint(null);
      setSelectedStore(null);

      setSearchMessage(
        "No matching GPS point or store was found."
      );

    };


  /*
   * Clear Map Search
   */
  const clearMapSearch =
    () => {

      setMapSearch("");
      setSelectedPoint(null);
      setSelectedStore(null);
      setSearchMessage("");

    };


  /*
   * Reset Filters
   */
  const resetFilters =
    () => {

      setTimeFilter("all");
      setDeviceSearch("");
      clearMapSearch();

    };


  const mobilityStatus =
    loading
      ? "Loading..."
      : error
      ? "Unavailable"
      : `${filteredPoints.length} visible`;


  const storeStatus =
    storesLoading
      ? "Loading..."
      : storesError
      ? "Unavailable"
      : `${stores.length} stores`;


  return (

    <div className="mobility-map-page">

      {/* Page Header */}

      <div className="page-header">

        <div>

          <h1>
            Mobility Map
          </h1>

          <p>
            Explore real mobility GPS points
            and store locations.
          </p>

        </div>


        <button
          className="refresh-button"
          onClick={() => {

            const controller =
              new AbortController();

            fetchMapData(
              controller.signal
            );

          }}
          disabled={
            loading ||
            storesLoading
          }
        >

          {loading || storesLoading
            ? "Refreshing..."
            : "Refresh Map"}

        </button>

      </div>


      {/* Statistics */}

      <div className="stats-grid">

        <div className="stat-card">

          <span>
            Total GPS Pings
          </span>

          <strong>
            {loading && points.length === 0
              ? "..."
              : points.length}
          </strong>

        </div>


        <div className="stat-card">

          <span>
            Visible GPS Points
          </span>

          <strong>
            {loading && points.length === 0
              ? "..."
              : filteredPoints.length}
          </strong>

        </div>


        <div className="stat-card">

          <span>
            Stores
          </span>

          <strong>
            {storesLoading && stores.length === 0
              ? "..."
              : stores.length}
          </strong>

        </div>


        <div className="stat-card">

          <span>
            Map Status
          </span>

          <strong>
            {loading ||
            storesLoading
              ? "Loading"
              : error || storesError
              ? "Partial"
              : "Ready"}
          </strong>

        </div>

      </div>


      {/* Map Section */}

      <div className="map-section">

        <div className="section-header">

          <div>

            <h2>
              Advanced Mobility Map
            </h2>

            <p>
              GPS mobility activity and
              retail store locations.
            </p>

          </div>


          <div className="map-layer-controls">

            <label className="layer-toggle">

              <input
                type="checkbox"
                checked={showPoints}
                onChange={(event) => {

                  setShowPoints(
                    event.target.checked
                  );

                  setSelectedPoint(null);

                }}
              />

              <span>
                GPS Points
              </span>

            </label>


            <label className="layer-toggle">

              <input
                type="checkbox"
                checked={showStores}
                onChange={(event) => {

                  setShowStores(
                    event.target.checked
                  );

                  setSelectedStore(null);

                }}
              />

              <span>
                Stores
              </span>

            </label>

          </div>

        </div>


        {/* Filters */}

        <div className="map-filters">

          <div className="filter-group">

            <label>
              Time Range
            </label>

            <select
              value={timeFilter}
              onChange={(event) =>
                setTimeFilter(
                  event.target.value
                )
              }
            >

              <option value="all">
                All Points
              </option>

              <option value="today">
                Today
              </option>

              <option value="24h">
                Last 24 Hours
              </option>

              <option value="7d">
                Last 7 Days
              </option>

            </select>

          </div>


          <div className="filter-group">

            <label>
              Device ID
            </label>

            <input
              type="text"
              value={deviceSearch}
              onChange={(event) =>
                setDeviceSearch(
                  event.target.value
                )
              }
              placeholder="Search Device ID"
            />

          </div>


          <div className="filter-group map-search-group">

            <label>
              Map Search
            </label>

            <div className="map-search-box">

              <input
                type="text"
                value={mapSearch}
                onChange={(event) =>
                  setMapSearch(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {

                  if (
                    event.key === "Enter"
                  ) {
                    handleMapSearch();
                  }

                }}
                placeholder="Device, Store ID, Store Name..."
              />


              <button
                className="map-search-button"
                onClick={
                  handleMapSearch
                }
              >
                Search
              </button>


              <button
                className="map-search-clear"
                onClick={
                  clearMapSearch
                }
                aria-label="Clear map search"
              >
                ×
              </button>

            </div>

          </div>


          <button
            className="filter-reset-button"
            onClick={
              resetFilters
            }
          >
            Reset
          </button>

        </div>


        {/* Search Message */}

        {searchMessage && (

          <div className="map-search-message">

            {searchMessage}

          </div>

        )}


        {/* Mobility Error */}

        {error && (

          <div className="map-error">

            <strong>
              Mobility data unavailable
            </strong>

            <p>
              {error}
            </p>

            <button
              className="retry-button"
              onClick={() => {

                const controller =
                  new AbortController();

                fetchMobilityPoints(
                  controller.signal
                );

              }}
              disabled={loading}
            >

              {loading
                ? "Retrying..."
                : "Retry Mobility"}

            </button>

          </div>

        )}


        {/* Store Error */}

        {storesError && (

          <div className="map-error">

            <strong>
              Store data unavailable
            </strong>

            <p>
              {storesError}
            </p>

            <button
              className="retry-button"
              onClick={() => {

                const controller =
                  new AbortController();

                fetchStores(
                  controller.signal
                );

              }}
              disabled={storesLoading}
            >

              {storesLoading
                ? "Retrying..."
                : "Retry Stores"}

            </button>

          </div>

        )}


        {/* Status Bar */}

        <div className="map-status-bar">

          <span>
            GPS: {mobilityStatus}
          </span>

          <span>
            Stores: {storeStatus}
          </span>

        </div>


        {/* Map */}

        <div className="mobility-map">

          {(loading ||
            storesLoading) &&
          points.length === 0 &&
          stores.length === 0 ? (

            <div className="map-loading">

              <strong>
                Loading map data...
              </strong>

              <span>
                Connecting to GeoPulse APIs.
              </span>

            </div>

          ) : (

            <MapContainer
              center={DEFAULT_CENTER}
              zoom={5}
              scrollWheelZoom={true}
              className="leaflet-map"
            >

              <TileLayer
                attribution="&copy; OpenStreetMap contributors"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />


              <MapBounds
                points={
                  filteredPoints
                }
                stores={stores}
                showPoints={
                  showPoints
                }
                showStores={
                  showStores
                }
                skipFit={
                  Boolean(
                    selectedPoint ||
                    selectedStore
                  )
                }
              />


              <MapSearchController
                selectedPoint={
                  selectedPoint
                }
                selectedStore={
                  selectedStore
                }
                selectedMarkerRef={
                  selectedMarkerRef
                }
                selectedStoreRef={
                  selectedStoreRef
                }
              />


              {/* GPS Point Circles */}

              {showPoints &&
                filteredPoints.map(
                  (
                    point,
                    index
                  ) => {

                    const isSelected =
                      selectedPoint ===
                      point;


                    return (

                      <Circle
                        key={
                          `${point.device_id}-${point.timestamp}-${index}`
                        }
                        center={[
                          point.latitude,
                          point.longitude
                        ]}
                        radius={
                          isSelected
                            ? 8
                            : 5
                        }
                        pathOptions={{
                          fillOpacity:
                            isSelected
                              ? 0.9
                              : 0.65,
                          opacity: 0.8
                        }}
                      />

                    );

                  }
                )}


              {/* Selected GPS Marker */}

              {showPoints &&
                filteredPoints.map(
                  (
                    point,
                    index
                  ) => {

                    if (
                      selectedPoint !==
                      point
                    ) {
                      return null;
                    }


                    return (

                      <Marker
                        key={
                          `selected-${index}`
                        }
                        position={[
                          point.latitude,
                          point.longitude
                        ]}
                        icon={
                          gpsIcon
                        }
                        ref={
                          selectedMarkerRef
                        }
                      >

                        <Popup>

                          <strong>
                            GPS Mobility Point
                          </strong>

                          <br />

                          Device ID:{" "}
                          {
                            point.device_id
                          }

                          <br />

                          Latitude:{" "}
                          {
                            point.latitude
                          }

                          <br />

                          Longitude:{" "}
                          {
                            point.longitude
                          }

                          <br />

                          Timestamp:{" "}
                          {
                            point.timestamp
                          }

                        </Popup>

                      </Marker>

                    );

                  }
                )}


              {/* Store Markers */}

              {showStores &&
                stores.map(
                  (store) => {

                    const isSelected =
                      selectedStore ===
                      store;


                    return (

                      <Marker
                        key={
                          String(
                            store.store_id
                          )
                        }
                        position={[
                          store.latitude,
                          store.longitude
                        ]}
                        icon={
                          storeIcon
                        }
                        ref={
                          isSelected
                            ? selectedStoreRef
                            : null
                        }
                      >

                        <Popup>

                          <strong>
                            {
                              store.store_name
                            }
                          </strong>

                          <br />

                          Store ID:{" "}
                          {
                            store.store_id
                          }

                          <br />

                          Latitude:{" "}
                          {
                            store.latitude
                          }

                          <br />

                          Longitude:{" "}
                          {
                            store.longitude
                          }

                        </Popup>

                      </Marker>

                    );

                  }
                )}

            </MapContainer>

          )}


          {/* Map Overlay */}

          <div className="map-overlay">

            <strong>
              GeoPulse Advanced Map
            </strong>

            <span>
              GPS:{" "}
              {filteredPoints.length}
            </span>

            <span>
              Stores:{" "}
              {stores.length}
            </span>

          </div>

        </div>


        {/* Legend */}

        <div className="map-legend">

          <div className="legend-item">

            <span className="legend-dot gps-legend"></span>

            GPS Mobility

          </div>


          <div className="legend-item">

            <span className="legend-dot store-legend"></span>

            Store Location

          </div>

        </div>


        {/* Data Note */}

        <div className="map-note">

          GPS points represent anonymized
          mobility activity. They should not
          be interpreted as exact visitor
          counts.

        </div>

      </div>

    </div>

  );
}


export default MobilityMap;