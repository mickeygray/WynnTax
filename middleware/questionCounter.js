// middleware/questionCounter.js
const WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_Q = 3;

function questionCounter(req, res, next) {
  const now = Date.now();
  let sess = {};

  // read signed cookie
  try {
    sess = req.signedCookies?.ts_qc ? JSON.parse(req.signedCookies.ts_qc) : {};
  } catch (_) {}

  // initialize or roll window
  if (!sess.resetAt || now > sess.resetAt) {
    sess = { count: 0, resetAt: now + WINDOW_MS };
  }

  // attach to request
  req.taxStewart = {
    count: sess.count,
    resetAt: sess.resetAt,
    remaining: Math.max(0, MAX_Q - sess.count),
    max: MAX_Q,
  };

  // helper for saving cookie
  req.saveTaxStewart = (nextCount) => {
    const payload = JSON.stringify({ count: nextCount, resetAt: sess.resetAt });
    res.cookie("ts_qc", payload, {
      httpOnly: true,
      sameSite: "Lax", // use "None" + secure:true if crossing sites
      secure: true, // set true in production w/ HTTPS
      maxAge: WINDOW_MS,
      signed: true,
      path: "/",
    });
  };

  next();
}

module.exports = questionCounter;
