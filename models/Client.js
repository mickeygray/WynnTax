const mongoose = require("mongoose");

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  cell: { type: String, required: true },
  caseNumber: { type: String, required: true },
  initialPayment: { type: Number },
  secondPaymentDate: { type: Date },
  domain: { type: String, enum: ["TAG", "WYNN"], default: "TAG" },
  saleDate: { type: Date, required: true },
  stage: { type: String, enum: ["prac", "poa", "433a"], default: "prac" },
  poaDate: { type: Date },
  followUpDate: { type: Date },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  alertAdserv: { type: Boolean, default: false },
  token: { type: String },
  tokenExpiresAt: { type: Date },
});

module.exports = mongoose.model("Client", ClientSchema);
