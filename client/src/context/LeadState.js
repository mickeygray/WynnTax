import React, { useReducer, useEffect } from "react";
import axios from "axios";
import LeadContext from "./leadContext";
import leadReducer from "./leadReducer";
import { captureUtmParams, getUtmParams } from "../utils/utmTracking";

const LeadState = (props) => {
  const initialState = {};
  const [state, dispatch] = useReducer(leadReducer, initialState);

  // Step 1: Capture UTM from landing URL once on mount
  useEffect(() => {
    captureUtmParams();
  }, []);

  const sendEmail = async (emailPayload) => {
    console.log(emailPayload);
    dispatch({ type: "SENDING_EMAILS" });
    try {
      const response = await axios.post("/api/contact-form", {
        ...emailPayload,
        utm: getUtmParams(), // Step 2: Attach UTM to outbound payload
      });
      dispatch({ type: "EMAILS_SENT", payload: response.data.message });
    } catch (error) {
      console.error("Error sending emails:", error);
      dispatch({ type: "EMAILS_ERROR", payload: "Failed to send emails." });
    }
  };

  const sendLeadForm = async (formData) => {
    dispatch({ type: "SENDING_FORM" });
    try {
      const response = await axios.post("/api/lead-form", {
        ...formData,
        utm: getUtmParams(),
      });
      console.log("Form Data:", formData);
      dispatch({ type: "FORM_SENT", payload: response.data.message });
    } catch (error) {
      console.error("Error sending lead form:", error);
      dispatch({ type: "FORM_ERROR", payload: "Failed to send form data." });
    }
  };

  const sendQuestion = async (payload) => {
    try {
      const response = await axios.post("/api/send-question", {
        ...payload,
        utm: getUtmParams(),
      });
      console.log("SendQuestion:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error sending question:", error);
      throw error;
    }
  };

  const askTaxQuestion = async (question) => {
    try {
      const res = await axios.post(
        "/api/answer",
        { question },
        { withCredentials: true },
      );
      return res.data;
    } catch (err) {
      console.error("askTaxQuestion failed:", err);
      return { ok: false, error: "Network error" };
    }
  };

  return (
    <LeadContext.Provider
      value={{ sendEmail, sendQuestion, sendLeadForm, askTaxQuestion }}
    >
      {props.children}
    </LeadContext.Provider>
  );
};

export default LeadState;
