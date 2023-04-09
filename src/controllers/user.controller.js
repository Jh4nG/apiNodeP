const { getConnection } = require("./../database/database");
const globalF = require("./../assets/global.controller");


const getUser = async (req,res) =>{
    try{
        const connection = await getConnection();
        const { user, tipousuario } = req.params;
        if(user === undefined || tipousuario === undefined){
            res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
            return;
        }
        let table = (tipousuario == 'S') ? 'adm_clientes' : 'adm_usuarios';
        let campo = (tipousuario == 'S') ? 'cedula_nit' : 'username';
        var result = await connection.query(`SELECT * FROM ${table} WHERE ${campo} = ?`,user);
        if(result.length > 0){
            delete result[0]['password'];
            delete result[0]['token'];
            res.status(200).json({ status : 200, user, tipousuario, data : result[0] });
            return;
        }
        res.status(400).json({ status : 400, msg : 'Data incorrecta' });
    }catch(error){
        res.json({ status : 500, msg : error.message});
    } 
}

module.exports = {
    getUser
}