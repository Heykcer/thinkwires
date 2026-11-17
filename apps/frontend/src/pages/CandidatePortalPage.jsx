import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchCandidatePortalData,
  fallbackCandidatePortalData,
} from '../store/slices/candidatePortalSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import CandidateHero from '../components/CandidatePortalComponents/CandidateHero';
import CandidateMetrics from '../components/CandidatePortalComponents/CandidateMetrics';
import CandidateRoadmap from '../components/CandidatePortalComponents/CandidateRoadmap';
import CandidatePipelines from '../components/CandidatePortalComponents/CandidatePipelines';
import CandidateAssessments from '../components/CandidatePortalComponents/CandidateAssessments';
import CandidatePayoutAndCompliance from '../components/CandidatePortalComponents/CandidatePayoutAndCompliance';
import CandidateConcierge from '../components/CandidatePortalComponents/CandidateConcierge';

const CandidatePortalPage = () => {
  const dispatch = useDispatch();
  const { data: rawData, status } = useSelector(
    (state) => state.candidatePortal || {}
  );

  const data =
    rawData && Object.keys(rawData).length > 0
      ? rawData
      : fallbackCandidatePortalData;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchCandidatePortalData());
    }
  }, [dispatch, status]);

  return (
    <div className="CandidatePortalPage-wrapper">
      <Helmet>
        <title>Candidate Portal | Thinkwires</title>
        <meta
          name="description"
          content="Manage your candidate profile, resume ATS scoring, interview schedules, and active job applications."
        />
        <meta
          property="og:title"
          content="Candidate Portal | Thinkwires"
        />
        <meta
          property="og:description"
          content="Manage your candidate profile, resume ATS scoring, interview schedules, and active job applications."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Candidate Portal | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Manage your candidate profile and active job applications."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="CandidatePortalPage-main">
        <div className="CandidatePortal-pageContainer">
          <CandidateHero profile={data.profile} />
          <CandidateMetrics metrics={data.metrics} />
          <CandidateRoadmap stages={data.stages} />
          <CandidatePipelines pipelines={data.pipelines} />
          <CandidateAssessments assessment={data.technicalAssessment} />
          <CandidatePayoutAndCompliance data={data.payoutAndCompliance} />
          <CandidateConcierge concierge={data.concierge} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CandidatePortalPage;
