import React from "react";

const VideoSection = () => {
  return (
    <section className="video-section">
      <div className="parallax-background"></div>
      <div className="video-container">
        <iframe
          loading="lazy"
          width="560"
          height="315"
          src="https://www.youtube.com/embed/CpD6Zuka4P4?si=ozyTaU8Ghr3Apir4"
          title="Wynn Tax Solutions"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerpolicy="strict-origin-when-cross-origin"
          allowfullscreen
        ></iframe>
      </div>
    </section>
  );
};

export default VideoSection;
