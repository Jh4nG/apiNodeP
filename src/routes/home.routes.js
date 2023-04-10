const { request, response, Router } = require("express");
const homeController = require("./../controllers/home.controller");

// Middleware
const middleware = require("./../assets/middleware");

const router = Router();

router.get("/:user", middleware.ensureAuthenticated, homeController.getVencimientos);

module.exports = router;
