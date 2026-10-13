import API_BASE_URL from "../services/api";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// ===============================
// API CONFIGURATION
// ===============================

const STORE_API_URL =
  `${API_BASE_URL}/snowflake/stores?limit=100`;

const CANNIBALIZATION_API_URL =
  `${API_BASE_URL}/snowflake/cannibalization`;

// ===============================
// FORMAT PERCENTAGE
// ===============================

function formatPercentage(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0.0%";
  }

  return `${number.toFixed(1)}%`;
}

// ===============================
// MAIN COMPONENT
// ===============================

function Cannibalization() {
  const [stores, setStores] = useState([]);

  const [cannibalizationPairs, setCannibalizationPairs] =
    useState([]);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [storeApiWarning, setStoreApiWarning] =
    useState("");

  const [selectedPair, setSelectedPair] =
    useState(null);

  // Keep track of the current API request
  const requestControllerRef =
    useRef(null);

  // ===============================
  // FETCH STORES
  // ===============================

  const fetchStores = useCallback(
    async (signal) => {
      const response =
        await fetch(
          STORE_API_URL,
          { signal }
        );

      if (!response.ok) {
        if (response.status === 503) {
          throw new Error(
            "The Store API is temporarily unavailable."
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
          "Invalid response received from the Store API."
        );
      }

      return data.stores
        .filter(
          (store) =>
            store &&
            store.store_id !== null &&
            store.store_id !== undefined
        )
        .map((store) => ({
          store_id: store.store_id,

          store_name:
            store.store_name ??
            "Unnamed Store",

          latitude:
            store.latitude,

          longitude:
            store.longitude
        }));
    },
    []
  );

  // ===============================
  // FETCH CANNIBALIZATION DATA
  // ===============================

  const fetchCannibalizationPairs =
    useCallback(
      async (signal) => {
        const response =
          await fetch(
            CANNIBALIZATION_API_URL,
            { signal }
          );

        if (!response.ok) {
          if (response.status === 503) {
            throw new Error(
              "The Cannibalization API is temporarily unavailable. " +
              "The backend or Snowflake connection may not be ready."
            );
          }

          throw new Error(
            `Cannibalization API request failed: HTTP ${response.status}`
          );
        }

        const data =
          await response.json();

        if (
          data.status !== "success" ||
          !Array.isArray(data.pairs)
        ) {
          throw new Error(
            "Invalid response received from the Cannibalization API."
          );
        }

        return data.pairs;
      },
      []
    );

  // ===============================
  // LOAD ALL DATA
  // ===============================

  const fetchCannibalizationData =
    useCallback(
      async (signal) => {
        try {
          setLoading(true);
          setError("");
          setStoreApiWarning("");

          /*
           * Fetch both APIs independently.
           *
           * The Cannibalization API is the main
           * data source for this page.
           *
           * Store API is only used for the
           * Total Stores summary.
           */

          const pairPromise =
            fetchCannibalizationPairs(
              signal
            );

          const storePromise =
            fetchStores(
              signal
            );

          const [
            pairResult,
            storeResult
          ] = await Promise.allSettled([
            pairPromise,
            storePromise
          ]);

          if (signal?.aborted) {
            return;
          }

          // ===============================
          // CANNIBALIZATION RESULT
          // ===============================

          if (
            pairResult.status ===
            "rejected"
          ) {
            throw pairResult.reason;
          }

          const pairData =
            pairResult.value;

          // ===============================
          // STORE RESULT
          // ===============================

          if (
            storeResult.status ===
            "fulfilled"
          ) {
            setStores(
              storeResult.value
            );
          } else {
            /*
             * Store data is supplementary.
             * Don't fail the whole page if
             * only the Store API fails.
             */

            setStores([]);

            setStoreApiWarning(
              "Store summary data is temporarily unavailable."
            );
          }

          // ===============================
          // SAVE CANNIBALIZATION DATA
          // ===============================

          setCannibalizationPairs(
            pairData
          );

          setSelectedPair(null);

        } catch (err) {
          if (
            err?.name ===
            "AbortError"
          ) {
            return;
          }

          console.error(
            "Cannibalization API Error:",
            err
          );

          if (
            err instanceof TypeError
          ) {
            setError(
              `Unable to connect to the GeoPulse backend at ${API_BASE_URL}. ` +
              "Please check that the backend and Cloudflare tunnel are running."
            );
          } else {
            setError(
              err?.message ||
              "Unable to load cannibalization data."
            );
          }

          setCannibalizationPairs([]);

          setSelectedPair(null);

        } finally {
          if (
            !signal?.aborted
          ) {
            setLoading(false);
          }
        }
      },
      [
        fetchStores,
        fetchCannibalizationPairs
      ]
    );

  // ===============================
  // LOAD DATA WHEN PAGE OPENS
  // ===============================

  useEffect(() => {
    const controller =
      new AbortController();

    requestControllerRef.current =
      controller;

    fetchCannibalizationData(
      controller.signal
    );

    return () => {
      controller.abort();

      if (
        requestControllerRef.current ===
        controller
      ) {
        requestControllerRef.current =
          null;
      }
    };
  }, [
    fetchCannibalizationData
  ]);

  // ===============================
  // MAP NEW BACKEND RESPONSE
  // ===============================

  const storePairs =
    useMemo(() => {
      return cannibalizationPairs
        .map((pair) => ({
          existingStoreName:
            String(
              pair.existing_store_name ??
              "Unknown Store"
            ),

          newStoreName:
            String(
              pair.new_store_name ??
              "Unknown Store"
            ),

          sharedVisitorsCount:
            Number(
              pair.shared_visitors_count
            ) || 0,

          totalExistingCustomers:
            Number(
              pair.total_existing_customers
            ) || 0,

          cannibalizationPercentage:
            Number(
              pair.cannibalization_percentage
            ) || 0
        }))
        .filter(
          (pair) =>
            pair.existingStoreName &&
            pair.newStoreName
        );
    }, [
      cannibalizationPairs
    ]);

  // ===============================
  // SEARCH
  // ===============================

  const filteredPairs =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase();

      if (!search) {
        return storePairs;
      }

      return storePairs.filter(
        (pair) => {
          const existingStore =
            pair.existingStoreName
              .toLowerCase();

          const newStore =
            pair.newStoreName
              .toLowerCase();

          return (
            existingStore.includes(
              search
            ) ||
            newStore.includes(
              search
            )
          );
        }
      );
    }, [
      storePairs,
      searchTerm
    ]);

  // ===============================
  // STORES INVOLVED IN PAIRS
  // ===============================

  const storesWithRelations =
    useMemo(() => {
      const names =
        new Set();

      storePairs.forEach(
        (pair) => {
          names.add(
            pair.existingStoreName
          );

          names.add(
            pair.newStoreName
          );
        }
      );

      return names.size;
    }, [
      storePairs
    ]);

  // ===============================
  // AVERAGE CANNIBALIZATION
  // ===============================

  const averageCannibalization =
    useMemo(() => {
      if (
        storePairs.length === 0
      ) {
        return 0;
      }

      const total =
        storePairs.reduce(
          (
            sum,
            pair
          ) =>
            sum +
            pair.cannibalizationPercentage,
          0
        );

      return (
        total /
        storePairs.length
      );
    }, [
      storePairs
    ]);

  // ===============================
  // CHART DATA
  // ===============================

  const chartData =
    useMemo(() => {
      return filteredPairs
        .slice(0, 10)
        .map(
          (pair, index) => ({
            pair:
              `Pair ${index + 1}`,

            stores:
              `${pair.existingStoreName} ↔ ${pair.newStoreName}`,

            cannibalizationPercentage:
              pair.cannibalizationPercentage,

            sharedVisitorsCount:
              pair.sharedVisitorsCount,

            totalExistingCustomers:
              pair.totalExistingCustomers
          })
        );
    }, [
      filteredPairs
    ]);

  // ===============================
  // REFRESH HANDLER
  // ===============================

  const handleRefresh =
    () => {
      // Cancel previous request
      if (
        requestControllerRef.current
      ) {
        requestControllerRef.current.abort();
      }

      // Create new request
      const controller =
        new AbortController();

      requestControllerRef.current =
        controller;

      fetchCannibalizationData(
        controller.signal
      );
    };

  // ===============================
  // RENDER
  // ===============================

  return (
    <div className="stores-page">

      {/* PAGE INTRODUCTION */}

      <div className="page-intro">

        <div>

          <h2>
            Cannibalization Analysis
          </h2>

          <p>
            Analyze precomputed store-pair
            cannibalization using shared visitors
            and existing customer activity.
          </p>

        </div>

        <button
          className="map-button"
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading
            ? "Loading..."
            : "Refresh Analysis"}
        </button>

      </div>


      {/* STORE API WARNING */}

      {!loading &&
        !error &&
        storeApiWarning && (

          <div className="store-error">

            <strong>
              Store Summary Warning
            </strong>

            <p>
              {storeApiWarning}
            </p>

          </div>

        )}


      {/* SUMMARY CARDS */}

      <div className="mobility-stats">

        {/* TOTAL STORES */}

        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ▤
          </span>

          <div>

            <p>
              Total Stores
            </p>

            <h3>
              {loading ||
              error ||
              stores.length === 0
                ? "--"
                : stores.length}
            </h3>

          </div>

        </div>


        {/* STORE PAIRS */}

        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ⇄
          </span>

          <div>

            <p>
              Store Pairs
            </p>

            <h3>
              {loading || error
                ? "--"
                : storePairs.length}
            </h3>

          </div>

        </div>


        {/* AVERAGE CANNIBALIZATION */}

        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            %
          </span>

          <div>

            <p>
              Avg. Cannibalization
            </p>

            <h3>
              {loading || error
                ? "--"
                : formatPercentage(
                    averageCannibalization
                  )}
            </h3>

          </div>

        </div>


        {/* STORES IN PAIRS */}

        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ↑
          </span>

          <div>

            <p>
              Stores in Pairs
            </p>

            <h3>
              {loading || error
                ? "--"
                : storesWithRelations}
            </h3>

          </div>

        </div>

      </div>


      {/* VISUALIZATION */}

      {!loading &&
        !error &&
        chartData.length > 0 && (

          <div className="stores-card">

            <div className="stores-card-header">

              <div>

                <h3>
                  Cannibalization Visualization
                </h3>

                <p>
                  Cannibalization percentage
                  for the available store pairs.
                </p>

              </div>

            </div>

            <div className="cannibalization-chart">

              <ResponsiveContainer
                width="100%"
                height={350}
              >

                <BarChart
                  data={chartData}
                  margin={{
                    top: 10,
                    right: 20,
                    left: 10,
                    bottom: 10
                  }}
                >

                  <CartesianGrid
                    strokeDasharray="3 3"
                  />

                  <XAxis
                    dataKey="pair"
                  />

                  <YAxis
                    domain={[
                      0,
                      "auto"
                    ]}
                  />

                  <Tooltip
                    formatter={(
                      value,
                      name
                    ) => {

                      if (
                        name ===
                        "cannibalizationPercentage"
                      ) {
                        return [
                          `${Number(
                            value
                          ).toFixed(1)}%`,
                          "Cannibalization"
                        ];
                      }

                      if (
                        name ===
                        "sharedVisitorsCount"
                      ) {
                        return [
                          value,
                          "Shared Visitors"
                        ];
                      }

                      return [
                        value,
                        name
                      ];
                    }}

                    labelFormatter={(
                      label
                    ) => {

                      const item =
                        chartData.find(
                          (entry) =>
                            entry.pair ===
                            label
                        );

                      return item
                        ? item.stores
                        : label;
                    }}
                  />

                  <Bar
                    dataKey="cannibalizationPercentage"
                    name="Cannibalization"
                    fill="#2563eb"
                    radius={[
                      5,
                      5,
                      0,
                      0
                    ]}
                  />

                </BarChart>

              </ResponsiveContainer>

            </div>

          </div>

        )}


      {/* ANALYSIS TABLE */}

      <div className="stores-card">

        <div className="stores-card-header">

          <div>

            <h3>
              Store Cannibalization Pairs
            </h3>

            <p>
              Precomputed store relationships
              returned by the Snowflake analytics mart.
            </p>

          </div>

          <input
            type="search"
            placeholder="Search by Store Name..."
            aria-label="Search store pairs"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            className="store-search"
          />

        </div>


        {/* LOADING */}

        {loading && (

          <div className="store-message">

            <h3>
              Loading Cannibalization Data...
            </h3>

            <p>
              Fetching precomputed store-pair
              analytics from the backend.
            </p>

          </div>

        )}


        {/* ERROR */}

        {!loading &&
          error && (

            <div className="store-error">

              <strong>
                Cannibalization API Error
              </strong>

              <p>
                {error}
              </p>

              <button
                className="store-view-button"
                onClick={handleRefresh}
              >
                Try Again
              </button>

            </div>

          )}


        {/* NO PAIRS */}

        {!loading &&
          !error &&
          storePairs.length === 0 && (

            <div className="store-message">

              <h3>
                No Cannibalization Pairs Found
              </h3>

              <p>
                The backend did not return
                any store-pair records.
              </p>

            </div>

          )}


        {/* NO SEARCH RESULTS */}

        {!loading &&
          !error &&
          storePairs.length > 0 &&
          filteredPairs.length === 0 && (

            <div className="store-message">

              <h3>
                No Matching Store Pairs
              </h3>

              <p>
                No store pairs match
                "{searchTerm}".
              </p>

              <button
                className="store-view-button"
                onClick={() =>
                  setSearchTerm("")
                }
              >
                Clear Search
              </button>

            </div>

          )}


        {/* TABLE */}

        {!loading &&
          !error &&
          filteredPairs.length > 0 && (

            <div className="stores-table-container">

              <table className="stores-table">

                <thead>

                  <tr>

                    <th>
                      Existing Store
                    </th>

                    <th>
                      New Store
                    </th>

                    <th>
                      Shared Visitors
                    </th>

                    <th>
                      Existing Customers
                    </th>

                    <th>
                      Cannibalization
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredPairs.map(
                    (pair, index) => (

                      <tr
                        key={
                          `${pair.existingStoreName}-${pair.newStoreName}-${index}`
                        }
                      >

                        <td>

                          <strong>
                            {pair.existingStoreName}
                          </strong>

                        </td>

                        <td>

                          <strong>
                            {pair.newStoreName}
                          </strong>

                        </td>

                        <td>

                          <strong
                            className={
                              pair.sharedVisitorsCount >
                              0
                                ? "store-activity-value"
                                : "store-activity-zero"
                            }
                          >
                            {
                              pair.sharedVisitorsCount
                            }
                          </strong>

                        </td>

                        <td>

                          <strong>
                            {
                              pair.totalExistingCustomers
                            }
                          </strong>

                        </td>

                        <td>

                          <strong
                            className="store-activity-value"
                          >
                            {formatPercentage(
                              pair.cannibalizationPercentage
                            )}
                          </strong>

                        </td>

                        <td>

                          <button
                            className="store-view-button"
                            onClick={() =>
                              setSelectedPair(
                                pair
                              )
                            }
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

      </div>


      {/* SELECTED PAIR DETAILS */}

      {selectedPair && (

        <div className="store-details-panel">

          <div className="store-details-header">

            <div>

              <h3>
                Selected Store Pair
              </h3>

              <p>
                Precomputed cannibalization analysis
              </p>

            </div>

            <button
              className="store-details-close"
              onClick={() =>
                setSelectedPair(null)
              }
              aria-label="Close pair details"
            >
              ×
            </button>

          </div>

          <div className="store-details-grid">

            <div>

              <span>
                Existing Store
              </span>

              <strong>
                {selectedPair.existingStoreName}
              </strong>

            </div>

            <div>

              <span>
                New Store
              </span>

              <strong>
                {selectedPair.newStoreName}
              </strong>

            </div>

            <div>

              <span>
                Shared Visitors
              </span>

              <strong>
                {selectedPair.sharedVisitorsCount}
              </strong>

            </div>

            <div>

              <span>
                Total Existing Customers
              </span>

              <strong>
                {selectedPair.totalExistingCustomers}
              </strong>

            </div>

            <div>

              <span>
                Cannibalization
              </span>

              <strong>
                {formatPercentage(
                  selectedPair.cannibalizationPercentage
                )}
              </strong>

            </div>

          </div>

          <p className="store-details-note">

            This visualization presents the
            precomputed cannibalization metric
            supplied by the backend analytics mart.
            It should not be interpreted as a direct
            measurement of revenue loss or confirmed
            customer switching without additional
            business validation.

          </p>

        </div>

      )}

    </div>
  );
}

export default Cannibalization;