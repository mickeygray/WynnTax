import React from "react";

const VideoSection = () => {
  return (
    <section className="video-section">
      <div
        className="parallax-background"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 100%), url(${process.env.PUBLIC_URL}/images/hero-18.png)`,
        }}
      ></div>
      <div className="video-container">
        <iframe
          loading="lazy"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/CpD6Zuka4P4?si=ozyTaU8Ghr3Apir4"
          title="Wynn Tax Solutions introduction video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        ></iframe>
      </div>
    </section>
  );
};

export default VideoSection;
