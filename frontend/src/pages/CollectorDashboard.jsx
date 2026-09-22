import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { formatIndianDate } from '../utils/workflowHelpers';
import { collectorApi, getApiErrorMessage } from '../api/apiClient';
import {
  DEVICE_CONDITION_MAP,
  EWASTE_CATEGORY_MAP,
  PICKUP_STATUS_MAP,
  getEnumLabel,
  getEnumBadgeClass,
} from '../utils/enumMappings';

export default function CollectorDashboard() {
  const { user } = useAuth();
  const [pickups, setPickups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [collectorNotes, setCollectorNotes] = useState({});
  const [activeTab, setActiveTab] = useState('ACTIVE');

  useEffect(() => {
    fetchAssignedPickups();
  }, []);

  const fetchAssignedPickups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await collectorApi.getAssignedPickups();
      setPickups(res.data || []);
    } catch (err) {
      console.error('Failed to fetch assigned pickups', err);
      setError(getApiErrorMessage(err, 'Failed to load assigned pickups.'));
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (pickupId, newStatus) => {
    try {
      setUpdatingId(pickupId);
      setError(null);
      setSuccessNotice(null);
      const notes = collectorNotes[pickupId] || '';
      await collectorApi.updatePickupStatus(pickupId, {
        status: newStatus,
        collectorNotes: notes,
      });
      setSuccessNotice(`Pickup #${pickupId} updated to ${newStatus.replace(/_/g, ' ')} successfully.`);
      await fetchAssignedPickups();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update pickup status.'));
    } finally {
      setUpdatingId(null);
    }
  };

  const activePickups = pickups.filter(
    (p) => p.status === 'ASSIGNED' || p.status === 'ON_THE_WAY' || p.status === 'SCHEDULED'
  );
  const historyPickups = pickups.filter(
    (p) => p.status === 'COLLECTED' || p.status === 'FAILED' || p.status === 'CANCELLED'
  );

  const displayedPickups = activeTab === 'ACTIVE' ? activePickups : historyPickups;

  return (
    <div className="py-4">
      {/* Header Stream */}
      <div className="editorial-tag">COLLECTOR OPERATIONS CONSOLE</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">COLLECTOR DISPATCH STREAM</h1>
          <p className="text-secondary small mt-1">
            Doorstep collection custody assignments for {user?.profile?.firstName || 'Field Collector'}. Inspect physical hazards, confirm custody, and log collection verification.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button
            type="button"
            className={`btn ${activeTab === 'ACTIVE' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('ACTIVE')}
          >
            Active Dispatches ({activePickups.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'HISTORY' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('HISTORY')}
          >
            Custody History ({historyPickups.length})
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4 rounded-0">{error}</div>}
      {successNotice && <div className="alert alert-success mb-4 rounded-0">{successNotice}</div>}

      {loading ? (
        <div className="py-5 text-muted small">Loading assigned dispatches...</div>
      ) : displayedPickups.length === 0 ? (
        <div className="py-5 text-muted small">
          No {activeTab.toLowerCase()} pickup assignments recorded for your collector profile.
        </div>
      ) : (
        <div className="table-responsive">
          <table className="editorial-table">
            <thead>
              <tr>
                <th>TRACKING REFERENCE</th>
                <th>SCHEDULED WINDOW</th>
                <th>RESIDENT &amp; LOCATION</th>
                <th>EQUIPMENT &amp; SAFETY AUDIT</th>
                <th>CUSTODY STATUS</th>
                <th>COLLECTOR ACTION</th>
              </tr>
            </thead>
            <tbody>
              {displayedPickups.map((p) => {
                const isHazardous = p.items?.some(
                  (item) => item.condition === 'HAZARDOUS'
                );

                return (
                  <tr key={p.id}>
                    <td>
                      <code className="fw-bold fs-6 text-dark">{p.trackingNumber || `REQ-${p.disposalRequestId}`}</code>
                      {p.verificationCode && (
                        <div className="extra-small text-muted font-monospace mt-1">
                          OTP: <strong>{p.verificationCode}</strong>
                        </div>
                      )}
                    </td>
                    <td className="small">
                      <div className="fw-bold">{p.scheduledDate ? formatIndianDate(p.scheduledDate) : 'Pending Schedule'}</div>
                      <div className="text-muted extra-small">{p.timeSlot || 'Standard Window'}</div>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{p.userName || 'Resident Citizen'}</div>
                      <div className="text-secondary extra-small" style={{ maxWidth: '240px', lineHeight: '1.4' }}>
                        {p.pickupAddress}
                      </div>
                      <div className="text-muted extra-small mt-1">
                        <i className="bi bi-telephone me-1"></i>
                        {p.contactNumber || 'N/A'}
                      </div>
                    </td>
                    <td>
                      {p.items && p.items.length > 0 ? (
                        <div className="d-flex flex-column gap-1">
                          {p.items.map((item, i) => (
                            <div key={i} className="small">
                              <span className="fw-bold text-dark">{item.deviceName || item.brand || 'Device'}</span>
                              <span className="text-muted extra-small ms-1">
                                ({getEnumLabel(EWASTE_CATEGORY_MAP, item.category)})
                              </span>
                              <div className="extra-small">
                                Condition: <span className="fw-semibold">{getEnumLabel(DEVICE_CONDITION_MAP, item.condition)}</span>
                              </div>
                            </div>
                          ))}
                          {isHazardous && (
                            <div className="alert alert-danger p-1 px-2 extra-small text-uppercase fw-bold m-0 border border-danger">
                              <i className="bi bi-exclamation-triangle-fill me-1"></i>
                              HAZARD PROTOCOL: BATTERY CONTAINMENT REQUIRED
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted extra-small">Equipment details pending</span>
                      )}
                    </td>
                    <td>
                      <span className="status-dot-item">
                        <span
                          className={`status-dot ${
                            p.status === 'COLLECTED'
                              ? 'status-dot-emerald'
                              : p.status === 'ON_THE_WAY'
                              ? 'status-dot-info'
                              : 'status-dot-warning'
                          }`}
                        ></span>
                        <span className={getEnumBadgeClass(PICKUP_STATUS_MAP, p.status)}>
                          {getEnumLabel(PICKUP_STATUS_MAP, p.status)}
                        </span>
                      </span>
                    </td>
                    <td>
                      {activeTab === 'ACTIVE' ? (
                        <div className="d-flex flex-column gap-2">
                          <input
                            type="text"
                            placeholder="Collector handover notes..."
                            className="form-control form-control-sm"
                            value={collectorNotes[p.id] || ''}
                            onChange={(e) =>
                              setCollectorNotes((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            disabled={updatingId === p.id}
                          />

                          <div className="d-flex gap-2">
                            {p.status === 'ASSIGNED' && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(p.id, 'ON_THE_WAY')}
                                disabled={updatingId === p.id}
                                className="btn btn-outline-custom btn-sm py-1 px-2"
                              >
                                En Route ↗
                              </button>
                            )}

                            {(p.status === 'ASSIGNED' || p.status === 'ON_THE_WAY') && (
                              <button
                                type="button"
                                onClick={() => handleStatusUpdate(p.id, 'COLLECTED')}
                                disabled={updatingId === p.id}
                                className="btn btn-primary-custom btn-sm py-1 px-2"
                              >
                                Mark Collected ↗
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted extra-small">
                          {p.actualPickupDate ? `Completed: ${formatIndianDate(p.actualPickupDate)}` : 'Custody Archive'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
