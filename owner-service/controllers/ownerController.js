const Owner = require("../models/Owner");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// Helper: generate access token (short-lived)
const generateAccessToken = (owner) => {
  return jwt.sign(
    { id: owner._id, email: owner.email, role: owner.role },
    process.env.ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: "2m" }
  );
};

// Helper: generate refresh token (long-lived)
const generateRefreshToken = (owner) => {
  return jwt.sign(
    { id: owner._id, email: owner.email, role: owner.role },
    process.env.REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// @desc Register new owner
exports.registerOwner = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // ✅ Role validation (only owner role allowed)
    if (role && role !== "owner") {
      return res.status(403).json({
        message: "Access denied: only owner signup allowed",
      });
    }

    // ✅ Check if email already exists
    const existing = await Owner.findOne({ email });
    if (existing)
      return res
        .status(400)
        .json({ message: "Email already registered. Please log in." });

    // ✅ Use .save() to ensure pre('save') hook hashes the password
    const owner = new Owner({ name, email, password, phone, role: "owner" });
    await owner.save();

    // Generate both tokens
    const accessToken = generateAccessToken(owner);
    const refreshToken = generateRefreshToken(owner);

    // Store refresh token as sessionId in MongoDB
    owner.sessionId = refreshToken;
    await owner.save();

    res.status(201).json({
      message: "Owner registered successfully",
      accessToken,
      refreshToken,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Owner registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login owner
exports.loginOwner = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // ✅ Role validation (frontend toggle must send "owner")
    if (role && role !== "owner") {
      return res.status(403).json({
        message: "Access denied: wrong login role (expected owner)",
      });
    }

    // ✅ Find the owner by email
    const owner = await Owner.findOne({ email });
    if (!owner)
      return res.status(404).json({ message: "Owner not found" });

    // ✅ Validate role stored in DB
    if (owner.role !== "owner") {
      return res.status(403).json({
        message: "Access denied: this account is not an owner account",
      });
    }

    // ✅ Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, owner.password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    // Generate both tokens
    const accessToken = generateAccessToken(owner);
    const refreshToken = generateRefreshToken(owner);

    // Store refresh token as sessionId in MongoDB
    owner.sessionId = refreshToken;
    await owner.save();

    res.json({
      message: "Owner login successful",
      accessToken,
      refreshToken,
      owner: {
        id: owner._id,
        name: owner.name,
        email: owner.email,
        phone: owner.phone,
        role: owner.role,
      },
    });
  } catch (error) {
    console.error("Owner login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get owner profile
exports.getOwnerProfile = async (req, res) => {
  try {
    const owner = await Owner.findById(req.user.id).select("-password");
    if (!owner)
      return res.status(404).json({ message: "Owner not found" });

    res.json(owner);
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Logout owner
exports.logoutOwner = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    // If refreshToken is provided, try to clear it from MongoDB
    if (refreshToken) {
      try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
        const owner = await Owner.findById(decoded.id);
        
        if (owner && owner.sessionId === refreshToken) {
          // Clear sessionId (refresh token) from MongoDB
          owner.sessionId = null;
          await owner.save();
          return res.json({ message: "Owner logged out successfully" });
        } else if (owner) {
          // SessionId doesn't match, but clear it anyway
          owner.sessionId = null;
          await owner.save();
          return res.json({ message: "Owner logged out successfully" });
        }
      } catch (err) {
        // Invalid or expired refresh token, try to find user by decoding without verification
        try {
          const decoded = jwt.decode(refreshToken);
          if (decoded && decoded.id) {
            const owner = await Owner.findById(decoded.id);
            if (owner) {
              owner.sessionId = null;
              await owner.save();
            }
          }
        } catch (decodeErr) {
          // Ignore decode errors - token might be malformed or already cleared
        }
      }
    }
    
    // Even if refreshToken is missing or invalid, return success
    // Frontend has already cleared localStorage, so logout is effectively complete
    res.json({ message: "Owner logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    // Still return success to prevent frontend errors
    res.json({ message: "Owner logged out successfully" });
  }
};

// @desc Refresh access token
exports.refreshToken = async (req, res) => {
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

    // Find owner and verify sessionId matches
    const owner = await Owner.findById(decoded.id);
    if (!owner) {
      return res.status(404).json({ message: "Owner not found" });
    }

    // Verify the refresh token matches the stored sessionId
    if (owner.sessionId !== refreshToken) {
      // Invalid session - clear it and force re-login
      owner.sessionId = null;
      await owner.save();
      return res.status(401).json({ message: "Invalid session. Please login again." });
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(owner);

    res.json({
      message: "Token refreshed successfully",
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Check owner session
exports.checkSession = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    
    // If no token provided, check if refreshToken is in body
    if (!token) {
      const { refreshToken } = req.body;
      if (refreshToken) {
        // Try to use refresh token to get user info
        try {
          const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
          const owner = await Owner.findById(decoded.id).select("-password");
          
          if (!owner || owner.sessionId !== refreshToken) {
            return res.json({ isLoggedIn: false, role: null });
          }

          // Generate new access token
          const newAccessToken = generateAccessToken(owner);

          return res.json({
            isLoggedIn: true,
            role: owner.role,
            accessToken: newAccessToken,
            user: {
              id: owner._id,
              name: owner.name,
              email: owner.email,
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
      const owner = await Owner.findById(decoded.id).select("-password");
      if (!owner) return res.json({ isLoggedIn: false, role: null });

      return res.json({
        isLoggedIn: true,
        role: owner.role,
        user: {
          id: owner._id,
          name: owner.name,
          email: owner.email,
        },
      });
    } catch (err) {
      // Access token expired, try to use refresh token from MongoDB
      const { refreshToken } = req.body;
      if (refreshToken) {
        try {
          const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
          const owner = await Owner.findById(decoded.id).select("-password");
          
          if (!owner || owner.sessionId !== refreshToken) {
            return res.json({ isLoggedIn: false, role: null });
          }

          // Generate new access token
          const newAccessToken = generateAccessToken(owner);

          return res.json({
            isLoggedIn: true,
            role: owner.role,
            accessToken: newAccessToken,
            user: {
              id: owner._id,
              name: owner.name,
              email: owner.email,
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
          const owner = await Owner.findById(decoded.id).select("-password");
          if (owner && owner.sessionId) {
            // Verify the stored refresh token
            try {
              const refreshDecoded = jwt.verify(owner.sessionId, process.env.REFRESH_SECRET || process.env.JWT_SECRET);
              // Generate new access token
              const newAccessToken = generateAccessToken(owner);

              return res.json({
                isLoggedIn: true,
                role: owner.role,
                accessToken: newAccessToken,
                user: {
                  id: owner._id,
                  name: owner.name,
                  email: owner.email,
                },
              });
            } catch (refreshVerifyErr) {
              // Refresh token expired, clear it
              owner.sessionId = null;
              await owner.save();
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

// @desc Update owner profile
exports.updateOwnerProfile = async (req, res) => {
  try {
    const updates = req.body;
    const owner = await Owner.findByIdAndUpdate(req.user.id, updates, {
      new: true,
    }).select("-password");

    res.json({
      message: "Profile updated successfully",
      owner,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
