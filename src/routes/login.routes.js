const { request, response, Router } = require("express");
const loginController = require("./../controllers/login.controller");

// Middleware
const middleware = require("./../assets/middleware");

try{
    const router = Router();
    
    router.post("/", loginController.startSession);
    router.get("/out/:user/:tipousuario", middleware.ensureAuthenticated, loginController.logOut);
    router.get("/sendCambio/:user", loginController.sendRecuperarContrasena);
    router.get("/validarCodigo/:user/:token", loginController.validateCodigo);
    router.put("/actualizaPassword", loginController.actializaPassword);
    
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}