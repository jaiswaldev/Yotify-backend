import { Router } from "express";
import { Registeruser, loginUser, loggedOutUser, refreshAccessToken , changeUserDetails,
    checkOldPassword,updatePassword,deleteUser,getUserProfile,getHistory} from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middlewares.js"
import { verifyJWT } from "../middlewares/authentication.middlewares.js"
const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]),
    Registeruser
)
router.route("/login").post(loginUser)
router.route("/logout").get( verifyJWT, loggedOutUser)
router.route("/refresh").post(refreshAccessToken)
router.route("/edit-details").post(verifyJWT, 
    upload.fields([
        {
            name : "avatar",
            maxCount:1
        },
        {
            name: "coverImage",
            maxCount:1
        }
    ]), changeUserDetails)

router.route("/checkPassword").post(verifyJWT, checkOldPassword)
router.route("/updatePassword").post(verifyJWT, updatePassword)
router.route("/deleteUser").get(verifyJWT, deleteUser)
router.route("/c/:username").get(getUserProfile)
router.route("/history").get(verifyJWT, getHistory)


export default router;
