const { getConnection } = require("./../database/database");
const global_c = require("./../assets/global.controller");
const { fecha_actual_all, msgUpdateOk, msgUpdateErr, msgTry, msgDataIncorrecta } = global_c;

const getUser = async (req,res) =>{
    try{
        const connection = await getConnection();
        const { user, tipousuario } = req.params;
        let dataValida = {
            'Usuario' : user,
            'Tipo usuario' : tipousuario
        };
        console.log(dataValida);
        let valida = global_c.validateParams(dataValida);
        if(valida.status == false){
            res.status(400).json({status: 400, msg : valida.msg});
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
        res.status(400).json({ status : 400, msg : msgDataIncorrecta });
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
            return res.json({ status : 200, msg : `Usuario ${msgUpdateOk}`});
        }
        return res.json({ status : 400, msg : `${msgUpdateErr} Usuario. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}


try{
    module.exports = {
        getUser,
        update_terminos
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}