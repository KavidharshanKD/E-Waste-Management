import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { formatIndianDate } from '../utils/workflowHelpers'

export default function VerifyCertificate() {
  const { certificateNumber: paramCertNumber } = useParams()
  const [certInput, setCertInput] = useState(paramCertNumber || '')
  const [certData, setCertData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (paramCertNumber) {
      setCertInput(paramCertNumber)
      fetchCertificate(paramCertNumber)
    }
  }, [paramCertNumber])

  const fetchCertificate = async (certNum) => {
    if (!certNum || !certNum.trim()) return
    try {
      setLoading(true)
      setError(null)
      setSearched(true)
      const res = await axios.get(`/api/public/certificates/verify/${certNum.trim()}`)
      setCertData(res.data)
    } catch (err) {
      console.error('Failed to verify certificate', err)
      setError('Failed to verify certificate. Please check the certificate ID and try again.')
      setCertData(null)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    fetchCertificate(certInput)
  }

  return (
    <div className="py-4">
      <div className="editorial-tag">PUBLIC CREDENTIAL VERIFICATION</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">VERIFY RECYCLING CERTIFICATE</h1>
          <p className="text-secondary small mt-1">
            Input an official certificate number (e.g. <code>EWC-2026-XXXXXXXX</code>) to inspect verifiable environmental compliance records.
          </p>
        </div>
      </div>

      <form onSubmit={handleSearchSubmit} className="d-flex gap-3 mb-5" style={{ maxWidth: '640px' }}>
        <input
          type="text"
          value={certInput}
          onChange={(e) => setCertInput(e.target.value)}
          placeholder="e.g. EWC-2026-XXXXXXXX"
          className="form-control font-monospace"
        />
        <button type="submit" disabled={loading} className="btn btn-primary-custom px-4">
          {loading ? 'Verifying...' : 'VERIFY ↗'}
        </button>
      </form>

      {error && <div className="alert alert-danger mb-4" style={{ maxWidth: '640px' }}>{error}</div>}

      {searched && certData && (
        <div className="border border-dark p-4 p-md-5 bg-white" style={{ maxWidth: '800px' }}>
          {certData.valid ? (
            <div>
              <div className="d-flex justify-content-between align-items-baseline pb-3 border-bottom border-dark">
                <div>
                  <span className="status-dot-item text-success fw-bold">
                    <span className="status-dot status-dot-emerald"></span> AUTHENTICATED CERTIFICATE
                  </span>
                  <h2 className="display-hero-title text-dark fs-2 m-0 mt-2">
                    {certData.certificateNumber}
                  </h2>
                </div>
                <div className="text-end">
                  <div className="small text-muted">ISSUED ON</div>
                  <strong className="text-dark">{formatIndianDate(certData.issueDate)}</strong>
                </div>
              </div>

              <div className="grid-split-50-50 my-4">
                <div className="d-flex flex-column gap-2 text-secondary fs-6">
                  <div className="d-flex justify-content-between pb-2 border-bottom">
                    <span>Tracking Number:</span>
                    <strong className="text-dark">{certData.trackingNumber}</strong>
                  </div>
                  <div className="d-flex justify-content-between pb-2 border-bottom">
                    <span>Category:</span>
                    <strong className="text-dark">{certData.category}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Quantity:</span>
                    <strong className="text-dark">{certData.quantity} unit(s)</strong>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 text-secondary fs-6">
                  <div className="d-flex justify-content-between pb-2 border-bottom">
                    <span>Disposal Method:</span>
                    <strong className="text-success">{certData.finalDisposalMethod}</strong>
                  </div>
                  <div className="d-flex justify-content-between pb-2 border-bottom">
                    <span>Recycling Facility:</span>
                    <strong className="text-dark">{certData.recyclingCenter}</strong>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-top border-dark text-muted extra-small italic">
                {certData.disclaimer || 'Official digital recycling certificate generated under CPCB / State PCB guidelines.'}
              </div>
            </div>
          ) : (
            <div className="text-danger fw-bold">
              Certificate record not found for: {certData.certificateNumber}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
