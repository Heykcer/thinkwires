import React from 'react';
import { Helmet } from 'react-helmet-async';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import LifeAtThinkwires from '../components/JobsComponents/LifeAtThinkwires';

const LifeAtThinkwiresPage = () => {
  return (
    <div className="LifeAtThinkwiresPage-wrapper">
      <Helmet>
        <title>Life at Thinkwires | Workplace Culture &amp; Innovation</title>
        <meta
          name="description"
          content="Explore life at Thinkwires: a culture of innovation, collaboration, and continuous growth across our global technology delivery corridors."
        />
        <meta
          property="og:title"
          content="Life at Thinkwires | Workplace Culture & Innovation"
        />
        <meta
          property="og:description"
          content="Explore life at Thinkwires: a culture of innovation, collaboration, and continuous growth."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>

      <Navbar />

      <main style={{ paddingTop: '80px', minHeight: 'calc(100vh - 400px)' }}>
        <LifeAtThinkwires />
      </main>

      <Footer />
    </div>
  );
};

export default LifeAtThinkwiresPage;
