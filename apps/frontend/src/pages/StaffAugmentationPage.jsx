import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchStaffAugmentationData,
  fallbackStaffAugmentationData,
} from '../store/slices/staffAugmentationSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import StaffAugHero from '../components/StaffAugmentationComponents/StaffAugHero';
import StaffAugSolutions from '../components/StaffAugmentationComponents/StaffAugSolutions';
import StaffAugBenefits from '../components/StaffAugmentationComponents/StaffAugBenefits';
import StaffAugBench from '../components/StaffAugmentationComponents/StaffAugBench';
import StaffAugComparison from '../components/StaffAugmentationComponents/StaffAugComparison';
import StaffAugFaq from '../components/StaffAugmentationComponents/StaffAugFaq';
import StaffAugConsultation from '../components/StaffAugmentationComponents/StaffAugConsultation';

const StaffAugmentationPage = () => {
  const dispatch = useDispatch();
  const { data: rawData, status } = useSelector(
    (state) => state.staffAugmentation || {}
  );

  const data =
    rawData && Object.keys(rawData).length > 0
      ? rawData
      : fallbackStaffAugmentationData;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchStaffAugmentationData());
    }
  }, [dispatch, status]);

  return (
    <div className="StaffAugPage-wrapper">
      <Helmet>
        <title>Staff Augmentation | Thinkwires — Rapid Tech Scaling</title>
        <meta
          name="description"
          content="Scale your engineering squad with elite full-stack, cloud, DevOps, and data engineers integrated seamlessly into your sprint cycles."
        />
        <meta
          property="og:title"
          content="IT Staff Augmentation Solutions | Thinkwires"
        />
        <meta
          property="og:description"
          content="Scale your engineering squad with elite full-stack, cloud, DevOps, and data engineers integrated seamlessly into your sprint cycles."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="IT Staff Augmentation Solutions | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Scale your engineering squad with elite full-stack, cloud, DevOps, and data engineers."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="StaffAugPage-main">
        <StaffAugHero data={data.hero} valueProps={data.valueProps} />
        <StaffAugSolutions data={data.solutions} />
        <StaffAugBenefits data={data.benefits} />
        <StaffAugBench data={data.bench} />
        <StaffAugComparison data={data.comparison} />
        <StaffAugFaq faqs={data.faqs} />
        <StaffAugConsultation data={data.consultation} />
      </main>
      <Footer />
    </div>
  );
};

export default StaffAugmentationPage;
