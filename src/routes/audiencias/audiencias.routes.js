const { request, response, Router } = require("express");
const audienciasController = require("./../../controllers/audiencias/audiencias.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();

    router.get("/getVencimientos/:user", middleware.ensureAuthenticated, audienciasController.getVencimientos);
    router.post("/getAudiencias", middleware.ensureAuthenticated, audienciasController.getAudiencias);
    router.get("/getAudiencias/:username/:id", middleware.ensureAuthenticated, audienciasController.getAudienciasId);
    router.put("/updateAudiencias", middleware.ensureAuthenticated, audienciasController.updateAudiencias);

    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}