import React from "react";

const VideoSection = () => {
  return (
    <section className="video-section">
      <div
        className="parallax-background"
        style={{
          backgroundImage: `url(${process.env.PUBLIC_URL}/images/wynn-parallax.png)`,
        }}
      ></div>
      <div className="video-container">
        <iframe
          loading="lazy"
          src="https://www.youtube.com/embed/NtVYBYELwJI?enablejsapi=1&wmode=opaque"
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
