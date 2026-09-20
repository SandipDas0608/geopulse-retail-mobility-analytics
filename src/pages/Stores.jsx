import { useState } from "react";

function Stores() {

  const [searchTerm, setSearchTerm] = useState("");

  // Temporary frontend data
  // Backend store API can be connected later.
  const stores = [
    {
      id: 1,
      name: "Store A",
      location: "Solapur",
      status: "Active",
      visitors: "--"
    },
    {
      id: 2,
      name: "Store B",
      location: "Pune",
      status: "Active",
      visitors: "--"
    },
    {
      id: 3,
      name: "Store C",
      location: "Mumbai",
      status: "Active",
      visitors: "--"
    },
    {
      id: 4,
      name: "Store D",
      location: "Kolhapur",
      status: "Inactive",
      visitors: "--"
    }
  ];

  const filteredStores = stores.filter((store) =>
    store.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    store.location
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="stores-page">

      {/* Page Introduction */}

      <div className="page-intro">

        <div>

          <h2>Stores</h2>

          <p>
            Manage and explore retail store locations
            monitored by GeoPulse.
          </p>

        </div>

        <button className="map-button">
          + Add Store
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

            <h3>
              {stores.length}
            </h3>

          </div>

        </div>


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ✓
          </span>

          <div>

            <p>Active Stores</p>

            <h3>
              {
                stores.filter(
                  (store) => store.status === "Active"
                ).length
              }
            </h3>

          </div>

        </div>


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ◉
          </span>

          <div>

            <p>Tracked Visitors</p>

            <h3>
              --
            </h3>

          </div>

        </div>


        <div className="mobility-stat-card">

          <span className="mobility-stat-icon">
            ↑
          </span>

          <div>

            <p>High Traffic Stores</p>

            <h3>
              --
            </h3>

          </div>

        </div>

      </div>


      {/* Store List */}

      <div className="stores-card">

        <div className="stores-card-header">

          <div>

            <h3>
              Store Locations
            </h3>

            <p>
              Retail locations monitored by GeoPulse
            </p>

          </div>


          {/* Search */}

          <input
            type="text"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(event.target.value)
            }
            className="store-search"
          />

        </div>


        {/* Store Table */}

        <div className="stores-table-container">

          <table className="stores-table">

            <thead>

              <tr>

                <th>
                  Store
                </th>

                <th>
                  Location
                </th>

                <th>
                  Status
                </th>

                <th>
                  Visitors
                </th>

                <th>
                  Action
                </th>

              </tr>

            </thead>


            <tbody>

              {filteredStores.map((store) => (

                <tr key={store.id}>

                  <td>

                    <strong>
                      {store.name}
                    </strong>

                  </td>


                  <td>
                    {store.location}
                  </td>


                  <td>

                    <span
                      className={
                        store.status === "Active"
                          ? "store-status active"
                          : "store-status inactive"
                      }
                    >

                      {store.status}

                    </span>

                  </td>


                  <td>
                    {store.visitors}
                  </td>


                  <td>

                    <button
                      className="store-view-button"
                    >
                      View
                    </button>

                  </td>

                </tr>

              ))}


              {filteredStores.length === 0 && (

                <tr>

                  <td
                    colSpan="5"
                    className="no-stores"
                  >

                    No stores found.

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

export default Stores;