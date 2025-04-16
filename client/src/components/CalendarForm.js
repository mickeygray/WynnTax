import React, { useState } from "react";

const CalendarForm = ({ onSchedule }) => {
  const [dateTime, setDateTime] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dateTime || !phone) return;
    onSchedule({ dateTime, phone, note });
  };

  return (
    <form className="calendar-form" onSubmit={handleSubmit}>
      <label htmlFor="dateTime">Choose a Time</label>
      <input
        type="datetime-local"
        id="dateTime"
        value={dateTime}
        onChange={(e) => setDateTime(e.target.value)}
      />

      <label htmlFor="phone">Best Phone Number</label>
      <input
        type="tel"
        id="phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="e.g. 555-123-4567"
      />

      <label htmlFor="note">Optional Note</label>
      <textarea
        id="note"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Let us know anything specific..."
      />

      <button type="submit">Schedule My Call</button>
    </form>
  );
};

export default CalendarForm;
