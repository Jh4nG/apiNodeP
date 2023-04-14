const { getConnection } = require("./../database/database");
const global_c = require("./../assets/global.controller");
const { fecha_actual, fecha_actual_all } = global_c;


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
            delete result[0]['password_ok'];
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

const update_terminos = async (req,res) => {
    try{
        const connection = await getConnection();
        const { user} = req.params;
        const result = await connection.query(`UPDATE adm_clientes SET fecha_modi = ?, fecha_acepta = ? WHERE cedula_nit = ?`, [fecha_actual_all,fecha_actual_all,user]);
        if(result.affectedRows == 1){
            return res.json({ status : 200, msg : "Actualizado correctamente"});
        }
        return res.json({ status : 400, msg : "Error en actualización. Vuelva a intentar"});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

module.exports = {
    getUser,
    update_terminos
}