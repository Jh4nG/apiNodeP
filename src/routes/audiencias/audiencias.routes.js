const { request, response, Router } = require("express");
const audienciasController = require("./../../controllers/audiencias/audiencias.controller");

// Middleware
const middleware = require("./../../assets/middleware");

const router = Router();

router.post("/getAudiencias", middleware.ensureAuthenticated, audienciasController.getAudiencias);

module.exports = router;
