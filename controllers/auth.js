import { comparePassword, hashPassword } from "../helpers/auth";
import User from "../models/users";
import jwt from "jsonwebtoken";
import { nanoid } from "nanoid";
import { json } from "express";

export const register = async (req, res) => {
  // console.log('reg endpoint',req.body)
  const { name, email, password, secret } = req.body;

  // Validation
  if (!name) {
    return res.json({
      error: "Name is Required",
    });
  }
  if (!password || password.length < 8) {
    return res.json({
      error: "Password is required and should be 8 characters long",
    });
  }
  if (!secret) {
    return res.json({
      error: "Answer is Required",
    });
  }
  const exist = await User.findOne({ email });
  if (exist) {
    return res.json({
      error: "Email is taken",
    });
  }
  // Hash the Password
  const hashedPassword = await hashPassword(password);

  const user = new User({
    name,
    email,
    password: hashedPassword,
    secret,
    username: nanoid(6),
  });
  try {
    await user.save();
    console.log("Registered USER =>", user);
    return res.json({
      ok: true,
    });
  } catch (error) {
    console.log("Registered Failed =>", error);
    return res.status(400).send("Error, Try again");
  }
};

export const login = async (req, res) => {
  //   console.log(req.body)
  try {
    const { email, password } = req.body;
    //check if our db has user with that email
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        error: "User not found",
      });
    }
    //check password
    const match = await comparePassword(password, user.password);
    if (!match) {
      return res.json({
        error: "Wrong password",
      });
    }
    //create signed token
    const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    user.password = undefined;
    user.secret = undefined;
    res.json({
      token,
      user,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).send("Error,Try again");
  }
};

export const currentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    // res.json(user)
    res.json({ ok: true });
  } catch (error) {
    console.log(error);
    res.sendStatus(400);
  }
};

export const forgotPassword = async (req, res) => {
  //   console.log(req.body)
  const { email, newPassword, secret } = req.body;
  //validation
  if (!newPassword || !newPassword > 8) {
    return res.json({
      error: "New password is required and should be more than 8 characters",
    });
  }
  if (!secret) {
    return res.json({
      error: "Secret is required",
    });
  }
  const user = await User.findOne({ email, secret });

  if (!user) {
    return res.json({
      error: "We cannot verify you with those details",
    });
  }
  try {
    const hashed = await hashPassword(newPassword);
    await User.findByIdAndUpdate(user._id, { password: hashed });
    return res.json({
      success: "Congrats, Now you can login with new password",
    });
  } catch (error) {
    console.log(error);
    return res.json({
      error: "Something wrong. Try again.",
    });
  }
};

export const profileUpdate = async (req, res) => {
  try {
    const data = {};
    if (req.body.username) {
      data.username = req.body.username;
    }
    if (req.body.about) {
      data.about = req.body.about;
    }
    if (req.body.name) {
      data.name = req.body.name;
    }
    if (req.body.password) {
      if (req.body.password.length < 8) {
        return res.json({
          error: "Password is required and should be min 8 characters long",
        });
      } else {
        data.password = await hashPassword(req.body.password);
      }
    }
    if (req.body.secret) {
      data.secret = req.body.secret;
    }
    if (req.body.image) {
      data.image = req.body.image;
    }
    let user = await User.findByIdAndUpdate(req.user._id, data, { new: true });
    // console.log('updated user',user)
    user.password = undefined;
    user.secret = undefined;
    res.json(user);
  } catch (error) {
    if (error.code == 11000) {
      return res.json({
        error: "Duplicate username",
      });
    }
    console.log(error);
  }
};

//to make suggestuion list
export const findPeople = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    //user following
    let following = user.following;
    following.push(user._id);
    //nin = not included
    const people = await User.find({ _id: { $nin: following } })
      .select("-password -secret")
      .limit(10);
    res.json(people);
  } catch (err) {
    console.log(err);
  }
};

//middleware
// addFollower,userFollow
export const addFollower = async (req, res, next) => {
  try {
    //req.body_id is geting the id from user displayed in front by clicking follow
    //we get the body  link  instead of user
    const user = await User.findByIdAndUpdate(req.body._id, {
      $addToSet: { followers: req.user._id },
    });
    next();
  } catch (err) {
    //
    console.log(err);
  }
};

export const userFollow = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $addToSet: { following: req.body._id },
      },
      { new: true }
    ).select("-password -secret");
    res.json(user);
  } catch (err) {
    console.log(err);
  }
};
export const userFollowing = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = await User.find({ _id: user.following }).limit(100);
    res.json(following);
  } catch (err) {
    console.log(err);
  }
};

export const removeFollower = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.body._id, {
      $pull: { followers: req.user._id },
    });
    next();
  } catch (error) {
    console.log(error);
  }
};

export const userUnfollow = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        $pull: { following: req.body._id },
      },
      { new: true }
    );
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};
export const searchUser = async (req, res) => {
  const { query } = req.params;
  if (!query) return;
  try {
    const user = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
    }).select("-password -secret");
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};

export const getUser = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).select(
      "-password -secret"
    );
    res.json(user);
  } catch (error) {
    console.log(error);
  }
};
