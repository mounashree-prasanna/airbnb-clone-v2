import Traveler from "../models/travelerModel.js";
import jwt from "jsonwebtoken";

// Helper: generate access token (short-lived)
const generateAccessToken = (traveler) => {
  return jwt.sign(
    { id: traveler._id, email: traveler.email, role: traveler.role },
    process.env.ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: "2m" }
  );
};

// Helper: generate refresh token (long-lived)
const generateRefreshToken = (traveler) => {
  return jwt.sign(
    { id: traveler._id, email: traveler.email, role: traveler.role },
    process.env.REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// @desc Register new traveler
export const signupTraveler = async (req, res) => {
  try {
    const { name, email, password, role, phone, city, country, language, gender } = req.body;

    // ✅ Validate role
    if (role && role !== "traveler") {
      return res
        .status(403)
        .json({ message: "Access denied: traveler signup only" });
    }

    const existing = await Traveler.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    // Always enforce traveler role, include optional fields
    const travelerData = { name, email, password, role: "traveler" };
    if (phone) travelerData.phone = phone;
    if (city) travelerData.city = city;
    if (country) travelerData.country = country;
    if (language) travelerData.languages = language;
    if (gender) travelerData.gender = gender;

    const traveler = new Traveler(travelerData);
    await traveler.save();

    // Generate both tokens
    const accessToken = generateAccessToken(traveler);
    const refreshToken = generateRefreshToken(traveler);

    // Store refresh token as sessionId in MongoDB
    traveler.sessionId = refreshToken;
    await traveler.save();

    res.status(201).json({
      message: "Traveler registered successfully",
      accessToken,
      refreshToken,
      traveler: {
        id: traveler._id,
        name: traveler.name,
        email: traveler.email,
        role: traveler.role,
      },
    });
  } catch (error) {
    console.error("Traveler registration error:", error);
    res.status(500).json({ message: error.message || "Server error" });
  }
};

// @desc Login traveler
export const loginTraveler = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ✅ Must come from traveler role toggle
    if (role && role !== "traveler") {
      return res.status(403).json({
        message: "Access denied: wrong login role (expected traveler)",
      });
    }

    const traveler = await Traveler.findOne({ email });
    if (!traveler)
      return res.status(404).json({ message: "Traveler not found" });

    // Ensure stored account belongs to traveler
    if (traveler.role !== "traveler") {
      return res.status(403).json({
        message: "Access denied: this account is not a traveler account",
      });
    }

    const isMatch = await traveler.matchPassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate both tokens
    const accessToken = generateAccessToken(traveler);
    const refreshToken = generateRefreshToken(traveler);

    // Store refresh token as sessionId in MongoDB
    traveler.sessionId = refreshToken;
    await traveler.save();

    res.json({
      message: "Traveler login successful",
      accessToken,
      refreshToken,
      traveler: {
        id: traveler._id,
        name: traveler.name,
        email: traveler.email,
        role: traveler.role,
      },
    });
  } catch (error) {
    console.error("Traveler login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Logout traveler
export const logoutTraveler = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return res.status(400).json({ message: "Refresh token required for logout" });
    }

    // Verify and find user by refresh token
    try {
      const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
      const traveler = await Traveler.findById(decoded.id);
      
      if (traveler && traveler.sessionId === refreshToken) {
        // Clear sessionId (refresh token) from MongoDB
        traveler.sessionId = null;
        await traveler.save();
        return res.json({ message: "Traveler logged out successfully" });
      } else if (traveler) {
        // SessionId doesn't match, but clear it anyway
        traveler.sessionId = null;
        await traveler.save();
        return res.json({ message: "Traveler logged out successfully" });
      }
    } catch (err) {
      // Invalid or expired refresh token, but still return success
      // Try to find user by decoding without verification
      try {
        const decoded = jwt.decode(refreshToken);
        if (decoded && decoded.id) {
          const traveler = await Traveler.findById(decoded.id);
          if (traveler) {
            traveler.sessionId = null;
            await traveler.save();
          }
        }
      } catch (decodeErr) {
        // Ignore decode errors
      }
    }

    res.json({ message: "Traveler logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error during logout" });
  }
};

