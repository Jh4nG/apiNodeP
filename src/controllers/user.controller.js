const md5 = require('md5');
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
        let valida = global_c.validateParams(dataValida);
        if(valida.status == false){
            connection.end();
            return res.status(400).json({status: 400, msg : valida.msg});
        }
        let table = (tipousuario == 'S') ? 'adm_clientes' : 'adm_usuarios';
        let campo = (tipousuario == 'S') ? 'cedula_nit' : 'username';
        var result = await connection.query(`SELECT * FROM ${table} WHERE ${campo} = ?`,user);
        if(result.length > 0){
            delete result[0]['password_ok'];
            delete result[0]['password'];
            delete result[0]['token'];
            if(tipousuario == 'S'){
                let parent = await global_c.getParentUser(connection, user);
                result[0].group_users = btoa(parent.data.cc);
                result[0].parent = btoa(parent.data.cedula_nit);
            }
            connection.end();
            return res.status(200).json({ status : 200, user, tipousuario, data : result[0] });
        }
        connection.end();
        return res.status(400).json({ status : 400, msg : msgDataIncorrecta });
    }catch(error){
        res.json({ status : 500, msg : error.message});
    } 
}

const update_terminos = async (req,res) => {
    try{
        const connection = await getConnection();
        const { user } = req.params;
        const result = await connection.query(`UPDATE adm_clientes SET fecha_modi = ?, fecha_acepta = ? WHERE cedula_nit = ?`, [fecha_actual_all,fecha_actual_all,user]);
        if(result.affectedRows == 1){
            connection.end();
            return res.json({ status : 200, msg : `Usuario ${msgUpdateOk}`});
        }
        connection.end();
        return res.json({ status : 400, msg : `${msgUpdateErr} Usuario. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getChildParents = async (req, res) => {
    try{
        const { user } = req.params;
        if(user != undefined && user != ''){
            const connection = await getConnection();
            const result = await global_c.getChildParents(connection,user);
            connection.end();
            return res.status(result.status).json(result);
        }
        return res.json({ status : 400, msg : `Usuario es necesario`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const actualizaPassword = async (req,res) => {
    try{
        const { user, tipousuario, password_actual, password_new, password_confirm } = req.body;
        if(user != undefined && user != '' && password_new === password_confirm){
            let table = (tipousuario == 'S') ? 'adm_clientes' : 'adm_usuarios';
            let cmp = (tipousuario == 'S') ? 'cedula_nit' : 'username';
            const connection = await getConnection();
            const query = await connection.query(`SELECT * FROM ${table} WHERE ${cmp} = ?`,user);
            if(query.length > 0){
                let { password : getPassword } = query[0];
                if(getPassword === md5(password_actual) || getPassword === password_actual){
                    let status = await global_c.updatePassword(password_new,table,cmp,user,connection);
                    connection.end();
                    return res.status((status) ? 200 : 400).json({ status: (status) ? 200 : 400, msg : (status) ? `Contraseña ${msgUpdateOk}` : `${msgUpdateErr} contraseña. ${msgTry}`});
                }
                return res.status(400).json({status:400, msg:`Contraseña actual no coincide con la ingresada`});
            }
            return res.status(400).json({status:400, msg:`${msgUpdateErr} contraseña. ${msgTry}`});
        }
        return res.status(400).json({status:400, msg:`Faltan datos por ingresar o las contraseñas no coinciden.`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

try{
    module.exports = {
        getUser,
        update_terminos,
        getChildParents,
        actualizaPassword
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}