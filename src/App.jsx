import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import MobilityMap from "./pages/MobilityMap";
import Stores from "./pages/Stores";
import Analytics from "./pages/Analytics";
import Cannibalization from "./pages/Cannibalization";
import StoresDetails from "./pages/StoresDetails";
import Settings from "./pages/Settings";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import "./App.css";


// =====================================================
// APP LAYOUT
// =====================================================

function AppLayout({ children }) {
  return (
    <div className="app-container">

      <Sidebar />

      <div className="main-content">

        <Header />

        {children}

      </div>

    </div>
  );
}


// =====================================================
// APP
// =====================================================

function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* ==========================================
            DASHBOARD
        =========================================== */}

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="/dashboard"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />


        {/* ==========================================
            MOBILITY MAP
        =========================================== */}

        <Route
          path="/mobility-map"
          element={
            <AppLayout>
              <MobilityMap />
            </AppLayout>
          }
        />


        {/* ==========================================
            STORES
        =========================================== */}

        <Route
          path="/stores"
          element={
            <AppLayout>
              <Stores />
            </AppLayout>
          }
        />


        {/* ==========================================
            ANALYTICS
        =========================================== */}

        <Route
          path="/analytics"
          element={
            <AppLayout>
              <Analytics />
            </AppLayout>
          }
        />


        {/* ==========================================
            CANNIBALIZATION
        =========================================== */}

        <Route
          path="/cannibalization"
          element={
            <AppLayout>
              <Cannibalization />
            </AppLayout>
          }
        />


        {/* ==========================================
            STORE DETAILS WITHOUT ID
            → BACK TO STORES
        =========================================== */}

        <Route
          path="/store-details"
          element={
            <Navigate
              to="/stores"
              replace
            />
          }
        />


        {/* ==========================================
            STORE DETAILS WITH STORE ID
        =========================================== */}

        <Route
          path="/store-details/:storeId"
          element={
            <AppLayout>
              <StoresDetails />
            </AppLayout>
          }
        />


        {/* ==========================================
            SETTINGS
        =========================================== */}

        <Route
          path="/settings"
          element={
            <AppLayout>
              <Settings />
            </AppLayout>
          }
        />


        {/* ==========================================
            UNKNOWN ROUTE
        =========================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;