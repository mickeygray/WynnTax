import React from "react";

export default function PhoneLink({ rawNumber, className }) {
  // format inside the component
  const formatPhone = (num) => {
    return `(${num.slice(1, 4)}) ${num.slice(4, 7)}-${num.slice(7)}`;
  };

  const tel = `tel:+${rawNumber}`;
  const display = formatPhone(rawNumber);

  return (
    <>
      <a href={tel} className={`callrail-number ${className || ""}`}>
        <i className="fa-solid fa-phone"></i> {"  "} CALL: {display}
      </a>
    </>
  );
}
