import React, { useReducer } from "react";
import axios from "axios";
import LeadContext from "./leadContext";
import leadReducer from "./leadReducer";

const LeadState = (props) => {
  const initialState = {};

  const [state, dispatch] = useReducer(leadReducer, initialState);

  const sendEmail = async (emailPayload) => {
    dispatch({ type: "SENDING_EMAILS" });
    try {
      const response = await axios.post("/send-email", emailPayload);
      dispatch({ type: "EMAILS_SENT", payload: response.data.message });
    } catch (error) {
      console.error("Error sending emails:", error);
      dispatch({ type: "EMAILS_ERROR", payload: "Failed to send emails." });
    }
  };
  const verifyCase = async (token) => {
    try {
      console.log(caseID);
      console.log(token);
      const response = await axios.post("/verify", { token });
      console.log(response.data);
      return response.data; // this will include status and possibly name
    } catch (error) {
      console.error("Error verifying case:", error);
      return { status: "error" };
    }
  };

  const setSchedule = async (scheduleData) => {
    try {
      const response = await axios.post("/setschedule", scheduleData);
      return response.data;
    } catch (error) {
      console.error("Error setting schedule:", error);
      return { success: false, message: "Failed to schedule appointment." };
    }
  };

  return (
    <LeadContext.Provider value={{ sendEmail, verifyCase, setSchedule }}>
      {props.children}
    </LeadContext.Provider>
  );
};

export default LeadState;
