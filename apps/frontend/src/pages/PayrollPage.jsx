import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchPayrollData,
  fallbackPayrollData,
} from '../store/slices/payrollSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import PayrollHero from '../components/PayrollComponents/PayrollHero';
import PayrollPillars from '../components/PayrollComponents/PayrollPillars';
import PayrollBeneficiaries from '../components/PayrollComponents/PayrollBeneficiaries';
import PayrollFeatures from '../components/PayrollComponents/PayrollFeatures';
import PayrollConsultation from '../components/PayrollComponents/PayrollConsultation';

const PayrollPage = () => {
  const dispatch = useDispatch();
  const { data: rawData, status } = useSelector((state) => state.payroll || {});

  const payrollData =
    rawData && Object.keys(rawData).length > 0 ? rawData : fallbackPayrollData;

  useEffect(() => {
    window.scrollTo(0, 0);
    if (status === 'idle') {
      dispatch(fetchPayrollData());
    }
  }, [dispatch, status]);

  return (
    <div className="PayrollPage-wrapper">
      <Helmet>
        <title>Global Payroll Outsourcing | Thinkwires</title>
        <meta
          name="description"
          content="Multi-country payroll processing, tax compliance, benefits administration, and on-time statutory disbursements for distributed engineering teams."
        />
        <meta
          property="og:title"
          content="Global Payroll Services | Thinkwires"
        />
        <meta
          property="og:description"
          content="Multi-country payroll processing, tax compliance, benefits administration, and on-time statutory disbursements for distributed engineering teams."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Global Payroll Services | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Multi-country payroll processing, tax compliance, and benefits administration."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />
      <main className="PayrollPage-main">
        <PayrollHero data={payrollData.hero} />
        <PayrollPillars data={payrollData.pillarsSection} />
        <PayrollBeneficiaries data={payrollData.beneficiariesSection} />
        <PayrollFeatures data={payrollData.featuresSection} />
        <PayrollConsultation data={payrollData.consultationSection} />
      </main>
      <Footer />
    </div>
  );
};

export default PayrollPage;
