const { request, response, Router } = require("express");
const departamentoController = require("./../../controllers/genericos/departamento.controller");

// Middleware
const middleware = require("./../../assets/middleware");

try{
    const router = Router();
    
    router.get("/", middleware.ensureAuthenticated, departamentoController.getData);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}