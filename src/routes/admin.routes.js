import { Router } from "express";
import {upload} from "../middlewares/multer.middlewares.js"
import { adminlogin } from "../controllers/admin.controllers.js";


const router = Router();

router.route("/login").post(adminlogin);


export default router;