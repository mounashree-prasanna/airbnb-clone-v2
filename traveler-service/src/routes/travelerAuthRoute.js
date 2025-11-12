import express from "express";
import { signupTraveler, loginTraveler, logoutTraveler } 
  from "../controllers/travelercontrollerAuth.js";

const router = express.Router();

router.post("/signup", signupTraveler);
router.post("/login", loginTraveler);
router.get("/logout", logoutTraveler);

export default router;
