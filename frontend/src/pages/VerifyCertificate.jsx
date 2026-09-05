import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'

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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            <i className="bi bi-shield-check text-emerald-400"></i>
            <span>Public Certificate Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Verify Digital Recycling Certificate
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
            Enter any E-Waste Recycling Certificate ID (e.g. <code className="bg-slate-800 px-2 py-0.5 rounded text-emerald-400 font-mono">EWC-2026-XXXXXXXX</code>) to verify authenticity and safe disposal record.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex gap-3">
          <div className="relative flex-1">
            <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
            <input
              type="text"
              value={certInput}
              onChange={(e) => setCertInput(e.target.value)}
              placeholder="Enter Certificate ID e.g. EWC-2026-XXXXXXXX"
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-xl pl-11 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-mono text-sm sm:text-base shadow-inner"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/40 disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="bi bi-arrow-repeat animate-spin"></i>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <i className="bi bi-check-lg text-lg"></i>
                <span>Verify</span>
              </>
            )}
          </button>
        </form>

        {/* Error Message */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 px-4 py-3 rounded-xl text-center text-sm max-w-xl mx-auto flex items-center justify-center gap-2">
            <i className="bi bi-exclamation-triangle"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Certificate Display Result */}
        {searched && certData && (
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur space-y-6">
            
            {/* Status Header Banner */}
            {certData.valid ? (
              <div className="bg-emerald-500/15 border border-emerald-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-emerald-400">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
                    <i className="bi bi-patch-check-fill text-emerald-400"></i>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white">Valid & Authenticated Certificate</h3>
                    <p className="text-xs text-emerald-300">Verified record on Smart E-Waste Management System</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-mono font-semibold rounded-full text-xs tracking-wider">
                  OFFICIAL PLATFORM RECORD
                </span>
              </div>
            ) : (
              <div className="bg-rose-500/15 border border-rose-500/30 rounded-xl p-4 flex items-center gap-3 text-rose-300">
                <i className="bi bi-x-circle text-2xl"></i>
                <div>
                  <h3 className="font-bold text-lg text-white">Certificate Not Found</h3>
                  <p className="text-xs">No matching recycling certificate could be found for ID: {certData.certificateNumber}</p>
                </div>
              </div>
            )}

            {/* Main Certificate Details Grid */}
            {certData.valid && (
              <div className="space-y-6">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Certificate ID</span>
                    <p className="text-white font-mono font-bold text-base">{certData.certificateNumber}</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Associated Tracking ID</span>
                    <p className="text-emerald-400 font-mono font-bold text-base flex items-center justify-between">
                      <span>{certData.trackingNumber}</span>
                      {certData.trackingNumber !== 'N/A' && (
                        <Link
                          to={`/track/${certData.trackingNumber}`}
                          className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded transition-colors font-sans"
                        >
                          View Lifecycle <i className="bi bi-arrow-right"></i>
                        </Link>
                      )}
                    </p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">E-Waste Category</span>
                    <p className="text-white font-medium text-base">{certData.category}</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Quantity</span>
                    <p className="text-white font-medium text-base">{certData.quantity} unit(s)</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Final Disposal Method</span>
                    <p className="text-emerald-400 font-semibold text-base">{certData.finalDisposalMethod}</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Processing / Issue Date</span>
                    <p className="text-white font-medium text-base">{formatDate(certData.issueDate)}</p>
                  </div>

                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 space-y-1 sm:col-span-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recycling Center</span>
                    <p className="text-white font-medium text-base">{certData.recyclingCenter}</p>
                  </div>

                </div>

                {/* Privacy & Safe Verification Banner */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3.5 flex items-start gap-3 text-xs text-blue-300">
                  <i className="bi bi-lock text-base text-blue-400 mt-0.5"></i>
                  <div>
                    <span className="font-semibold text-blue-200 block mb-0.5">Privacy Guard Active</span>
                    This public verification portal displays safe device and processing records only. Personal user information (phone number, email address, home location) is strictly restricted to authorized platform accounts.
                  </div>
                </div>

                {/* Explicit Application Disclaimer */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1.5">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                    <i className="bi bi-info-circle"></i>
                    <span>Important Disclaimer & Recognition Notice</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    {certData.disclaimer}
                  </p>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  )
}
