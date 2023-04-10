const { request, response, Router } = require("express");
const userController = require ("./../controllers/user.controller");

// Middleware
const middleware = require("./../assets/middleware");

const router = Router();

router.get("/getUser/:user/:tipousuario", middleware.ensureAuthenticated, userController.getUser);
router.get("/terminos/:user", middleware.ensureAuthenticated, userController.update_terminos);

module.exports = router;