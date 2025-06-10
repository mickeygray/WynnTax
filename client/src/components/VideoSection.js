import React from "react";

const VideoSection = () => {
  return (
    <section className="video-section">
      <div className="parallax-background"></div>
      <div className="video-container">
        <iframe
          loading="lazy"
          src="https://www.youtube.com/embed/9N_KN7qeFvQ"
          width="940"
          height="529"
          frameBorder="0"
          allowFullScreen
          title="How to do Taxes for the First Time"
        ></iframe>
      </div>
    </section>
  );
};

export default VideoSection;
