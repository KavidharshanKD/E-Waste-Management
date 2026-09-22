import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatIndianDate, formatCurrency } from '../utils/workflowHelpers';
import { recyclerApi, getApiErrorMessage } from '../api/apiClient';
import {
  COSMETIC_GRADE_MAP,
  MARKETPLACE_LISTING_STATUS_MAP,
  RESTORATION_STATUS_MAP,
  QUALITY_CHECK_RESULT_MAP,
  REPAIRABILITY_STATUS_MAP,
  TECHNICIAN_DECISION_MAP,
  DISPOSAL_ACTION_MAP,
  USER_INTENTION_MAP,
  EWASTE_CATEGORY_MAP,
  getEnumLabel,
  getEnumBadgeClass,
} from '../utils/enumMappings';
import {
  isQcEligible,
  isMarketplaceCandidateEligible,
  canStartRestoration,
  canCompleteRestoration,
  canSubmitListingForApproval,
  canWithdrawListing,
  validateSellingPrice,
  validateWarrantyDays,
} from '../utils/operatorHelpers';
import { isScreenRelevant, isBatteryRelevant } from '../utils/recommendationHelpers';

export default function RecyclerDashboard() {
  const { user } = useAuth();

  // Primary Workspace Navigation
  const [activeTab, setActiveTab] = useState('ASSESSMENT');

  // Operational Data Stores
  const [pendingAssessments, setPendingAssessments] = useState([]);
  const [restorationJobs, setRestorationJobs] = useState([]);
  const [restorationStatusFilter, setRestorationStatusFilter] = useState('ALL');
  const [marketplaceCandidates, setMarketplaceCandidates] = useState([]);
  const [centerListings, setCenterListings] = useState([]);
  const [listingStatusFilter, setListingStatusFilter] = useState('ALL');

  // Loading & Global Notifications
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Modal Interactive States
  const [selectedAssessmentRequest, setSelectedAssessmentRequest] = useState(null);
  const [assessmentForm, setAssessmentForm] = useState({
    powerStatus: 'Powers on normally',
    screenAssessment: 'Intact without scratches',
    batteryAssessment: 'Normal operational capacity',
    physicalCondition: 'Minor superficial scuffs',
    functionalAssessment: 'Core motherboard and ports operational',
    diagnosedIssues: 'Thermal degradation and worn battery',
    repairabilityStatus: 'REFURBISHABLE',
    technicianDecision: 'REFURBISH',
    safetyHazardFound: false,
    safetyNotes: '',
    recommendedForMarketplace: true,
    assessmentNotes: '',
  });

  const [selectedRestorationJob, setSelectedRestorationJob] = useState(null);
  const [workForm, setWorkForm] = useState({
    status: 'COMPLETED',
    workPerformed: '',
    partsReplaced: '',
    technicianNotes: '',
    partsCost: '',
    laborCost: '',
  });

  const [selectedQcJob, setSelectedQcJob] = useState(null);
  const [qcForm, setQcForm] = useState({
    functionalTestPassed: true,
    powerTestPassed: true,
    displayTestPassed: true,
    batteryTestPassed: true,
    safetyTestPassed: true,
    cosmeticGrade: 'GRADE_A',
    overallResult: 'PASS',
    qualityNotes: 'All hardware benches passed successfully.',
  });

  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [draftForm, setDraftForm] = useState({
    title: '',
    sellingPrice: '',
    originalReferencePrice: '',
    warrantyDays: '90',
    description: '',
    conditionSummary: '',
    technicalSummary: '',
    imageUrls: '',
  });

  useEffect(() => {
    loadTabContent(activeTab);
  }, [activeTab, restorationStatusFilter, listingStatusFilter]);

  const loadTabContent = async (tab) => {
    try {
      setLoading(true);
      setError(null);

      if (tab === 'ASSESSMENT') {
        const res = await recyclerApi.getPendingAssessments();
        setPendingAssessments(res.data || []);
      } else if (tab === 'RESTORATION' || tab === 'QUALITY_CHECK') {
        const status = restorationStatusFilter === 'ALL' ? undefined : restorationStatusFilter;
        const res = await recyclerApi.getRestorationJobs(status);
        setRestorationJobs(res.data || []);
      } else if (tab === 'MARKETPLACE') {
        const [candRes, listRes] = await Promise.all([
          recyclerApi.getCandidates(),
          recyclerApi.getCenterListings(listingStatusFilter === 'ALL' ? undefined : listingStatusFilter),
        ]);
        setMarketplaceCandidates(candRes.data || []);
        setCenterListings(listRes.data || []);
      }
    } catch (err) {
      console.error('Failed to load facility data', err);
      setError(getApiErrorMessage(err, 'Failed to load facility data.'));
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 1. ASSESSMENT HANDLERS
  // =========================================================================
  const handleOpenAssessmentModal = (request) => {
    setSelectedAssessmentRequest(request);
    const item = request.items?.[0] || {};
    const category = item.category || 'OTHER';

    setAssessmentForm({
      powerStatus: 'Powers on normally',
      screenAssessment: isScreenRelevant(category) ? 'Intact and responsive' : '',
      batteryAssessment: isBatteryRelevant(category) ? 'Normal discharge rate' : '',
      physicalCondition: item.condition === 'DAMAGED' ? 'Visible external casing damage' : 'Light superficial wear',
      functionalAssessment: 'Core logic board verified',
      diagnosedIssues: item.functionalIssues || 'Component maintenance required',
      repairabilityStatus: 'REFURBISHABLE',
      technicianDecision: 'REFURBISH',
      safetyHazardFound: item.condition === 'HAZARDOUS' || Boolean(item.batterySwollen) || Boolean(item.batteryLeaking),
      safetyNotes: item.condition === 'HAZARDOUS' ? 'Hazardous battery flag active from intake' : '',
      recommendedForMarketplace: true,
      assessmentNotes: '',
    });
  };

  const handleSubmitAssessment = async (e) => {
    e.preventDefault();
    if (!selectedAssessmentRequest) return;

    try {
      setActionLoading(true);
      setError(null);
      await recyclerApi.submitAssessment(selectedAssessmentRequest.id, assessmentForm);
      setSuccessNotice(`Physical assessment logged for request ${selectedAssessmentRequest.trackingNumber}.`);
      setSelectedAssessmentRequest(null);
      await loadTabContent('ASSESSMENT');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit physical assessment.'));
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // 2. RESTORATION WORK HANDLERS
  // =========================================================================
  const handleStartRestoration = async (jobId) => {
    try {
      setActionLoading(true);
      setError(null);
      await recyclerApi.startRestorationJob(jobId);
      setSuccessNotice(`Restoration ticket #${jobId} status transitioned to IN_PROGRESS.`);
      await loadTabContent('RESTORATION');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to start restoration job.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenWorkModal = (job) => {
    setSelectedRestorationJob(job);
    setWorkForm({
      status: 'COMPLETED',
      workPerformed: job.workPerformed || 'Disassembled, cleaned, renewed worn components, and ran bench burn-in test.',
      partsReplaced: job.partsReplaced || 'Internal thermal interface and battery replacement',
      technicianNotes: job.technicianNotes || 'Hardware restored to manufacturer specification.',
      partsCost: job.partsCost ? String(job.partsCost) : '1200',
      laborCost: job.laborCost ? String(job.laborCost) : '600',
    });
  };

  const handleSubmitWorkProgress = async (e) => {
    e.preventDefault();
    if (!selectedRestorationJob) return;

    try {
      setActionLoading(true);
      setError(null);
      const payload = {
        status: workForm.status,
        workPerformed: workForm.workPerformed.trim(),
        partsReplaced: workForm.partsReplaced.trim(),
        technicianNotes: workForm.technicianNotes.trim(),
        partsCost: workForm.partsCost ? Number(workForm.partsCost) : 0,
        laborCost: workForm.laborCost ? Number(workForm.laborCost) : 0,
      };

      await recyclerApi.completeRestorationJob(selectedRestorationJob.id, payload);
      setSuccessNotice(`Restoration ticket #${selectedRestorationJob.id} updated to ${workForm.status}.`);
      setSelectedRestorationJob(null);
      await loadTabContent('RESTORATION');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to update restoration work.'));
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // 3. QUALITY CHECK HANDLERS
  // =========================================================================
  const handleOpenQcModal = (job) => {
    setSelectedQcJob(job);
    setQcForm({
      functionalTestPassed: true,
      powerTestPassed: true,
      displayTestPassed: true,
      batteryTestPassed: true,
      safetyTestPassed: true,
      cosmeticGrade: 'GRADE_A',
      overallResult: 'PASS',
      qualityNotes: 'Hardware bench burn-in passed with zero faults.',
    });
  };

  const handleSubmitQc = async (e) => {
    e.preventDefault();
    if (!selectedQcJob) return;

    try {
      setActionLoading(true);
      setError(null);
      await recyclerApi.submitQualityCheck(selectedQcJob.id, qcForm);
      setSuccessNotice(`Quality Check completed for restoration job #${selectedQcJob.id}.`);
      setSelectedQcJob(null);
      await loadTabContent('QUALITY_CHECK');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit quality check.'));
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================================
  // 4. MARKETPLACE CANDIDATE & DRAFT HANDLERS
  // =========================================================================
  const handleOpenDraftModal = (candidate) => {
    setSelectedCandidate(candidate);
    const titleSuggested = `${candidate.brand || ''} ${candidate.model || 'Certified Electronic'} (Refurbished)`.trim();
    setDraftForm({
      title: titleSuggested,
      sellingPrice: '',
      originalReferencePrice: '',
      warrantyDays: '90',
      description: `Certified refurbished ${candidate.brand || ''} ${candidate.model || ''}. Underwent precision facility restoration and multi-point bench QA.`,
      conditionSummary: `Certified ${candidate.cosmeticGrade ? candidate.cosmeticGrade.replace(/_/g, ' ') : 'Grade A'}. Thoroughly inspected and sanitized.`,
      technicalSummary: `Restored at ${candidate.centerName || 'Certified Center'}. Parts renewed: ${candidate.partsReplaced || 'Factory parts'}.`,
      imageUrls: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop',
    });
  };

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!selectedCandidate) return;

    if (!validateSellingPrice(draftForm.sellingPrice)) {
      setError('Selling price must be a positive number greater than 0.');
      return;
    }
    if (!validateWarrantyDays(draftForm.warrantyDays)) {
      setError('Warranty days must be a whole number 0 or greater.');
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      const payload = {
        qualityCheckId: selectedCandidate.qualityCheckId,
        title: draftForm.title.trim(),
        description: draftForm.description.trim(),
        sellingPrice: Number(draftForm.sellingPrice),
        originalReferencePrice: draftForm.originalReferencePrice ? Number(draftForm.originalReferencePrice) : null,
        warrantyDays: Number(draftForm.warrantyDays),
        conditionSummary: draftForm.conditionSummary.trim(),
        technicalSummary: draftForm.technicalSummary.trim(),
        imageUrls: draftForm.imageUrls
          ? draftForm.imageUrls.split(',').map((url) => url.trim()).filter(Boolean)
          : [],
      };

      await recyclerApi.createListingDraft(payload);
      setSuccessNotice(`Draft listing created for ${draftForm.title}. It is now awaiting submission for Admin review.`);
      setSelectedCandidate(null);
      await loadTabContent('MARKETPLACE');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create listing draft.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitForApproval = async (listingId) => {
    try {
      setActionLoading(true);
      setError(null);
      await recyclerApi.submitForApproval(listingId);
      setSuccessNotice(`Listing #${listingId} submitted for Admin review.`);
      await loadTabContent('MARKETPLACE');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to submit listing for approval.'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleWithdrawListing = async (listingId) => {
    if (!window.confirm('Are you sure you want to withdraw this listing from the marketplace?')) {
      return;
    }

    try {
      setActionLoading(true);
      setError(null);
      await recyclerApi.withdrawListing(listingId);
      setSuccessNotice(`Listing #${listingId} has been withdrawn.`);
      await loadTabContent('MARKETPLACE');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to withdraw listing.'));
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="py-4">
      {/* Header Stream */}
      <div className="editorial-tag">RECYCLING FACILITY OPERATIONS CONSOLE</div>
      <div className="d-flex justify-content-between align-items-baseline mb-4 pb-3 border-bottom border-dark flex-wrap gap-3">
        <div>
          <h1 className="h1 text-uppercase fw-bold m-0">FACILITY WORKFLOW WORKSPACE</h1>
          <p className="text-secondary small mt-1">
            Operator authorization: <strong>{user?.email}</strong>. Manage physical intake diagnosis, restoration benches, certified quality control, and secondary-life listing candidates.
          </p>
        </div>

        <button
          type="button"
          onClick={() => loadTabContent(activeTab)}
          className="btn btn-outline-custom"
          disabled={loading}
        >
          Refresh Console ↗
        </button>
      </div>

      {error && <div className="alert alert-danger mb-4 rounded-0">{error}</div>}
      {successNotice && <div className="alert alert-success mb-4 rounded-0">{successNotice}</div>}

      {/* Navigation Tabs */}
      <div className="d-flex gap-2 mb-4 border-bottom border-dark pb-2 flex-wrap">
        <button
          type="button"
          className={`btn ${activeTab === 'ASSESSMENT' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('ASSESSMENT')}
        >
          01 / Physical Assessment Queue
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'RESTORATION' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('RESTORATION')}
        >
          02 / Restoration Benches
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'QUALITY_CHECK' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('QUALITY_CHECK')}
        >
          03 / Quality Check Station
        </button>
        <button
          type="button"
          className={`btn ${activeTab === 'MARKETPLACE' ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          onClick={() => setActiveTab('MARKETPLACE')}
        >
          04 / Marketplace Candidates &amp; Drafts
        </button>
      </div>

      {/* TAB 1: PHYSICAL ASSESSMENT QUEUE */}
      {activeTab === 'ASSESSMENT' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="h5 text-uppercase fw-bold m-0">INCOMING COLLECTED UNITS AWAITING DIAGNOSIS</h2>
            <span className="small text-muted font-monospace">{pendingAssessments.length} UNIT(S) PENDING</span>
          </div>

          {loading ? (
            <div className="py-5 text-muted small">Loading pending physical assessments...</div>
          ) : pendingAssessments.length === 0 ? (
            <div className="p-4 border border-secondary border-opacity-25 bg-light text-muted small">
              No devices currently pending physical assessment at your facility center.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>TRACKING REF</th>
                    <th>DEVICE DETAILS</th>
                    <th>CITIZEN PREFERENCE</th>
                    <th>ADVISORY RECOMMENDATION</th>
                    <th>PHYSICAL HAZARDS</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAssessments.map((req) => {
                    const firstItem = req.items?.[0] || {};
                    const isHazardous =
                      firstItem.condition === 'HAZARDOUS' ||
                      Boolean(firstItem.batterySwollen) ||
                      Boolean(firstItem.batteryLeaking) ||
                      req.recommendedAction === 'SPECIAL_HANDLING';

                    return (
                      <tr key={req.id}>
                        <td>
                          <code className="fw-bold fs-6 text-dark">{req.trackingNumber}</code>
                          <div className="extra-small text-muted">{formatIndianDate(req.createdAt)}</div>
                        </td>
                        <td>
                          <div className="fw-bold text-dark">{firstItem.deviceName || firstItem.brand || 'Equipment'}</div>
                          <div className="text-secondary extra-small">
                            {getEnumLabel(EWASTE_CATEGORY_MAP, firstItem.category)} • {firstItem.condition}
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border extra-small">
                            {getEnumLabel(USER_INTENTION_MAP, req.userIntention || 'UNSURE')}
                          </span>
                        </td>
                        <td>
                          <span className={getEnumBadgeClass(DISPOSAL_ACTION_MAP, req.recommendedAction)}>
                            {getEnumLabel(DISPOSAL_ACTION_MAP, req.recommendedAction)}
                          </span>
                          {req.recommendationSource && (
                            <div className="extra-small text-muted font-monospace mt-1">
                              via {req.recommendationSource}
                            </div>
                          )}
                        </td>
                        <td>
                          {isHazardous ? (
                            <span className="badge bg-danger text-white extra-small">
                              <i className="bi bi-exclamation-octagon-fill me-1"></i>
                              HAZARD DETECTED
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border extra-small">None Declared</span>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenAssessmentModal(req)}
                            className="btn btn-primary-custom btn-sm py-1 px-3"
                          >
                            Diagnose Unit ↗
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: RESTORATION BENCHES */}
      {activeTab === 'RESTORATION' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <h2 className="h5 text-uppercase fw-bold m-0">ACTIVE RESTORATION WORK BENCHES</h2>

            <div className="d-flex gap-2">
              {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setRestorationStatusFilter(st)}
                  className={`btn btn-sm ${restorationStatusFilter === st ? 'btn-dark' : 'btn-outline-secondary'}`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="py-5 text-muted small">Loading restoration jobs...</div>
          ) : restorationJobs.length === 0 ? (
            <div className="p-4 border border-secondary border-opacity-25 bg-light text-muted small">
              No restoration tickets found matching filter: {restorationStatusFilter}.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>JOB REF</th>
                    <th>TRACKING REF</th>
                    <th>WORK TYPE</th>
                    <th>RESTORATION STATUS</th>
                    <th>TECHNICIAN NOTES &amp; PARTS</th>
                    <th>TOTAL COST</th>
                    <th>BENCH ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {restorationJobs.map((job) => (
                    <tr key={job.id}>
                      <td>
                        <code className="fw-bold text-dark">JOB-{job.id}</code>
                      </td>
                      <td>
                        <strong className="text-dark">{job.trackingNumber}</strong>
                        <div className="extra-small text-muted">{job.assignedTechnicianName || 'Assigned Tech'}</div>
                      </td>
                      <td>
                        <span className="badge bg-secondary text-white extra-small">
                          {job.jobType}
                        </span>
                      </td>
                      <td>
                        <span className={getEnumBadgeClass(RESTORATION_STATUS_MAP, job.status)}>
                          {getEnumLabel(RESTORATION_STATUS_MAP, job.status)}
                        </span>
                      </td>
                      <td>
                        <div className="extra-small text-secondary" style={{ maxWidth: '280px', lineHeight: '1.4' }}>
                          <div><strong>Work:</strong> {job.workPerformed || 'Pending'}</div>
                          {job.partsReplaced && <div><strong>Parts:</strong> {job.partsReplaced}</div>}
                        </div>
                      </td>
                      <td>
                        <strong className="text-dark font-monospace">
                          {formatCurrency(job.totalCost || 0)}
                        </strong>
                      </td>
                      <td>
                        {canStartRestoration(job) && (
                          <button
                            type="button"
                            onClick={() => handleStartRestoration(job.id)}
                            disabled={actionLoading}
                            className="btn btn-outline-custom btn-sm py-1 px-2"
                          >
                            Start Work ↗
                          </button>
                        )}
                        {canCompleteRestoration(job) && (
                          <button
                            type="button"
                            onClick={() => handleOpenWorkModal(job)}
                            disabled={actionLoading}
                            className="btn btn-primary-custom btn-sm py-1 px-2"
                          >
                            Log Progress ↗
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: QUALITY CHECK STATION */}
      {activeTab === 'QUALITY_CHECK' && (
        <div>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="h5 text-uppercase fw-bold m-0">QUALITY CONTROL TESTING STATION</h2>
              <p className="text-secondary extra-small m-0 mt-1">
                Invariant: Only jobs with status COMPLETED are eligible for multi-point physical QA.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-5 text-muted small">Loading quality inspection queue...</div>
          ) : (
            <div className="table-responsive">
              <table className="editorial-table">
                <thead>
                  <tr>
                    <th>JOB REF</th>
                    <th>TRACKING REF</th>
                    <th>WORK PERFORMED</th>
                    <th>QC ELIGIBILITY</th>
                    <th>STATION ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {restorationJobs
                    .filter((j) => j.status === 'COMPLETED')
                    .map((job) => (
                      <tr key={job.id}>
                        <td>
                          <code className="fw-bold text-dark">JOB-{job.id}</code>
                        </td>
                        <td>
                          <strong className="text-dark">{job.trackingNumber}</strong>
                          <div className="extra-small text-muted">{formatIndianDate(job.workCompletedAt)}</div>
                        </td>
                        <td className="small">
                          <div><strong>Summary:</strong> {job.workPerformed}</div>
                          <div className="extra-small text-muted">Parts: {job.partsReplaced || 'None'}</div>
                        </td>
                        <td>
                          <span className="badge bg-success text-white extra-small">
                            <i className="bi bi-check-circle me-1"></i> RESTORATION COMPLETED
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenQcModal(job)}
                            className="btn btn-primary-custom btn-sm py-1 px-3"
                          >
                            Conduct QC Inspection ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  {restorationJobs.filter((j) => j.status === 'COMPLETED').length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted small">
                        No completed restoration jobs currently awaiting quality check.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: MARKETPLACE CANDIDATES & DRAFT LISTINGS */}
      {activeTab === 'MARKETPLACE' && (
        <div>
          {/* Section A: Eligible Candidates */}
          <div className="mb-5">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h2 className="h5 text-uppercase fw-bold m-0">QC-CERTIFIED MARKETPLACE CANDIDATES</h2>
                <p className="text-secondary extra-small m-0 mt-1">
                  Devices that passed physical QA, electrical safety test, and have technician marketplace endorsement.
                </p>
              </div>
              <span className="badge bg-emerald text-white font-monospace">{marketplaceCandidates.length} CANDIDATE(S)</span>
            </div>

            {marketplaceCandidates.length === 0 ? (
              <div className="p-4 border border-secondary border-opacity-25 bg-light text-muted small">
                No new marketplace candidates awaiting draft creation.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="editorial-table">
                  <thead>
                    <tr>
                      <th>DEVICE</th>
                      <th>COSMETIC GRADE</th>
                      <th>QC PASSED ON</th>
                      <th>TECHNICIAN QA NOTES</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaceCandidates.map((cand) => (
                      <tr key={cand.qualityCheckId}>
                        <td>
                          <strong className="text-dark">{cand.brand} {cand.model}</strong>
                          <div className="extra-small text-muted">{getEnumLabel(EWASTE_CATEGORY_MAP, cand.category)}</div>
                        </td>
                        <td>
                          <span className={getEnumBadgeClass(COSMETIC_GRADE_MAP, cand.cosmeticGrade)}>
                            {getEnumLabel(COSMETIC_GRADE_MAP, cand.cosmeticGrade)}
                          </span>
                        </td>
                        <td className="small">
                          {cand.qcCompletedAt ? formatIndianDate(cand.qcCompletedAt) : 'Recent'}
                        </td>
                        <td className="extra-small text-secondary" style={{ maxWidth: '280px' }}>
                          {cand.technicianNotes || 'Multi-point testing verified.'}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleOpenDraftModal(cand)}
                            className="btn btn-primary-custom btn-sm py-1 px-3"
                          >
                            Create Listing Draft ↗
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section B: Center Listings & Approval Pipeline */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div>
                <h2 className="h5 text-uppercase fw-bold m-0">CENTER LISTINGS &amp; APPROVAL PIPELINE</h2>
                <p className="text-secondary extra-small m-0 mt-1">
                  Drafts must be submitted for Admin Review and Approved before publication to the public marketplace.
                </p>
              </div>

              <div className="d-flex gap-2">
                {['ALL', 'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PUBLISHED', 'REJECTED', 'WITHDRAWN'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setListingStatusFilter(st)}
                    className={`btn btn-sm ${listingStatusFilter === st ? 'btn-dark' : 'btn-outline-secondary'}`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {centerListings.length === 0 ? (
              <div className="p-4 border border-secondary border-opacity-25 bg-light text-muted small">
                No listings recorded for status filter: {listingStatusFilter}.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="editorial-table">
                  <thead>
                    <tr>
                      <th>LISTING TITLE</th>
                      <th>GRADE</th>
                      <th>SELLING PRICE</th>
                      <th>WARRANTY</th>
                      <th>STATUS</th>
                      <th>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {centerListings.map((listing) => (
                      <tr key={listing.id}>
                        <td>
                          <strong className="text-dark">{listing.title}</strong>
                          <div className="extra-small text-muted">{listing.brand} {listing.model}</div>
                        </td>
                        <td>
                          <span className={getEnumBadgeClass(COSMETIC_GRADE_MAP, listing.cosmeticGrade)}>
                            {getEnumLabel(COSMETIC_GRADE_MAP, listing.cosmeticGrade)}
                          </span>
                        </td>
                        <td>
                          <strong className="text-dark font-monospace">{formatCurrency(listing.sellingPrice)}</strong>
                        </td>
                        <td className="small">{listing.warrantyDays || 0} Days</td>
                        <td>
                          <span className={getEnumBadgeClass(MARKETPLACE_LISTING_STATUS_MAP, listing.listingStatus)}>
                            {getEnumLabel(MARKETPLACE_LISTING_STATUS_MAP, listing.listingStatus)}
                          </span>
                        </td>
                        <td>
                          {canSubmitListingForApproval(listing) && (
                            <button
                              type="button"
                              onClick={() => handleSubmitForApproval(listing.id)}
                              disabled={actionLoading}
                              className="btn btn-primary-custom btn-sm py-1 px-2 me-2"
                            >
                              Submit for Review ↗
                            </button>
                          )}
                          {canWithdrawListing(listing) && (
                            <button
                              type="button"
                              onClick={() => handleWithdrawListing(listing.id)}
                              disabled={actionLoading}
                              className="btn btn-outline-secondary btn-sm py-1 px-2"
                            >
                              Withdraw
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 1: PHYSICAL ASSESSMENT SUBMISSION
          ===================================================================== */}
      {selectedAssessmentRequest && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-0 border border-dark">
              <div className="modal-header border-bottom border-dark">
                <h5 className="modal-title text-uppercase fw-bold">
                  Physical Technician Diagnostic — {selectedAssessmentRequest.trackingNumber}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedAssessmentRequest(null)}
                ></button>
              </div>

              <form onSubmit={handleSubmitAssessment}>
                <div className="modal-body p-4">
                  <div className="alert alert-info p-3 mb-4 rounded-0 extra-small">
                    <strong>Citizen Declared Intent:</strong> {selectedAssessmentRequest.userIntention || 'UNSURE'} •{' '}
                    <strong>System Recommendation:</strong> {selectedAssessmentRequest.recommendedAction || 'RECYCLE'}
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Power State Verification *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={assessmentForm.powerStatus}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, powerStatus: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Physical Housing Condition *</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={assessmentForm.physicalCondition}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, physicalCondition: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Screen / Display Assessment</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={assessmentForm.screenAssessment}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, screenAssessment: e.target.value })}
                        placeholder="e.g. Glass intact, zero dead pixels"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Battery Pack Assessment</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={assessmentForm.batteryAssessment}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, batteryAssessment: e.target.value })}
                        placeholder="e.g. 84% capacity, zero swelling"
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Diagnosed Faults / Issues</label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      value={assessmentForm.diagnosedIssues}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, diagnosedIssues: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Repairability Assessment *</label>
                      <select
                        className="form-select form-select-sm"
                        value={assessmentForm.repairabilityStatus}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, repairabilityStatus: e.target.value })}
                        required
                      >
                        <option value="REPAIRABLE">Repairable (Component Level)</option>
                        <option value="REFURBISHABLE">Refurbishable (Full Renewal)</option>
                        <option value="NOT_ECONOMICALLY_RECOMMENDED">Not Economically Viable</option>
                        <option value="NOT_RECOVERABLE">Not Recoverable (Direct Recycle)</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Authoritative Operational Decision *</label>
                      <select
                        className="form-select form-select-sm"
                        value={assessmentForm.technicianDecision}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, technicianDecision: e.target.value })}
                        required
                      >
                        <option value="REFURBISH">Refurbish (Auto-queues Restoration Job)</option>
                        <option value="REPAIR">Repair (Auto-queues Repair Job)</option>
                        <option value="DONATE">Donate (Functional Handover)</option>
                        <option value="RECYCLE">Recycle Responsibly (Material Stream)</option>
                        <option value="SPECIAL_HANDLING">Special Hazardous Handling</option>
                      </select>
                    </div>
                  </div>

                  {/* Safety Gate Warning & Checkbox */}
                  <div className="p-3 border border-danger border-opacity-50 bg-light mb-3">
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="safetyHazardFound"
                        checked={assessmentForm.safetyHazardFound}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, safetyHazardFound: e.target.checked })}
                      />
                      <label className="form-check-label fw-bold text-danger extra-small text-uppercase" htmlFor="safetyHazardFound">
                        Safety Hazard Identified (Leaking, swelling, thermal burn, structural hazard)
                      </label>
                    </div>
                    {assessmentForm.safetyHazardFound && (
                      <input
                        type="text"
                        placeholder="Describe specific safety hazard containment instructions..."
                        className="form-control form-control-sm border-danger"
                        value={assessmentForm.safetyNotes}
                        onChange={(e) => setAssessmentForm({ ...assessmentForm, safetyNotes: e.target.value })}
                        required={assessmentForm.safetyHazardFound}
                      />
                    )}
                  </div>

                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="recommendedForMarketplace"
                      checked={assessmentForm.recommendedForMarketplace}
                      onChange={(e) => setAssessmentForm({ ...assessmentForm, recommendedForMarketplace: e.target.checked })}
                      disabled={assessmentForm.safetyHazardFound}
                    />
                    <label className="form-check-label extra-small text-uppercase fw-bold text-dark" htmlFor="recommendedForMarketplace">
                      Recommend as potential candidate for circular secondary-life marketplace
                    </label>
                  </div>
                </div>

                <div className="modal-footer border-top border-dark">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedAssessmentRequest(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary-custom"
                  >
                    {actionLoading ? 'Logging Diagnostic...' : 'Commit Assessment ↗'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 2: RESTORATION WORK PROGRESS / COMPLETION
          ===================================================================== */}
      {selectedRestorationJob && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-md">
            <div className="modal-content rounded-0 border border-dark">
              <div className="modal-header border-bottom border-dark">
                <h5 className="modal-title text-uppercase fw-bold">
                  Restoration Ticket #{selectedRestorationJob.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedRestorationJob(null)}
                ></button>
              </div>

              <form onSubmit={handleSubmitWorkProgress}>
                <div className="modal-body p-4">
                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Restoration Outcome Status *</label>
                    <select
                      className="form-select form-select-sm"
                      value={workForm.status}
                      onChange={(e) => setWorkForm({ ...workForm, status: e.target.value })}
                      required
                    >
                      <option value="COMPLETED">COMPLETED (Hardware Restored)</option>
                      <option value="FAILED">FAILED (Unrepairable Faults Found)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Work Performed Summary *</label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      value={workForm.workPerformed}
                      onChange={(e) => setWorkForm({ ...workForm, workPerformed: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Parts Replaced / Serviced</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={workForm.partsReplaced}
                      onChange={(e) => setWorkForm({ ...workForm, partsReplaced: e.target.value })}
                      placeholder="e.g. Battery, Charging IC, Flex Cable"
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Parts Cost (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm font-monospace"
                        value={workForm.partsCost}
                        onChange={(e) => setWorkForm({ ...workForm, partsCost: e.target.value })}
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Labor Cost (₹)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm font-monospace"
                        value={workForm.laborCost}
                        onChange={(e) => setWorkForm({ ...workForm, laborCost: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top border-dark">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedRestorationJob(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary-custom"
                  >
                    {actionLoading ? 'Saving Progress...' : 'Save & Close Ticket ↗'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 3: QUALITY CHECK INSPECTION
          ===================================================================== */}
      {selectedQcJob && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-md">
            <div className="modal-content rounded-0 border border-dark">
              <div className="modal-header border-bottom border-dark">
                <h5 className="modal-title text-uppercase fw-bold">
                  Certified Quality Check — Job #{selectedQcJob.id}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedQcJob(null)}
                ></button>
              </div>

              <form onSubmit={handleSubmitQc}>
                <div className="modal-body p-4">
                  <div className="p-3 border border-dark bg-light mb-3">
                    <div className="extra-small text-uppercase fw-bold mb-2">Multi-Point Diagnostic Bench Checklist</div>
                    <div className="form-check mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="powerTestPassed"
                        checked={qcForm.powerTestPassed}
                        onChange={(e) => setQcForm({ ...qcForm, powerTestPassed: e.target.checked })}
                      />
                      <label className="form-check-label extra-small" htmlFor="powerTestPassed">
                        Power &amp; Boot Cycle Verification
                      </label>
                    </div>

                    <div className="form-check mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="functionalTestPassed"
                        checked={qcForm.functionalTestPassed}
                        onChange={(e) => setQcForm({ ...qcForm, functionalTestPassed: e.target.checked })}
                      />
                      <label className="form-check-label extra-small" htmlFor="functionalTestPassed">
                        Motherboard, IO &amp; Ports Verification
                      </label>
                    </div>

                    <div className="form-check mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="displayTestPassed"
                        checked={qcForm.displayTestPassed}
                        onChange={(e) => setQcForm({ ...qcForm, displayTestPassed: e.target.checked })}
                      />
                      <label className="form-check-label extra-small" htmlFor="displayTestPassed">
                        Display Bench Verification (Zero Dead Pixels / Flicker)
                      </label>
                    </div>

                    <div className="form-check mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="batteryTestPassed"
                        checked={qcForm.batteryTestPassed}
                        onChange={(e) => setQcForm({ ...qcForm, batteryTestPassed: e.target.checked })}
                      />
                      <label className="form-check-label extra-small" htmlFor="batteryTestPassed">
                        Battery Operational Capacity &amp; Thermal Verification
                      </label>
                    </div>

                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="safetyTestPassed"
                        checked={qcForm.safetyTestPassed}
                        onChange={(e) => setQcForm({ ...qcForm, safetyTestPassed: e.target.checked })}
                      />
                      <label className="form-check-label extra-small fw-bold text-success" htmlFor="safetyTestPassed">
                        Electrical Isolation &amp; Zero Hazardous Leakage Verified
                      </label>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Certified Cosmetic Grade *</label>
                      <select
                        className="form-select form-select-sm"
                        value={qcForm.cosmeticGrade}
                        onChange={(e) => setQcForm({ ...qcForm, cosmeticGrade: e.target.value })}
                        required
                      >
                        <option value="GRADE_A">Grade A — Like New</option>
                        <option value="GRADE_B">Grade B — Light Wear</option>
                        <option value="GRADE_C">Grade C — Visible Wear</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Overall QC Verdict *</label>
                      <select
                        className="form-select form-select-sm"
                        value={qcForm.overallResult}
                        onChange={(e) => setQcForm({ ...qcForm, overallResult: e.target.value })}
                        required
                      >
                        <option value="PASS">PASS (Certified)</option>
                        <option value="FAIL">FAIL (Return to Rework)</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-2">
                    <label className="form-label extra-small text-uppercase fw-bold">Quality Inspector Notes</label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      value={qcForm.qualityNotes}
                      onChange={(e) => setQcForm({ ...qcForm, qualityNotes: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top border-dark">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedQcJob(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary-custom"
                  >
                    {actionLoading ? 'Certifying...' : 'Commit QC Decision ↗'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL 4: CREATE MARKETPLACE LISTING DRAFT
          ===================================================================== */}
      {selectedCandidate && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-scrollable">
            <div className="modal-content rounded-0 border border-dark">
              <div className="modal-header border-bottom border-dark">
                <h5 className="modal-title text-uppercase fw-bold">
                  Draft Marketplace Listing — {selectedCandidate.brand} {selectedCandidate.model}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedCandidate(null)}
                ></button>
              </div>

              <form onSubmit={handleCreateDraft}>
                <div className="modal-body p-4">
                  <div className="alert alert-warning p-3 mb-4 rounded-0 extra-small">
                    <strong>Circular Marketplace Safeguard:</strong> Creating a draft does <strong>NOT</strong> list the device for sale.
                    The draft must be submitted for Admin Review and approved before appearing on the customer marketplace.
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Marketplace Title *</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={draftForm.title}
                      onChange={(e) => setDraftForm({ ...draftForm, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Selling Price (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. 24999"
                        value={draftForm.sellingPrice}
                        onChange={(e) => setDraftForm({ ...draftForm, sellingPrice: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Original Reference Price (₹)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="form-control form-control-sm font-monospace"
                        placeholder="e.g. 54999"
                        value={draftForm.originalReferencePrice}
                        onChange={(e) => setDraftForm({ ...draftForm, originalReferencePrice: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="row g-3 mb-3">
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Certified Cosmetic Grade</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={selectedCandidate.cosmeticGrade || 'GRADE_A'}
                        disabled
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label extra-small text-uppercase fw-bold">Facility Warranty (Days) *</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-sm font-monospace"
                        value={draftForm.warrantyDays}
                        onChange={(e) => setDraftForm({ ...draftForm, warrantyDays: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Commercial Product Description</label>
                    <textarea
                      rows="2"
                      className="form-control form-control-sm"
                      value={draftForm.description}
                      onChange={(e) => setDraftForm({ ...draftForm, description: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Condition Summary</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={draftForm.conditionSummary}
                      onChange={(e) => setDraftForm({ ...draftForm, conditionSummary: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Technical Specifications Summary</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={draftForm.technicalSummary}
                      onChange={(e) => setDraftForm({ ...draftForm, technicalSummary: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label extra-small text-uppercase fw-bold">Image URLs (comma-separated)</label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={draftForm.imageUrls}
                      onChange={(e) => setDraftForm({ ...draftForm, imageUrls: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-top border-dark">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setSelectedCandidate(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="btn btn-primary-custom"
                  >
                    {actionLoading ? 'Saving Draft...' : 'Save Draft Listing ↗'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
