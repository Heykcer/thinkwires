import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFindTalentData,
  fallbackFindTalentData,
} from '../store/slices/findTalentSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import FindTalentHero from '../components/FindTalentComponents/FindTalentHero';
import FindTalentIntakeForm from '../components/FindTalentComponents/FindTalentIntakeForm';
import FindTalentBench from '../components/FindTalentComponents/FindTalentBench';
import FindTalentComparison from '../components/FindTalentComponents/FindTalentComparison';
import FindTalentProof from '../components/FindTalentComponents/FindTalentProof';

const FindTalentPage = () => {
  const dispatch = useDispatch();
  const { data: rawData, status } = useSelector(
    (state) => state.findTalent || {}
  );

  const data =
    rawData && Object.keys(rawData).length > 0
      ? rawData
      : fallbackFindTalentData;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchFindTalentData());
    }
  }, [dispatch, status]);

  return (
    <div className="FindTalentPage-wrapper">
      <Helmet>
        <title>Hire Tech Talent | Thinkwires — Request Talent Pipeline</title>
        <meta
          name="description"
          content="Tell us your hiring requirements and receive matched, verified senior engineer profiles with transparent rates within 48 hours."
        />
        <meta
          property="og:title"
          content="Hire Top Tech Talent | Thinkwires"
        />
        <meta
          property="og:description"
          content="Tell us your hiring requirements and receive matched, verified senior engineer profiles with transparent rates within 48 hours."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Hire Top Tech Talent | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Tell us your hiring requirements and receive matched, verified senior engineer profiles within 48 hours."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="FindTalentPage-main">
        <FindTalentHero data={data.hero} />
        <FindTalentIntakeForm data={data.intakeForm} />
        <FindTalentBench talents={data.activeBench} />
        <FindTalentComparison matrix={data.comparisonMatrix} />
        <FindTalentProof
          metrics={data.verifiedMetrics}
          testimonial={data.testimonial}
          hotline={data.hotline}
        />
      </main>
      <Footer />
    </div>
  );
};

export default FindTalentPage;
