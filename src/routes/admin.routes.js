import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { adminlogin,addAdmin, adminlogout} from "../controllers/admin.controllers.js";
import { verifyAdmin } from "../middlewares/authentication.middlewares.js";


const router = Router();

router.route("/login").post(adminlogin);
router.route("/addAdmin").post(verifyAdmin,addAdmin);
router.route("/logout").get(verifyAdmin, adminlogout);



export default router;