import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchContactData,
  fallbackContactData,
} from '../store/slices/contactSlice';
import Navbar from '../components/common/Navbar';
import Footer from '../components/common/Footer';
import ContactHero from '../components/ContactComponents/ContactHero';
import ContactChannels from '../components/ContactComponents/ContactChannels';
import ContactForm from '../components/ContactComponents/ContactForm';
import ContactOffices from '../components/ContactComponents/ContactOffices';
import ContactFAQ from '../components/ContactComponents/ContactFAQ';
import SectionBadge from '../components/common/SectionBadge';

const ContactPage = () => {
  const dispatch = useDispatch();
  const { data: rawData } = useSelector((state) => state.contact || {});

  // Fallback to fallbackContactData if redux state is empty or still initializing
  const contactData =
    rawData && Object.keys(rawData).length > 0 ? rawData : fallbackContactData;

  useEffect(() => {
    window.scrollTo(0, 0);
    dispatch(fetchContactData());
  }, [dispatch]);

  return (
    <div className="ContactPage-wrapper">
      <Helmet>
        <title>Contact Us | Thinkwires — Connect with Enterprise Staffing Directors</title>
        <meta
          name="description"
          content="Connect with Thinkwires staffing directors for specialized SAP, AEM, Cloud, and engineering squads. Receive pre-vetted candidate dossiers within 5 business hours."
        />
        <meta
          property="og:title"
          content="Contact Us | Thinkwires"
        />
        <meta
          property="og:description"
          content="Connect with Thinkwires staffing directors for specialized SAP, AEM, Cloud, and engineering squads. Receive pre-vetted candidate dossiers within 5 business hours."
        />
        <meta property="og:image" content="https://thinkwires.com/og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Contact Us | Thinkwires"
        />
        <meta
          name="twitter:description"
          content="Connect with Thinkwires staffing directors for specialized SAP, AEM, Cloud, and engineering squads."
        />
        <meta name="twitter:image" content="https://thinkwires.com/og-image.jpg" />
      </Helmet>
      <Navbar />

      <main className="ContactPage-main">
        {/* Hero Section */}
        <ContactHero data={contactData.hero} />

        {/* Quick Contact Method Cards */}
        <ContactChannels channels={contactData.channels} />

        {/* Form Section with Side Trust Panel */}
        <section className="ContactFormSection-section" id="message-form">
          <div className="ContactFormSection-container">
            <div className="ContactFormSection-grid">
              {/* Left Column: Form */}
              <div className="ContactFormSection-left">
                <ContactForm formConfig={contactData.form} />
              </div>

              {/* Right Column: Why Connect With Us / Enterprise Assurances */}
              <div className="ContactFormSection-aside">
                <div className="ContactFormSection-asideCard">
                  <SectionBadge
                    text="DIRECTOR COMMITMENT"
                    icon={
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    }
                  />
                  <h3 className="ContactFormSection-asideTitle">
                    What Happens After You Submit?
                  </h3>

                  <ul className="ContactFormSection-steps">
                    <li className="ContactFormSection-step">
                      <div className="ContactFormSection-stepNum">1</div>
                      <div className="ContactFormSection-stepContent">
                        <h4>Intake Review in &lt; 60 mins</h4>
                        <p>
                          A Senior Staffing Director personally reviews your
                          tech stack and velocity requirements.
                        </p>
                      </div>
                    </li>
                    <li className="ContactFormSection-step">
                      <div className="ContactFormSection-stepNum">2</div>
                      <div className="ContactFormSection-stepContent">
                        <h4>Pre-Vetted Match Dossier</h4>
                        <p>
                          Within 5 hours, we deliver 2–3 blind candidate
                          profiles matched to your exact seniority level.
                        </p>
                      </div>
                    </li>
                    <li className="ContactFormSection-step">
                      <div className="ContactFormSection-stepNum">3</div>
                      <div className="ContactFormSection-stepContent">
                        <h4>Direct Client Interview</h4>
                        <p>
                          Schedule 1-on-1 interviews with candidates on your
                          schedule without endless email rounds.
                        </p>
                      </div>
                    </li>
                  </ul>

                  <div className="ContactFormSection-guarantee">
                    <div className="ContactFormSection-guaranteeIcon">
                      <svg
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                    </div>
                    <div>
                      <strong>Zero-Risk Trial Period</strong>
                      <p>
                        If a placed talent is not the right cultural or
                        technical fit in the first 14 days, you owe nothing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Global Office Locations */}
        <ContactOffices offices={contactData.officeLocations} />

        {/* FAQ Section */}
        <ContactFAQ faq={contactData.faq} />
      </main>

      <Footer />
    </div>
  );
};

export default ContactPage;
