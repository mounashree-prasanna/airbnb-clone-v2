import express from "express";
import { signupTraveler, loginTraveler, logoutTraveler, checkSession } 
  from "../controllers/travelercontrollerAuth.js";

const router = express.Router();

router.post("/signup", signupTraveler);
router.post("/login", loginTraveler);
router.post("/logout", logoutTraveler);
router.get("/logout", logoutTraveler); // Support both GET and POST for backward compatibility
router.get("/check-session", checkSession);

export default router;
