import React, { useState, useEffect } from 'react'
import axios from 'axios'

export default function ComplianceSupport() {
  const [guidelines, setGuidelines] = useState([])
  const [recyclers, setRecyclers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchComplianceData()
  }, [])

  const fetchComplianceData = async () => {
    try {
      setLoading(true)
      const [guidelinesRes, recyclersRes] = await Promise.all([
        axios.get('/api/compliance/guidelines'),
        axios.get('/api/recycling-centers')
      ])
      setGuidelines(guidelinesRes.data)
      setRecyclers(recyclersRes.data)
      setError(null)
    } catch (err) {
      console.error('Failed to load compliance data:', err)
      setError('Unable to load compliance guidelines. Displaying cached regulatory guidance.')
    } finally {
      setLoading(false)
    }
  }

  const filteredRecyclers = recyclers.filter(r => {
    const matchesSearch = !searchQuery.trim() || 
      (r.name && r.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.cpcbRegistrationRef && r.cpcbRegistrationRef.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.city && r.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.state && r.state.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesCategory = !selectedCategory || 
      (r.acceptedWasteCategories && r.acceptedWasteCategories.toUpperCase().includes(selectedCategory.toUpperCase()))

    return matchesSearch && matchesCategory
  })

  // Fallback guidelines if backend is initializing
  const defaultTopics = [
    {
      sectionKey: 'RESPONSIBLE_DISPOSAL',
      title: 'Responsible E-Waste Disposal',
      summary: 'Understanding environmentally sound management of electrical and electronic equipment in India.',
      detailedContent: 'Responsible e-waste disposal mandates that consumers, commercial entities, and institutions channel discarded electronics exclusively through authorized collection channels and registered recyclers. Under India\'s E-Waste Management Rules, unauthorized dumping in municipal solid waste stream or selling to unorganized scrap dealers is strictly discouraged to prevent toxic heavy metal leaching and land contamination.',
      legalFrameworkReference: 'E-Waste (Management) Rules, 2022 - MoEFCC, Govt. of India',
      disclaimerText: 'Registration information should be independently verified with the relevant authority.'
    },
    {
      sectionKey: 'EPR_CONCEPT',
      title: 'Extended Producer Responsibility (EPR)',
      summary: 'Overview of producer obligations, collection targets, and EPR portal compliance for electronics manufacturers.',
      detailedContent: 'Extended Producer Responsibility (EPR) is the cornerstone of India\'s e-waste regulatory framework. Electronics producers, importers, and brand owners (PIBOs) are mandated to fulfill annual e-waste collection and recycling targets based on their historical sales volume. Producers execute EPR obligations through registered recyclers, acquiring verified EPR certificates registered on the CPCB Portal.',
      legalFrameworkReference: 'Rule 5 & Schedule III, E-Waste (Management) Rules, 2022 - Central Pollution Control Board (CPCB)',
      disclaimerText: 'Registration information should be independently verified with the relevant authority.'
    },
    {
      sectionKey: 'REGISTERED_RECYCLER_IMPORTANCE',
      title: 'Importance of Registered Recyclers',
      summary: 'Why utilizing State PCB / CPCB registered dismantlers and recyclers is critical for statutory compliance.',
      detailedContent: 'Registered recyclers operate state-of-the-art facilities equipped with dust extraction, vacuum shredders, precious metal recovery units, and closed-loop effluent treatment. By utilizing registered recyclers, institutions receive official disposal certificates and audit trails verifying environmentally sound processing (ESM) in compliance with CPCB technical guidelines.',
      legalFrameworkReference: 'CPCB Technical Guidelines for Implementation of E-Waste Management Rules',
      disclaimerText: 'Registration information should be independently verified with the relevant authority.'
    },
    {
      sectionKey: 'SAFE_BATTERY_HANDLING',
      title: 'Safe Battery & Hazardous Waste Handling',
      summary: 'Protocols for managing Lithium-ion, Lead-acid, mercury-bearing, and hazardous component disposal.',
      detailedContent: 'Batteries and mercury-containing devices require specialized handling to prevent fire hazards, thermal runaway, and chemical exposure. Damaged Li-ion batteries should be insulated with non-conductive tape over terminal pins before transport. Fluorescent lamps and CRT monitors must remain intact to prevent mercury vapor and leaded glass dust leakage.',
      legalFrameworkReference: 'Battery Waste Management Rules, 2022 & E-Waste Management Rules, 2022',
      disclaimerText: 'Registration information should be independently verified with the relevant authority.'
    },
    {
      sectionKey: 'INFORMAL_DISPOSAL_HAZARDS',
      title: 'Hazards of Informal Sector Disposal',
      summary: 'Why open burning, acid bathing, and unorganized scrap dealer dumping damage public health and ecology.',
      detailedContent: 'Over 80% of e-waste in developing regions historically flowed into informal scrap markets where primitive extraction methods are employed—such as open cyanide/acid leaching for gold recovery, open burning of wire insulation releasing dioxins, and dumping leaded glass into local waterways. Disposing of electronics through formal channels protects worker health and eliminates toxic environmental contamination.',
      legalFrameworkReference: 'National Green Tribunal (NGT) Guidelines & MoEFCC E-Waste Health Hazard Assessment',
      disclaimerText: 'Registration information should be independently verified with the relevant authority.'
    }
  ]

  const displayTopics = guidelines.length > 0 ? guidelines : defaultTopics

  return (
    <div className="container py-4">
      {/* Top Banner Card */}
      <div className="hero-card shadow-lg p-4 mb-4 rounded-4 position-relative overflow-hidden">
        <div className="position-relative z-1">
          <span className="badge bg-success bg-opacity-25 text-success border border-success border-opacity-50 px-3 py-1.5 rounded-pill fw-bold small mb-2 d-inline-block">
            <i className="bi bi-shield-check me-1"></i> INDIA E-WASTE REGULATORY FRAMEWORK
          </span>
          <h2 className="hero-title h3 mb-2 text-white">
            E-Waste Compliance &amp; Statutory Guidance Support
          </h2>
          <p className="hero-description text-muted small mb-0">
            Educational guidance on Extended Producer Responsibility (EPR), registered recyclers, safe hazardous handling, and environmentally sound disposal in India.
          </p>
        </div>
      </div>

      {/* MANDATORY STATUTORY DISCLAIMER BANNER */}
      <div className="alert bg-dark border border-warning border-opacity-50 text-white rounded-4 p-4 mb-4 shadow-sm">
        <div className="d-flex gap-3 align-items-start">
          <div className="rounded-3 p-2 bg-warning bg-opacity-10 text-warning fs-3 flex-shrink-0">
            <i className="bi bi-exclamation-triangle-fill"></i>
          </div>
          <div>
            <h5 className="text-warning fw-bold h6 mb-1">
              Statutory Notice &amp; Independent Verification Disclaimer
            </h5>
            <p className="mb-2 text-muted small">
              <strong>"Registration information should be independently verified with the relevant authority."</strong>
            </p>
            <p className="mb-0 text-muted small opacity-75" style={{ fontSize: '0.85rem' }}>
              This portal provides information and logistics support aligned with India's <em>E-Waste (Management) Rules, 2022</em> (MoEFCC / CPCB framework). This platform is an independent compliance assistance tool and does <strong>not</strong> claim direct real-time statutory integration with the Central Pollution Control Board (CPCB) or State Pollution Control Boards (SPCBs) unless explicitly integrated via official APIs. All registration numbers and validity dates must be independently cross-verified on the official CPCB EPR portal.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Informational Topics */}
      <div className="row g-4 mb-5">
        {displayTopics.map((topic, idx) => (
          <div key={idx} className="col-12 col-lg-6">
            <div className="bg-dark rounded-4 p-4 border border-secondary border-opacity-25 h-100 shadow-sm d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-2 font-monospace small">
                    SECTION {idx + 1}
                  </span>
                  <span className="text-muted small">
                    <i className="bi bi-book me-1"></i> MoEFCC Guideline
                  </span>
                </div>

                <h4 className="text-white h5 fw-bold mb-2">{topic.title}</h4>
                <p className="text-muted small fw-medium mb-3">{topic.summary}</p>

                <div className="p-3 bg-dark bg-opacity-50 rounded-3 border border-secondary border-opacity-25 mb-3 text-muted small">
                  {topic.detailedContent}
                </div>
              </div>

              <div>
                <div className="p-2.5 rounded-3 bg-secondary bg-opacity-10 border border-secondary border-opacity-25 mb-2">
                  <div className="text-success small fw-semibold">
                    <i className="bi bi-journal-text me-1"></i> Regulatory Reference:
                  </div>
                  <div className="text-white small opacity-90">{topic.legalFrameworkReference}</div>
                </div>

                <div className="text-warning small fst-italic opacity-75" style={{ fontSize: '0.78rem' }}>
                  <i className="bi bi-info-circle me-1"></i> {topic.disclaimerText}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registered Recycler Verification Reference Section */}
      <div className="bg-dark rounded-4 p-4 border border-secondary border-opacity-25 shadow-sm">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <h4 className="text-white h5 mb-1 fw-bold">
              <i className="bi bi-patch-check-fill text-success me-2"></i> Authorized Registered Recycler Directory Reference
            </h4>
            <p className="text-muted small mb-0">
              Directory reference for CPCB / State PCB registered recycler facilities and accepted waste categories.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <input
              type="text"
              className="form-control form-control-sm bg-dark text-white border-secondary"
              placeholder="Search by city, state, or CPCB ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '220px' }}
            />
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '160px' }}
            >
              <option value="">All Categories</option>
              <option value="MONITOR">Monitors / Screens</option>
              <option value="BATTERY">Batteries</option>
              <option value="DESKTOP">Desktops / CPUs</option>
              <option value="LAPTOP">Laptops</option>
              <option value="PRINTER">Printers</option>
            </select>
          </div>
        </div>

        {/* Directory Table */}
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0 text-white">
            <thead>
              <tr className="text-muted small border-secondary">
                <th>Facility &amp; Location</th>
                <th>CPCB / SPCB Registration Ref</th>
                <th>Registration Validity</th>
                <th>Authorized Capacity</th>
                <th>Accepted Categories</th>
                <th>Verification Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecyclers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4 text-muted">
                    No registered recycler records matching your search query.
                  </td>
                </tr>
              ) : (
                filteredRecyclers.map((r, idx) => (
                  <tr key={idx} className="border-secondary">
                    <td>
                      <div className="fw-bold text-white">{r.name}</div>
                      <div className="small text-muted">{r.city}, {r.state} ({r.postalCode})</div>
                    </td>
                    <td>
                      <span className="badge bg-success bg-opacity-25 text-success font-monospace border border-success border-opacity-25 px-2.5 py-1">
                        {r.cpcbRegistrationRef || r.registrationNumber || 'CPCB/EW-RECY/AUTH-REF'}
                      </span>
                    </td>
                    <td className="small text-white">
                      {r.registrationValidityDate ? (
                        <span>
                          <i className="bi bi-calendar-check text-success me-1"></i>
                          Valid till {new Date(r.registrationValidityDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-muted">Statutory Verification Required</span>
                      )}
                    </td>
                    <td className="small text-white">
                      {r.authorizedCapacityTonsPerAnnum ? (
                        <span>{r.authorizedCapacityTonsPerAnnum} TPA</span>
                      ) : (
                        <span className="text-muted">{r.processingCapacityKgPerDay ? `${r.processingCapacityKgPerDay} kg/day` : 'N/A'}</span>
                      )}
                    </td>
                    <td className="small" style={{ maxWidth: '200px' }}>
                      <span className="text-truncate d-block text-muted">
                        {r.acceptedWasteCategories || 'E-Waste (All Categories)'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning text-dark px-2 py-1 small" title="Always independently verify with SPCB/CPCB">
                        <i className="bi bi-info-circle me-1"></i> Verify with Authority
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 p-3 bg-dark border border-secondary border-opacity-25 rounded-3 text-muted small text-center">
          <i className="bi bi-shield-exclamation text-warning me-1"></i>
          <strong>Notice:</strong> Facility details and statutory registration numbers displayed above serve as compliance reference information.
          Registration information should be independently verified with the relevant authority (CPCB / SPCB).
        </div>
      </div>
    </div>
  )
}
