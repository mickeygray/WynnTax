import React, { useState, useEffect, useContext } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { useParams, useNavigate } from "react-router-dom";
import LeadContext from "../context/leadContext";
import AlreadySubmitted from "./AlreadySubmitted";
import SuccessMessage from "./SuccessMessage";

const timezones = [
  { label: "Eastern (EST)", value: "EST", offset: -5 },
  { label: "Central (CST)", value: "CST", offset: -6 },
  { label: "Mountain (MST)", value: "MST", offset: -7 },
  { label: "Pacific (PST)", value: "PST", offset: -8 },
  { label: "Alaska/Hawaii", value: "AK", offset: -9 },
];

const ScheduleMyCall = () => {
  const { verifyCase, setSchedule } = useContext(LeadContext);
  const { token } = useParams();
  const navigate = useNavigate();

  const [caseInfo, setCaseInfo] = useState(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedTimeZone, setSelectedTimeZone] = useState("EST");
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (token) {
      const checkToken = async () => {
        try {
          const data = await verifyCase(token);
          setStatus(data.status);
          setCaseInfo(data);
        } catch (err) {
          setStatus("invalidToken");
        }
      };

      checkToken();
    }
  }, [token]);

  const getTimeSlots = () => {
    const localStartHour = 8; // 8 AM local
    const pstEndHour = 17.5; // 5:30 PM PST

    const tz = timezones.find((z) => z.value === selectedTimeZone);
    if (!tz) return [];

    const offsetDiff = tz.offset - -8; // PST is -8
    const localEndHour = pstEndHour + offsetDiff;

    const slots = [];

    for (let hour = localStartHour; hour <= localEndHour; hour++) {
      const displayHour = Math.floor(hour);
      const isHalf = hour % 1 !== 0;

      const labelHour = displayHour % 12 || 12;
      const period = displayHour >= 12 ? "PM" : "AM";

      if (!isHalf) {
        slots.push(`${labelHour}:00 ${period}`);
      } else {
        slots.push(`${labelHour}:30 ${period}`);
      }

      // Manually insert :30 for each hour
      if (!isHalf && hour + 0.5 <= localEndHour) {
        const nextHalfLabelHour = displayHour % 12 || 12;
        const nextHalfPeriod = displayHour >= 12 ? "PM" : "AM";
        slots.push(`${nextHalfLabelHour}:30 ${nextHalfPeriod}`);
      }
    }

    return slots;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const userOffset = timezones.find(
      (z) => z.value === selectedTimeZone
    ).offset;
    const pstOffset = -8;
    const [hourRaw, minuteRaw] = selectedTime.split(":");
    const hour = parseInt(hourRaw);
    const minute = minuteRaw.includes("30") ? 30 : 0;
    const isPM = selectedTime.includes("PM") && hour !== 12;

    const localHour = isPM ? hour + 12 : hour;
    const pstHour = localHour + (pstOffset - userOffset);

    const pstDate = new Date(selectedDate);
    pstDate.setHours(pstHour);
    pstDate.setMinutes(minute);

    const result = await setSchedule({
      ...caseInfo,
      selectedDate: pstDate,
      selectedTime,
    });

    if (result.success) {
      setStatus("caseNumberHasScheduled");
    }
  };

  const renderMessage = () => {
    switch (status) {
      case "caseNumberCanSchedule":
        return null;
      case "caseNumberIsDelinquent":
        return (
          <p>
            Your account is delinquent. Please call the billing line directly.
          </p>
        );
      case "caseNumberIsDead":
        return (
          <p>
            Your case is currently closed. For further assistance, please call
            the main line.
          </p>
        );
      case "caseNumberHasScheduled":
        return <SuccessMessage />;
      case "caseNumberIsClientOverlimit":
        return (
          <p>
            You've recently scheduled. Please wait or call our services line.
          </p>
        );
      case "invalidToken":
        return <AlreadySubmitted />;
      default:
        return null;
    }
  };

  const canSchedule = status === "caseNumberCanSchedule";

  useEffect(() => {
    const terminalStatuses = [
      "caseNumberIsDelinquent",
      "caseNumberIsDead",
      "caseNumberIsClientOverlimit",
      "invalidToken",
      "caseNumberHasScheduled",
    ];

    if (terminalStatuses.includes(status)) {
      const timer = setTimeout(() => navigate("/"), 60000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);
  if (status === "caseNumberHasScheduled") {
    return <SuccessMessage />;
  }

  if (status === "invalidToken") {
    return <AlreadySubmitted />;
  }
  return (
    <div className="schedule-container">
      <div className="schedule-header">
        <h1>
          {stage === "poa"
            ? "Schedule Your Financial Statement Call"
            : stage === "433a"
            ? "Update Your Financial Records"
            : "Schedule Your Practitioner Call"}
        </h1>
        <p>
          {caseInfo?.stage === "poa" ? (
            <>
              Congratulations! We've successfully filed your Power of Attorney.
              You're now protected and we'll be communicating with the IRS on
              your behalf. The next step is to complete a financial statement
              (Form 433-A) so we can start resolving your balances.
            </>
          ) : caseInfo?.stage === "433a" ? (
            <>
              We’ve received updates from the IRS regarding your case. To keep
              your file accurate and moving forward, we need to review and
              update your financial information. Please schedule a time to speak
              with our team.
            </>
          ) : (
            <>
              A Practitioner Phone Call is where we contact the IRS with you on
              the line to confirm your balances. It’s a powerful investigative
              tool that gives us immediate insight into your case. During this
              call, we’ll walk you through the process and begin reviewing the
              practical steps to resolve your tax situation.
            </>
          )}
        </p>
      </div>

      {renderMessage()}

      {canSchedule && (
        <form onSubmit={handleSubmit}>
          <div className="timezone-select">
            <label htmlFor="timezone">Your Time Zone</label>
            <select
              id="timezone"
              required
              value={selectedTimeZone}
              onChange={(e) => setSelectedTimeZone(e.target.value)}
            >
              {timezones.map((tz, idx) => (
                <option key={idx} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            minDate={new Date()}
          />

          <div className="time-slots">
            {getTimeSlots().map((time, idx) => (
              <div
                key={idx}
                className={`time-slot ${
                  selectedTime === time ? "selected" : ""
                }`}
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="schedule-submit-button"
            disabled={!selectedTime}
          >
            Schedule Appointment
          </button>
        </form>
      )}
    </div>
  );
};

export default ScheduleMyCall;
