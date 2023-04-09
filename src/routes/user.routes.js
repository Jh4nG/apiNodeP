const { request, response, Router } = require("express");
const userController = require ("./../controllers/user.controller");

// Middleware
const middleware = require("./../assets/middleware");

const router = Router();

router.get("/:user/:tipousuario", middleware.ensureAuthenticated, userController.getUser);

module.exports = router;