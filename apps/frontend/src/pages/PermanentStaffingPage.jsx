import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPermanentStaffingData,
  fallbackPermanentStaffingData,
} from '../store/slices/permanentStaffingSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import PermStaffHero from '../components/PermanentStaffingComponents/PermStaffHero';
import PermStaffPillars from '../components/PermanentStaffingComponents/PermStaffPillars';
import PermStaffProcess from '../components/PermanentStaffingComponents/PermStaffProcess';
import PermStaffRoles from '../components/PermanentStaffingComponents/PermStaffRoles';
import PermStaffFaq from '../components/PermanentStaffingComponents/PermStaffFaq';
import PermStaffConsultation from '../components/PermanentStaffingComponents/PermStaffConsultation';

const PermanentStaffingPage = () => {
  const dispatch = useDispatch();
  const { data: rawData, status } = useSelector(
    (state) => state.permanentStaffing || {}
  );

  const data =
    rawData && Object.keys(rawData).length > 0
      ? rawData
      : fallbackPermanentStaffingData;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchPermanentStaffingData());
    }
  }, [dispatch, status]);

  return (
    <div className="PermStaffPage-wrapper">
      <Helmet>
        <title>Permanent Staffing & Executive Search | Thinkwires</title>
        <meta
          name="description"
          content="Strategic executive search and high-retention permanent placement for engineering leaders, VP of Engineering, and senior technical architects."
        />
        <meta
          property="og:title"
          content="Permanent Placement & Executive Search | Thinkwires"
        />
        <meta
          property="og:description"
          content="Strategic executive search and high-retention permanent placement for engineering leaders, VP of Engineering, and senior technical architects."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Permanent Placement & Executive Search | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Strategic executive search and high-retention permanent placement for engineering leaders and senior technical architects."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="PermStaffPage-main">
        <PermStaffHero data={data.hero} />
        <PermStaffPillars data={data.pillars} />
        <PermStaffProcess data={data.process} />
        <PermStaffRoles data={data.roles} />
        <PermStaffFaq faqs={data.faqs} />
        <PermStaffConsultation data={data.consultation} />
      </main>
      <Footer />
    </div>
  );
};

export default PermanentStaffingPage;
