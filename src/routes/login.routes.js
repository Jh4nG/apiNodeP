const { request, response, Router } = require("express");
const loginController = require("./../controllers/login.controller");

// import { request, response, Router } from "express";
// import { methods as loginController } from "./../controllers/login.controller";

const router = Router();

router.post("/", loginController.startSession);

module.exports = router;