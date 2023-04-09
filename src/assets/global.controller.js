const { config } = require("dotenv");
const { getConnection } = require("./../database/database");

const d = new Date();
const fecha_actual= `${d.getFullYear()}-${(d.getMonth()+1 < 10)? `0${d.getMonth()+1}` : d.getMonth()}-${(d.getDate() < 10)? `0${d.getDate()}`:d.getDate()}`;
const fecha_actual_all = `${d} ${(d.getHours() < 10)? `0${d.getHours()}`:d.getHours()}:${(d.getMinutes() < 10)? `0${d.getMinutes()}`:d.getMinutes()}:${(d.getSeconds() < 10)? `0${d.getSeconds()}`:d.getSeconds()}`;

function generate_token(length){
    //edit the token allowed characters
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

const verifyToken = async (req,res,next) => {
    try{
        const connection = await getConnection();
        let { user,tipousuario,token } = req.params;
        token = (token == null || token == undefined) ? req.body.token : token;
        user = (user == null || user == undefined) ? req.body.user : user;
        tipousuario = (tipousuario == null || tipousuario == undefined) ? req.body.tipousuario : tipousuario;

        if((token == null || token == undefined) || (user == null || user == undefined) || ((tipousuario == null || tipousuario == undefined)) ){
            return {status : 400, msg : 'No autorizado'};
        }else{
            let table = (tipousuario == 'S') ? 'adm_clientes' : 'adm_usuarios';
            let campo = (tipousuario == 'S') ? 'cedula_nit' : 'username';    
            const result = await connection.query(`SELECT token FROM ${table} WHERE ${campo} = ?`,user);
            if(result.length > 0){
                if(token === result[0].token){
                    next();
                }
                return res.status(400).json({status : 400, msg : 'No autorizado'});
            }else{
                return res.status(400).json({status : 400, msg : 'No autorizado'});
                
            }
        }
    }catch(error){
        return res.status(500).json({status : 500, msg : error.message});
    }
}

const sendEmail = () => {

}

module.exports = {
    sendEmail,
    generate_token,
    verifyToken,
    fecha_actual,
    fecha_actual_all
}