// @desc Refresh access token
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: "Refresh token required" });
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    // Find traveler and verify sessionId matches
    const traveler = await Traveler.findById(decoded.id);
    if (!traveler) {
      return res.status(404).json({ message: "Traveler not found" });
    }

    // Verify the refresh token matches the stored sessionId
    if (traveler.sessionId !== refreshToken) {
      // Invalid session - clear it and force re-login
      traveler.sessionId = null;
      await traveler.save();
      return res.status(401).json({ message: "Invalid session. Please login again." });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(traveler);

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Check traveler session
export const checkSession = async (req, res) => {
  try {
    const token =
      req.headers.authorization?.split(" ")[1] || req.cookies?.token;
    
    // If no token provided, check if refreshToken is in body
    if (!token) {
      const { refreshToken } = req.body;
      if (refreshToken) {
        // Try to use refresh token to get user info
        try {
          const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
          const traveler = await Traveler.findById(decoded.id).select("-password");
          
          if (!traveler || traveler.sessionId !== refreshToken) {
            return res.json({ isLoggedIn: false, role: null });
          }

          // Generate new access token
          const newAccessToken = generateAccessToken(traveler);

          return res.json({
            isLoggedIn: true,
            role: traveler.role,
            accessToken: newAccessToken,
            user: {
              id: traveler._id,
              name: traveler.name,
              email: traveler.email,
            },
          });
        } catch (refreshErr) {
          return res.json({ isLoggedIn: false, role: null });
        }
      }
      return res.json({ isLoggedIn: false, role: null });
    }

    // Try to verify access token
    try {
      const decoded = jwt.verify(token, process.env.ACCESS_SECRET || process.env.JWT_SECRET);
      const traveler = await Traveler.findById(decoded.id).select("-password");
      if (!traveler) return res.json({ isLoggedIn: false, role: null });

      return res.json({
        isLoggedIn: true,
        role: traveler.role,
        user: {
          id: traveler._id,
          name: traveler.name,
          email: traveler.email,
        },
      });
    } catch (err) {
      // Access token expired, try to use refresh token from MongoDB
      const { refreshToken } = req.body;
      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
          const traveler = await Traveler.findById(decoded.id).select("-password");
          
          if (!traveler || traveler.sessionId !== refreshToken) {
            return res.json({ isLoggedIn: false, role: null });
          }

          // Generate new access token
          const newAccessToken = generateAccessToken(traveler);

          return res.json({
            isLoggedIn: true,
            role: traveler.role,
            accessToken: newAccessToken,
            user: {
              id: traveler._id,
              name: traveler.name,
              email: traveler.email,
            },
          });
        } catch (refreshErr) {
          return res.json({ isLoggedIn: false, role: null });
        }
      }

      // No refresh token provided, check MongoDB for stored sessionId
      try {
        // Decode without verification to get user ID
        const decoded = jwt.decode(token);
        if (decoded && decoded.id) {
          const traveler = await Traveler.findById(decoded.id).select("-password");
          if (traveler && traveler.sessionId) {
            // Verify the stored refresh token
            try {
              const refreshDecoded = jwt.verify(traveler.sessionId, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
              // Generate new access token
              const newAccessToken = generateAccessToken(traveler);

              return res.json({
                isLoggedIn: true,
                role: traveler.role,
                accessToken: newAccessToken,
                user: {
                  id: traveler._id,
                  name: traveler.name,
                  email: traveler.email,
                },
              });
            } catch (refreshVerifyErr) {
              // Refresh token expired, clear it
              traveler.sessionId = null;
              await traveler.save();
            }
          }
        }
      } catch (decodeErr) {
        // Invalid token format
      }

      return res.json({ isLoggedIn: false, role: null });
    }
  } catch (err) {
    console.error("Check session error:", err);
    return res.json({ isLoggedIn: false, role: null });
  }
};
