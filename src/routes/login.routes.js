const { request, response, Router } = require("express");
const loginController = require("./../controllers/login.controller");

// Middleware
const middleware = require("./../assets/middleware");

const router = Router();

router.post("/", loginController.startSession);
router.get("/out/:user/:tipousuario", middleware.ensureAuthenticated, loginController.logOut);

module.exports = router;