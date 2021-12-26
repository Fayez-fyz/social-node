import express from "express";

const router = express.Router();

//from middlewares
import { requiresSignin,isAdmin } from "../middlewares";

//from controllers
import {
  register,
  login,
  currentUser,
  forgotPassword,
  profileUpdate,
  findPeople,
  addFollower,
  userFollow,
  userFollowing,
  removeFollower,
  userUnfollow,
  searchUser,
  getUser
} from "../controllers/auth";

router.post("/register", register);
router.post("/login", login);
router.get("/current-user", requiresSignin, currentUser);
router.post("/forgot-password", forgotPassword);
router.put("/profile-update", requiresSignin, profileUpdate);
router.get("/find-people", requiresSignin, findPeople);
router.put("/user-follow", requiresSignin, addFollower, userFollow);
router.put("/user-unfollow", requiresSignin, removeFollower, userUnfollow);
router.get("/user-following", requiresSignin, userFollowing);
router.get("/search-user/:query", searchUser);
router.get('/user/:username',getUser)
router.get('/current-admin',requiresSignin,isAdmin,currentUser)
module.exports = router;
