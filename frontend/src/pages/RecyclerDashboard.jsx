import React from 'react'
import { useAuth } from '../context/AuthContext'

export default function RecyclerDashboard() {
  const { user } = useAuth()

  return (
    <div className="py-4">
      <div className="editorial-tag">RECYCLING FACILITY CONSOLE</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">FACILITY OPERATIONS</h1>
          <p className="text-secondary small mt-1">
            Logged in as <strong>{user?.email}</strong>. Manage incoming material inventory, chemical segregation, and issue verifiable digital recycling certificates.
          </p>
        </div>
      </div>

      <div className="grid-split-50-50 my-4">
        <div>
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">01 / FACILITY INVENTORY</h2>
          <p className="text-secondary">
            Inspect e-waste items received at the facility hub. Update recovery status (RECYCLED, REFURBISHED, REUSED) and track rare earth metal recovery rates.
          </p>
        </div>

        <div>
          <h2 className="h4 text-uppercase fw-bold mb-3 pb-2 border-bottom border-dark">02 / CERTIFICATE ISSUANCE</h2>
          <p className="text-secondary">
            Generate official CPCB / State PCB compliant digital recycling certificates documenting zero-landfill diversion and safe battery handling.
          </p>
        </div>
      </div>
    </div>
  )
}
