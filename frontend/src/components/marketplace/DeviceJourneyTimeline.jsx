import React from 'react'
import { formatIndianDate } from '../../utils/workflowHelpers'

export default function DeviceJourneyTimeline({ deviceJourney }) {
  if (!deviceJourney || !deviceJourney.events || deviceJourney.events.length === 0) {
    return (
      <div className="device-journey-container my-4">
        <h3 className="h6 text-uppercase fw-bold text-dark mb-3 pb-2 border-bottom border-dark">
          CIRCULAR DEVICE LIFECYCLE JOURNEY
        </h3>
        <p className="text-secondary small">
          Chain of custody verification is currently being compiled for this refurbished physical device.
        </p>
      </div>
    )
  }

  const events = deviceJourney.events

  return (
    <div className="device-journey-container my-4">
      <div className="d-flex justify-content-between align-items-baseline mb-3 pb-2 border-bottom border-dark flex-wrap gap-2">
        <h3 className="h6 text-uppercase fw-bold text-dark m-0">
          CIRCULAR DEVICE LIFECYCLE JOURNEY
        </h3>
        {deviceJourney.serialOrTrackingReference && (
          <span className="extra-small text-uppercase fw-bold text-muted font-monospace">
            Ref: {deviceJourney.serialOrTrackingReference}
          </span>
        )}
      </div>

      <p className="text-secondary small mb-4">
        Every refurbished device in our marketplace originates from verified collection streams. Follow this specific unit's verifiable journey through diagnosis, renewal, and inspection.
      </p>

      <div className="editorial-timeline">
        {events.map((evt, idx) => {
          const numStr = String(idx + 1).padStart(2, '0')

          return (
            <div key={idx} className="editorial-timeline-row">
              <div className="editorial-timeline-num">{numStr}</div>

              <div>
                <div className="editorial-timeline-title">
                  {evt.title || evt.stage?.replace(/_/g, ' ')}
                </div>
                <div className="extra-small text-muted mt-1 d-flex flex-wrap gap-2 align-items-center">
                  {evt.facilityName && (
                    <span>
                      <i className="bi bi-building me-1"></i>
                      {evt.facilityName}
                    </span>
                  )}
                  {evt.timestamp && (
                    <span>
                      <i className="bi bi-calendar3 me-1"></i>
                      {formatIndianDate(evt.timestamp)}
                    </span>
                  )}
                </div>
              </div>

              <div className="editorial-timeline-desc">
                {evt.description || 'Stage logged and verified in circular facility management.'}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
