import express from "express";
import {
  generatePresentation,
} from "../controllers/presentationController.js";


const router = express.Router();


router.post(
  "/",
  generatePresentation
);


export default router;
