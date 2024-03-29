const { request, response, Router } = require("express");
const userController = require ("./../controllers/user.controller");

// Middleware
const middleware = require("./../assets/middleware");

try{
    const router = Router();

    router.get("/getUser/:user/:tipousuario", middleware.ensureAuthenticated, userController.getUser);
    router.get("/terminos/:user", middleware.ensureAuthenticated, userController.update_terminos);
    router.get("/child/:user", middleware.ensureAuthenticated, userController.getChildParents);
    router.put("/updatePassword", middleware.ensureAuthenticated, userController.actualizaPassword);
    router.get("/getTerminos", middleware.ensureAuthenticated, userController.getTerminos);
    module.exports = router;
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}