const config =  require("./../config");
const { getConnection } = require("./../database/database");

exports.ensureAuthenticated = async (req,res,next) => {
    try{
        // const connection = await getConnection();
        if (!req.headers.authorization) {
            return res
              .status(403)
              .send({ message: "Tu petición no tiene cabecera de autorización" });
        }
        var token = req.headers.authorization.split(" ")[1];
        // let { user,tipousuario } = req.params;
        // user = (user == null || user == undefined) ? req.body.user : user;
        // tipousuario = (tipousuario == null || tipousuario == undefined) ? req.body.tipousuario : tipousuario;

        if((token == null || token == undefined) 
            // || (user == null || user == undefined) || (tipousuario == null || tipousuario == undefined) 
        ){
            return res.status(401).send({ message: "El token ha expirado" });
        }else{
            if(atob(token) === config.hash){
                return next();
            }
            return res.status(401).send({ message: "El token ha expirado" });
            // let table = (tipousuario == 'S') ? 'adm_clientes' : 'adm_usuarios';
            // let campo = (tipousuario == 'S') ? 'cedula_nit' : 'username';    
            // const result = await connection.query(`SELECT token FROM ${table} WHERE ${campo} = ?`,user);
            // if(result.length > 0){
            //     if(token === result[0].token){
            //         return next();
            //     }
            //     return res.status(401).send({ message: "El token ha expirado" });
            // }else{
            //     return res.status(401).send({ message: "El token ha expirado" });
            // }
        }
    }catch(error){
        return res.status(500).json({status : 500, msg : error.message});
    }
}