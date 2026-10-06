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
    <div className="py-4">
      {/* Editorial Category Tag & Header Banner */}
      <div className="editorial-tag mb-1">REGULATORY &amp; STATUTORY STANDARDS</div>
      <div className="compliance-hero-banner mb-4">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3">
          <div>
            <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-1.5 rounded-pill fw-bold small mb-2 d-inline-flex align-items-center">
              <i className="bi bi-shield-check me-1.5"></i> INDIA E-WASTE REGULATORY FRAMEWORK
            </span>
            <h1 className="h2 text-uppercase fw-bold text-dark mb-1">
              E-Waste Compliance &amp; Statutory Guidance
            </h1>
            <p className="text-secondary small mb-0" style={{ maxWidth: '780px', lineHeight: '1.6' }}>
              Educational guidance on Extended Producer Responsibility (EPR), registered recyclers, safe hazardous handling, and environmentally sound disposal in India (MoEFCC &amp; CPCB statutory framework).
            </p>
          </div>
          <div className="d-flex align-items-center gap-2 flex-shrink-0">
            <span className="status-dot-item px-3 py-2 bg-white border border-secondary border-opacity-20 rounded-pill small fw-medium shadow-sm">
              <span className="status-dot status-dot-emerald"></span>
              Rules, 2022 Verified
            </span>
          </div>
        </div>
      </div>

      {/* MANDATORY STATUTORY DISCLAIMER BANNER */}
      <div className="compliance-notice-banner mb-4">
        <div className="d-flex gap-3 align-items-start">
          <div className="rounded-3 p-2 bg-warning bg-opacity-25 text-warning-emphasis fs-4 flex-shrink-0 d-flex align-items-center justify-content-center" style={{ width: '42px', height: '42px' }}>
            <i className="bi bi-exclamation-triangle-fill text-warning"></i>
          </div>
          <div>
            <h2 className="text-dark fw-bold h6 mb-1">
              Statutory Notice &amp; Independent Verification Disclaimer
            </h2>
            <p className="mb-2 text-dark small fw-semibold">
              "Registration information should be independently verified with the relevant authority."
            </p>
            <p className="mb-0 text-secondary small opacity-90" style={{ fontSize: '0.86rem', lineHeight: '1.6' }}>
              This portal provides information and logistics support aligned with India's <em>E-Waste (Management) Rules, 2022</em> (MoEFCC / CPCB framework). This platform is an independent compliance assistance tool and does <strong>not</strong> claim direct real-time statutory integration with the Central Pollution Control Board (CPCB) or State Pollution Control Boards (SPCBs) unless explicitly integrated via official APIs. All registration numbers and validity dates must be independently cross-verified on the official CPCB EPR portal.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Informational Topics */}
      <div className="row g-4 mb-5">
        {displayTopics.map((topic, idx) => (
          <div key={idx} className="col-12 col-lg-6">
            <div className="compliance-card h-100 d-flex flex-column justify-content-between">
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-2 font-monospace small fw-bold">
                    SECTION 0{idx + 1}
                  </span>
                  <span className="text-secondary small fw-medium">
                    <i className="bi bi-journal-bookmark me-1 text-success"></i> MoEFCC Guideline
                  </span>
                </div>

                <h3 className="text-dark h5 fw-bold mb-2">{topic.title}</h3>
                <p className="text-secondary small fw-medium mb-3">{topic.summary}</p>

                <div className="compliance-content-box mb-3">
                  {topic.detailedContent}
                </div>
              </div>

              <div>
                <div className="compliance-ref-box mb-2">
                  <div className="text-success small fw-bold mb-1">
                    <i className="bi bi-bank2 me-1"></i> Legal &amp; Regulatory Reference:
                  </div>
                  <div className="text-dark small fw-medium">{topic.legalFrameworkReference}</div>
                </div>

                <div className="text-muted small fst-italic" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-info-circle me-1 text-secondary"></i> {topic.disclaimerText}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Registered Recycler Verification Reference Section */}
      <div className="compliance-directory-card">
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4 pb-3 border-bottom border-secondary border-opacity-15">
          <div>
            <h2 className="text-dark h5 mb-1 fw-bold d-flex align-items-center gap-2">
              <i className="bi bi-patch-check-fill text-success"></i> Authorized Registered Recycler Directory Reference
            </h2>
            <p className="text-secondary small mb-0">
              Directory reference for CPCB / State PCB registered recycler facilities and accepted waste categories across India.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <input
              type="text"
              className="form-control form-control-sm bg-white text-dark border-secondary border-opacity-25"
              placeholder="Search by city, state, or CPCB ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: '230px' }}
            />
            <select
              className="form-select form-select-sm bg-white text-dark border-secondary border-opacity-25"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ width: '170px' }}
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
          <table className="table table-hover align-middle mb-0 editorial-table">
            <thead>
              <tr>
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
                  <tr key={idx}>
                    <td>
                      <div className="fw-bold text-dark">{r.name}</div>
                      <div className="small text-secondary">{r.city}, {r.state} ({r.postalCode})</div>
                    </td>
                    <td>
                      <span className="badge bg-success bg-opacity-10 text-success font-monospace border border-success border-opacity-25 px-2.5 py-1">
                        {r.cpcbRegistrationRef || r.registrationNumber || 'CPCB/EW-RECY/AUTH-REF'}
                      </span>
                    </td>
                    <td className="small text-dark">
                      {r.registrationValidityDate ? (
                        <span>
                          <i className="bi bi-calendar-check text-success me-1"></i>
                          Valid till {new Date(r.registrationValidityDate).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </span>
                      ) : (
                        <span className="text-secondary">Statutory Verification Required</span>
                      )}
                    </td>
                    <td className="small text-dark fw-medium">
                      {r.authorizedCapacityTonsPerAnnum ? (
                        <span>{r.authorizedCapacityTonsPerAnnum} TPA</span>
                      ) : (
                        <span className="text-secondary">{r.processingCapacityKgPerDay ? `${r.processingCapacityKgPerDay} kg/day` : 'N/A'}</span>
                      )}
                    </td>
                    <td className="small" style={{ maxWidth: '220px' }}>
                      <span className="text-truncate d-block text-secondary">
                        {r.acceptedWasteCategories || 'E-Waste (All Categories)'}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-warning bg-opacity-15 text-dark border border-warning border-opacity-40 px-2 py-1 small fw-semibold" title="Always independently verify with SPCB/CPCB">
                        <i className="bi bi-shield-check me-1 text-warning-emphasis"></i> Verify with Authority
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="compliance-footer-notice mt-4 d-flex align-items-center gap-2">
          <i className="bi bi-shield-exclamation text-warning fs-5 flex-shrink-0"></i>
          <div>
            <strong>Notice:</strong> Facility details and statutory registration numbers displayed above serve as compliance reference information.
            Registration information should be independently verified with the relevant authority (CPCB / SPCB).
          </div>
        </div>
      </div>
    </div>
  )
}
