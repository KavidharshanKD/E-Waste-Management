import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function NotFound() {
  const { user, getDashboardPathByRole } = useAuth();

  return (
    <div className="py-5">
      <div className="border-bottom border-dark pb-3 mb-4">
        <div className="editorial-tag">404 // DISPATCH ROUTE ERROR</div>
        <h1 className="display-hero-title">RESOURCE NOT LOCATED</h1>
      </div>

      <div className="grid-split-60-40 my-4">
        <div>
          <p className="fs-5 text-secondary mb-4">
            The destination URL or endpoint you requested is not indexed in the circular e-waste management registry.
            The page may have been relocated, decommissioned, or typed incorrectly.
          </p>

          <div className="p-4 border border-dark bg-light mb-4">
            <h2 className="h6 text-uppercase fw-bold mb-2">Recommended Operational Pathways</h2>
            <ul className="mb-0 ps-3 text-secondary extra-small">
              <li className="mb-1">Verify that the URL address does not contain extraneous trailing characters.</li>
              <li className="mb-1">Access the verified circular marketplace for available refurbished hardware.</li>
              <li>Authenticate or return to your authorized role operational console.</li>
            </ul>
          </div>

          <div className="d-flex flex-wrap gap-3">
            <Link to="/" className="btn btn-primary-custom py-2 px-4">
              ← Return to Home
            </Link>
            <Link to="/marketplace" className="btn btn-outline-custom py-2 px-4">
              Browse Marketplace
            </Link>
            {user && (
              <Link to={getDashboardPathByRole(user.role)} className="btn btn-outline-custom py-2 px-4">
                Open Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="border-start ps-md-4 pt-3 pt-md-0">
          <h2 className="h5 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">SYSTEM ASSISTANCE</h2>
          <div className="extra-small text-secondary mb-3">
            If you followed a link within the system that resulted in this error, the resource may have completed its
            prescribed lifecycle stage or was withdrawn by an authorized facility operator.
          </div>
          <div className="p-3 border border-secondary border-opacity-25 bg-white">
            <div className="fw-bold text-uppercase mb-1">Facility Directory:</div>
            <div>• Circular Marketplace: <code>/marketplace</code></div>
            <div>• E-Waste Dropoff Finder: <code>/recycling-centers</code></div>
            <div>• Compliance & Regulatory: <code>/compliance</code></div>
            <div>• Citizen Inward Form: <code>/user/ewaste/add</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}
