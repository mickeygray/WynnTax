import React, { useState } from "react";
import HeroSection from "./HeroSectionOld";
import Main from "./Main";
import Services from "./Services";
import Testimonials from "./Testimonials";
import SaveTimeSection from "./SaveTimeSection";
import QuoteSection from "./QuoteSection";
import VideoSection from "./VideoSection";
import LandingPopupForm from "./LandingPopupForm";

const Home = () => {
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <div className="home-wrapper">
      <HeroSection onConsultationClick={() => setConsultationOpen(true)} />
      <Main />
      <Services />
      <SaveTimeSection />
      <Testimonials />
      <QuoteSection />
      <VideoSection />

      {/* Consultation Modal */}
      {consultationOpen && (
        <LandingPopupForm onClose={() => setConsultationOpen(false)} />
      )}
    </div>
  );
};

export default Home;
