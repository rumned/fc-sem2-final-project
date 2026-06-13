const User = require("../models/User");

// @desc    Get all users
// @route   GET /api/users?name=&email=
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.name)  filter.name  = { $regex: req.query.name,  $options: "i" };
    if (req.query.email) filter.email = { $regex: req.query.email, $options: "i" };

    const users = await User.find(filter).select("-password");
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (own profile) or Admin
const getUser = async (req, res, next) => {
  try {
    // Regular users can only fetch their own profile
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (own profile) or Admin
const updateUser = async (req, res, next) => {
  try {
    if (req.user.role !== "admin" && req.user.id !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // Prevent non-admins from changing their role
    if (req.user.role !== "admin") delete req.body.role;
    // Never update password through this route
    delete req.body.password;

    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    await user.deleteOne();
    res.status(200).json({ success: true, message: "User removed" });
  } catch (error) {
    next(error);
  }
};

module.exports = { getUsers, getUser, updateUser, deleteUser };
