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

      console.log(emailPayload);
      dispatch({ type: "EMAILS_SENT", payload: response.data.message });
    } catch (error) {
      console.error("Error sending emails:", error);
      dispatch({ type: "EMAILS_ERROR", payload: "Failed to send emails." });
    }
  };

  return (
    <LeadContext.Provider value={{ sendEmail }}>
      {props.children}
    </LeadContext.Provider>
  );
};

export default LeadState;
