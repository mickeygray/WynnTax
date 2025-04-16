import React, { useState } from "react";
import CalendarForm from "./CalendarForm";
import SuccessMessage from "./SuccessMessage";

const ScheduleMyCall = () => {
  const [caseNumber, setCaseNumber] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canSchedule, setCanSchedule] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch(`/api/logics/check-case/${caseNumber}`);
      const data = await response.json();

      if (data.status === "active" && !data.recentActivity) {
        setCanSchedule(true);
      } else if (data.recentActivity) {
        setError(
          "You've already scheduled a call recently. Please wait for an agent to contact you or call us directly."
        );
      } else {
        setError(
          "We couldn’t verify your case number. Please check and try again."
        );
      }
    } catch (err) {
      setError("An error occurred. Please try again later.");
    }

    setIsVerifying(false);
  };

  return (
    <div className="schedule-page">
      <div className="schedule-header">
        <h1>Schedule Your First Practitioner Call</h1>
        <p>
          Thank you for choosing Wynn Tax Solutions. You're one step closer to
          resolving your case. Enter your case number to begin.
        </p>
      </div>

      {!hasSubmitted && !canSchedule && (
        <form className="case-form" onSubmit={handleSubmit}>
          <label htmlFor="caseNumber">Case Number</label>
          <input
            type="text"
            id="caseNumber"
            value={caseNumber}
            onChange={(e) => setCaseNumber(e.target.value)}
            required
            disabled={isVerifying || hasSubmitted}
          />
          <button type="submit" disabled={isVerifying || hasSubmitted}>
            {isVerifying ? "Verifying..." : "Continue"}
          </button>
          {error && <p className="error-text">{error}</p>}
        </form>
      )}

      {canSchedule && (
        <CalendarForm
          caseNumber={caseNumber}
          onSuccess={() => setHasSubmitted(true)}
        />
      )}

      {hasSubmitted && <SuccessMessage />}

      <div className="schedule-footer">
        <p>
          If you need immediate help, you can call us directly at (866)
          379-6253.
        </p>
      </div>
    </div>
  );
};

export default ScheduleMyCall;
