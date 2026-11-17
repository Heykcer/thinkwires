import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEorData, fallbackEorData } from '../store/slices/eorSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import EorHero from '../components/EorComponents/EorHero';
import EorKpiStrip from '../components/EorComponents/EorKpiStrip';
import EorExplanation from '../components/EorComponents/EorExplanation';
import EorCapabilities from '../components/EorComponents/EorCapabilities';
import EorComparison from '../components/EorComponents/EorComparison';
import EorFaq from '../components/EorComponents/EorFaq';
import EorConsultation from '../components/EorComponents/EorConsultation';

const EorPage = () => {
  const dispatch = useDispatch();
  const { data: rawData, status } = useSelector((state) => state.eor || {});

  const eorData =
    rawData && Object.keys(rawData).length > 0 ? rawData : fallbackEorData;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchEorData());
    }
  }, [dispatch, status]);

  return (
    <div className="EorPage-wrapper">
      <Helmet>
        <title>Employer of Record (EOR) | Thinkwires — Compliant Global Hiring</title>
        <meta
          name="description"
          content="Legally hire remote engineers across 150+ countries without establishing foreign legal entities. 100% compliant local contracts and benefits."
        />
        <meta
          property="og:title"
          content="Employer of Record (EOR) Services | Thinkwires"
        />
        <meta
          property="og:description"
          content="Legally hire remote engineers across 150+ countries without establishing foreign legal entities. 100% compliant local contracts and benefits."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Employer of Record (EOR) Services | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Legally hire remote engineers across 150+ countries without establishing foreign legal entities."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="EorPage-main">
        <EorHero data={eorData.hero} />
        <EorKpiStrip kpiStrip={eorData.kpiStrip} />
        <EorExplanation data={eorData.explanationSection} />
        <EorCapabilities data={eorData.capabilitiesSection} />
        <EorComparison data={eorData.comparisonSection} />
        <EorFaq data={eorData.faqSection} />
        <EorConsultation data={eorData.consultationSection} />
      </main>
      <Footer />
    </div>
  );
};

export default EorPage;
