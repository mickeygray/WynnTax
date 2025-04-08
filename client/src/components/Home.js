import React from "react";
import HeroSection from "./HeroSection";
import Main from "./Main";
import Services from "./Services";
import Testimonials from "./Testimonials";
import SaveTimeSection from "./SaveTimeSection";
import QuoteSection from "./QuoteSection";
import VideoSection from "./VideoSection";
const Home = () => (
  <div className="home-wrapper">
    <HeroSection />
    <Main />
    <Services />
    <SaveTimeSection />
    <Testimonials />
    <QuoteSection />
    <VideoSection />
  </div>
);

export default Home;
