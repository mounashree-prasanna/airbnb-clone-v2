import express from "express";
import { signupTraveler, loginTraveler, logoutTraveler, checkSession, refreshToken } 
  from "../controllers/travelercontrollerAuth.js";

const router = express.Router();

router.post("/signup", signupTraveler);
router.post("/login", loginTraveler);
router.post("/logout", logoutTraveler);
router.post("/refresh", refreshToken);
router.post("/check-session", checkSession); // Changed to POST to accept refreshToken in body
router.get("/check-session", checkSession); // Keep GET for backward compatibility

export default router;
