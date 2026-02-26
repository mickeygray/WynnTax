import React, { useState } from "react";
import HeroSection from "./HeroSection";
import Main from "./Main";
import Services from "./Services";
import Testimonials from "./Testimonials";
import SaveTimeSection from "./SaveTimeSection";
import QuoteSection from "./QuoteSection";
import VideoSection from "./VideoSection";
import LandingPopupForm from "./LandingPopupForm";
import { localBusinessSchema, orgSchema } from "../utils/structuredData";
import SEO from "./SEO";

const Home = () => {
  const [consultationOpen, setConsultationOpen] = useState(false);

  return (
    <>
      <SEO
        title="Wynn Tax Solutions | IRS Tax Relief & Resolution Experts"
        description="Resolve IRS tax debt with licensed enrolled agents. Offers in compromise, installment plans, penalty abatement, and wage garnishment relief. Free consultation — call (844) 996-6829."
        canonical="/"
        structuredData={[orgSchema, localBusinessSchema]}
      />
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
    </>
  );
};

export default Home;
