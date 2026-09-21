import { useEffect, useMemo, useState } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import L from "leaflet";


// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",

  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",

  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});


// Keep the current backend URL for now.
// We will move this to one API configuration file
// when your friend provides the public backend URL.

const API_URL =
  "http://127.0.0.1:8000/mobility/points?limit=1000";


// Automatically fit the map to visible points
function MapBounds({ points }) {

  const map = useMap();

  useEffect(() => {

    if (!points || points.length === 0) {
      return;
    }

    const bounds = L.latLngBounds(
      points.map((point) => [
        Number(point.latitude),
        Number(point.longitude)
      ])
    );

    map.fitBounds(bounds, {
      padding: [40, 40]
    });

  }, [points, map]);

  return null;
}


function MobilityMap() {

  const [points, setPoints] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  // Filter state
  const [timeFilter, setTimeFilter] = useState("all");

  const [deviceSearch, setDeviceSearch] = useState("");


  // Fetch mobility data
  const fetchMobilityPoints = async () => {

    try {

      setLoading(true);

      setError("");

      const response = await fetch(API_URL);


      if (!response.ok) {

        throw new Error(
          `API request failed with status ${response.status}`
        );

      }


      const data = await response.json();


      if (!Array.isArray(data.points)) {

        throw new Error(
          "Invalid mobility API response."
        );

      }


      setPoints(data.points);

    } catch (err) {

      console.error(
        "Mobility Points API Error:",
        err
      );

      setError(
        "Unable to load mobility points from the backend."
      );

      setPoints([]);

    } finally {

      setLoading(false);

    }

  };


  // Load data when page opens
  useEffect(() => {

    fetchMobilityPoints();

  }, []);


  /*
   * Apply filters to the real backend data.
   */
  const filteredPoints = useMemo(() => {

    let result = [...points];


    // Device ID search
    if (deviceSearch.trim() !== "") {

      const search =
        deviceSearch
          .trim()
          .toLowerCase();

      result = result.filter((point) =>
        String(point.device_id || "")
          .toLowerCase()
          .includes(search)
      );

    }


    // Time filter
    if (timeFilter !== "all") {

      const now = new Date();

      let startTime = null;


      if (timeFilter === "today") {

        startTime = new Date();

        startTime.setHours(
          0,
          0,
          0,
          0
        );

      }


      if (timeFilter === "24h") {

        startTime =
          new Date(
            now.getTime() -
            24 * 60 * 60 * 1000
          );

      }


      if (timeFilter === "7d") {

        startTime =
          new Date(
            now.getTime() -
            7 * 24 * 60 * 60 * 1000
          );

      }


      if (startTime) {

        result = result.filter((point) => {

          if (!point.timestamp) {
            return false;
          }

          const pointDate =
            new Date(point.timestamp);

          return (
            !Number.isNaN(pointDate.getTime()) &&
            pointDate >= startTime
          );

        });

      }

    }


    return result;

  }, [
    points,
    timeFilter,
    deviceSearch
  ]);


  // First visible point becomes map center
  const mapCenter =
    filteredPoints.length > 0
      ? [
          Number(filteredPoints[0].latitude),
          Number(filteredPoints[0].longitude)
        ]
      : null;


  return (

    <div className="mobility-page">


      {/* Page Introduction */}

      <div className="page-intro">

        <div>

          <h2>
            Mobility Map
          </h2>

          <p>
            Explore hyper-local mobility patterns,
            foot traffic, and high-traffic retail zones.
          </p>

        </div>


        <button
          className="map-button"
          onClick={fetchMobilityPoints}
          disabled={loading}
        >

          {loading
            ? "Loading..."
            : "Refresh Map"}

        </button>

      </div>


      {/* Mobility Statistics */}

      <div className="mobility-stats">


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ⌖
          </span>

          <div>

            <p>
              Total GPS Pings
            </p>

            <h3>

              {loading
                ? "--"
                : points.length}

            </h3>

          </div>

        </div>


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ◉
          </span>

          <div>

            <p>
              Visible Points
            </p>

            <h3>

              {loading
                ? "--"
                : filteredPoints.length}

            </h3>

          </div>

        </div>


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ↑
          </span>

          <div>

            <p>
              Active Zones
            </p>

            <h3>
              --
            </h3>

          </div>

        </div>


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ▤
          </span>

          <div>

            <p>
              Nearby Stores
            </p>

            <h3>
              --
            </h3>

          </div>

        </div>

      </div>


      {/* Map Card */}

      <div className="map-card">


        <div className="map-card-header">

          <div>

            <h3>
              Retail Mobility Overview
            </h3>

            <p>
              Interactive visualization of mobility
              activity and retail locations
            </p>

          </div>


          <div className="map-status">

            <span className="status-dot"></span>

            {loading
              ? "Loading Map"
              : error
              ? "API Error"
              : "Live Map"}

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
              placeholder="Search device..."
              value={deviceSearch}
              onChange={(event) =>
                setDeviceSearch(
                  event.target.value
                )
              }
            />

          </div>


          <button
            className="filter-reset-button"
            onClick={() => {

              setTimeFilter("all");

              setDeviceSearch("");

            }}
          >
            Reset Filters
          </button>


        </div>


        {/* API Error */}

        {error && (

          <div
            style={{
              padding: "15px",
              margin: "15px",
              borderRadius: "8px",
              background: "#fff1f2",
              border: "1px solid #fecdd3",
              color: "#be123c"
            }}
          >

            <strong>
              Mobility API Error
            </strong>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* Interactive Map */}

        <div className="mobility-map">


          {/* Loading */}

          {loading && (

            <div
              style={{
                height: "100%",
                minHeight: "500px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#f8fafc"
              }}
            >

              <div style={{ textAlign: "center" }}>

                <h3>
                  Loading Mobility Data...
                </h3>

                <p>
                  Fetching GPS points from backend.
                </p>

              </div>

            </div>

          )}


          {/* No filtered results */}

          {!loading &&
            !error &&
            points.length > 0 &&
            filteredPoints.length === 0 && (

              <div
                style={{
                  height: "100%",
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc"
                }}
              >

                <div style={{ textAlign: "center" }}>

                  <h3>
                    No Matching Mobility Points
                  </h3>

                  <p>
                    Try changing the filters.
                  </p>

                </div>

              </div>

            )}


          {/* No backend data */}

          {!loading &&
            !error &&
            points.length === 0 && (

              <div
                style={{
                  height: "100%",
                  minHeight: "500px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#f8fafc"
                }}
              >

                <div style={{ textAlign: "center" }}>

                  <h3>
                    No Mobility Points Found
                  </h3>

                  <p>
                    The backend returned no GPS points.
                  </p>

                </div>

              </div>

            )}


          {/* Leaflet Map */}

          {!loading &&
            !error &&
            filteredPoints.length > 0 &&
            mapCenter && (

              <MapContainer
                center={mapCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="leaflet-map"
              >

                <TileLayer
                  attribution='&copy; OpenStreetMap contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />


                <MapBounds
                  points={filteredPoints}
                />


                {/* Filtered GPS Points */}

                {filteredPoints.map(
                  (point, index) => (

                    <Marker
                      key={
                        `${point.device_id}-${point.timestamp}-${index}`
                      }
                      position={[
                        Number(point.latitude),
                        Number(point.longitude)
                      ]}
                    >

                      <Popup>

                        <strong>
                          Mobility Point
                        </strong>

                        <br />

                        <strong>
                          Device ID:
                        </strong>{" "}

                        {point.device_id || "N/A"}

                        <br />

                        <strong>
                          Latitude:
                        </strong>{" "}

                        {point.latitude}

                        <br />

                        <strong>
                          Longitude:
                        </strong>{" "}

                        {point.longitude}

                        <br />

                        <strong>
                          Timestamp:
                        </strong>{" "}

                        {point.timestamp
                          ? new Date(
                              point.timestamp
                            ).toLocaleString()
                          : "N/A"}

                      </Popup>

                    </Marker>

                  )
                )}

              </MapContainer>

            )}


          {/* Map Overlay */}

          {!loading &&
            !error &&
            filteredPoints.length > 0 && (

              <div className="map-overlay">

                <strong>
                  Mobility Analysis Area
                </strong>

                <span>
                  {filteredPoints.length} points visible
                </span>

              </div>

            )}

        </div>


        {/* Map Legend */}

        <div className="map-legend">

          <h4>
            Traffic Intensity
          </h4>


          <div className="legend-items">

            <div className="legend-item">

              <span className="legend-dot low"></span>

              Low Traffic

            </div>


            <div className="legend-item">

              <span className="legend-dot medium"></span>

              Medium Traffic

            </div>


            <div className="legend-item">

              <span className="legend-dot high"></span>

              High Traffic

            </div>

          </div>

        </div>


      </div>

    </div>

  );
}


export default MobilityMap;