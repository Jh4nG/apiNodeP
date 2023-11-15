const md5 = require('md5');
const { getConnection } = require("./../database/database");
const global_c = require("./../assets/global.controller");
const { fecha_actual, fecha_actual_all, correo_corporativo, updatePassword } = global_c;

const table_users = "adm_usuarios";
const table_client = "adm_clientes";
const msgCorrecto = "Código validado.";
const msgIncorrecto = "Código incorrecto.";

const startSession = async (req,res)=>{
    try{
        const { user, password : getPassword } = req.body;
        if(user === undefined || getPassword === undefined){
            return res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
        }
        // Si existe el usuario en table_users entonces es admin o operador
        const connection = await getConnection();
        var result = await connection.query(`SELECT * FROM ${table_users} WHERE username = ?`,user);
        if(result.length > 0){
            var { tipousuario, password } = result[0];
        }else{
            // Se realiza consulta para saber si el cliente existe
            result = await connection.query(`SELECT * FROM ${table_client} WHERE cedula_nit = ?`,user);
            if(result.length > 0){
                var tipousuario = result.length > 0 ? "S" : "";
                var { password, estado, fecha_vence, fecha_acepta, nombre, direccion_of, telefono_of } = result[0];
            }
        }
        
        if(result.length == 0){ // Si result no tiene resultados, el usuario no existe
            connection.end();
            return res.status(400).json({status: 400, msg : 'El USUARIO no esta creado en la base de datos de Provired Colombia !!!'});
        }
        if(tipousuario == 'S' && estado == 'C'){ // Estado de cambio de contraseña
            connection.end();
            return res.status(400).json({status: 400, msg : 'Por favor realice el cambio de contraseña.'});
        }
        // Si pasa, se valida contraseña a partir de la data
        if(password === getPassword || password === md5(getPassword)){
            switch(tipousuario){
                case 'S': // Suscriptor
                    const d = new Date();
                    if(estado == 'A'){
                        if(fecha_vence != '0000-00-00' && fecha_actual > fecha_vence){
                            // Se actualiza el cliente a suspendido
                            result = await connection.query(`UPDATE ${table_client} SET estado = 'S', fecha_modi = ? WHERE cedula_nit = ?`,[fecha_actual_all,user]);
                            // await update_token(1,user,tipousuario); // Actualiza para tener un token
                            // Se envía correo por terminación de contrato
                            const { valor : correo_comercial } = await global_c.getParameter(connection, 5);
                            let html = `
                                <h3>Suscriptor: ${nombre}</h3>
                                <p style="color: #000 !important;"><b>Direccion Oficina:</b> ${direccion_of}</p>
                                <p style="color: #000 !important;"><b>Teléfono:</b> ${telefono_of}</p>
                                <p style="color: #000 !important;"><b>Fecha vencimiento:</b> ${fecha_vence}</p>
                            `;
                            const { valor, parametro } = await global_c.getParameter(connection, 1);
                            await global_c.sendEmail(correo_corporativo, correo_comercial, parametro, html);
                            connection.end();
                            return res.status(400).json({ status : 400, redirect : false, tipousuario, msg : valor });
                        }
                        var terminos_ok = true;
                        let msg = "";
                        if(fecha_acepta == "0000-00-00 00:00:00" || fecha_acepta == null){
                            terminos_ok = false;
                            const { valor, parametro } = await global_c.getParameter(connection, 8);
                            msg = valor;
                        }
                        // let token = await update_token(2,user,tipousuario); // Actualiza para tener un token
                        if(password === getPassword){
                            await updatePassword(getPassword,table_client,'cedula_nit',user,connection);
                        }
                        connection.end();
                        return res.status(200).json({ status : 200, user, redirect : true, tipousuario, terminos_ok, msg });
                    }
                    // update_token(1,user,tipousuario); // Actualiza para tener un token
                    connection.end();
                    return res.status(400).json({ status : 400, redirect : false, tipousuario, msg : "Usuario suspendido o no autorizado." });
                default: // Admin u operador
                    // let token = await update_token(2,user,tipousuario); // Actualiza para tener un token
                    if(password === getPassword){
                        await updatePassword(getPassword,table_users,'username',user,connection);
                    }
                    connection.end();
                    return res.status(200).json({ status : 200, user, redirect : true, tipousuario });
            }
        }else{
            // update_token(1,user,tipousuario); // Actualiza para tener un token
            connection.end();
            return res.status(400).json({ status : 400, redirect : false, msg : "Usuario o contraseña incorrectos" });
        }
    }catch(error){
        return res.json({ status : 500, tipousuario:"", redirect : false, msg : error.message});
    }
}

const logOut = async (req,res)=>{
    try{
        const { user, tipousuario } = req.params;
        if(user === undefined || tipousuario === undefined){
            return res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
        }
        // update_token(1,user,tipousuario); // Actualiza para tener un token
        return res.status(200).json({ status : 200, msg : "Sesión finalizada" });
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const update_token = async (type = 1,user,tipousuario) =>{
    const connection = await getConnection();
    let token = global_c.generate_token(50);
    let table = (tipousuario == 'S') ? table_client : table_users;
    let campo = (tipousuario == 'S') ? 'cedula_nit' : 'username';
    switch(type){
        case 1: // actualiza token a 0
            await connection.query(`UPDATE ${table} SET token = NULL WHERE ${campo} = ?`,user);
            break;
        default: // actualiza token a string
            await connection.query(`UPDATE ${table} SET token = ? WHERE ${campo} = ?`,[token,user]);
            break;
    }
    return token;
}

const sendRecuperarContrasena = async (req,res) => {
    try{
        const { user } = req.params;
        if(user === undefined){
            return res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
        }
        // Si existe el usuario en table_users entonces es admin o operador
        const connection = await getConnection();
        var result = await connection.query(`SELECT * FROM ${table_users} WHERE username = ?`,user);
        if(result.length > 0){
            var { tipousuario } = result[0];
        }else{
            // Se realiza consulta para saber si el cliente existe
            result = await connection.query(`SELECT * FROM ${table_client} WHERE cedula_nit = ?`,user);
            if(result.length > 0){
                var tipousuario = result.length > 0 ? "S" : "";
                var { nombre, email, estado } = result[0];
            }
        }

        if(result.length == 0){ // Si result no tiene resultados, el usuario no existe
            connection.end();
            return res.status(200).json({ status : 200, msg : "Correo enviado correctamente. Por favor valide su bandeja de entrada." });
        }

        if(tipousuario == 'S'){ // Se envía mensaje
            if(estado == 'A' || estado == 'C'){
                let token = global_c.generate_token(6);
                global_c.updatePassword(token,table_client,'cedula_nit',user,connection); // actualiza el campo contraseña
                result = await connection.query(`UPDATE ${table_client} SET estado = 'C' WHERE cedula_nit = ?`,user);
                if(result.affectedRows > 0){ // Se actualiza estado
                    let html = `
                        <h3>Hola ${nombre}</h3>
                        <p style="color: #000 !important;">Este es su código para el cambio de contraseña</p>
                        <p style="color: #000 !important;"><b>${token}</b></p>
                    `;
                    await global_c.sendEmail(correo_corporativo, email, 'Cambio contraseña - Provired', html);
                    connection.end();
                    return res.status(200).json({ status : 200, msg : "Correo enviado correctamente. Por favor valide su bandeja de entrada." });
                }else{
                    connection.end();
                    return res.status(400).json({ status : 400, msg : "Error, por favor vuelva a realiza el proceso." });
                }
            }else{
                connection.end();
                return res.status(400).json({ status : 400, msg : "Usuario suspendido o no autorizado." });
            }
        }else{
            connection.end();
            return res.status(400).json({ status : 400, msg : "Contacte con el administrador para realizar el cambio de contraseña." });
        }
        
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const validateCodigo = async (req,res) => {
    try{
        const { user, token } = req.params;
        if(user === undefined || token === undefined){
            return res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
        }
        const connection = await getConnection();
        let valida = await validaCodigovsPassword(user,token,connection);
        if(valida){
            connection.end();
            return res.status(200).json({ status : 200, msg : msgCorrecto });
        }
        connection.end();
        return res.status(400).json({ status : 400, msg : msgIncorrecto });
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const validaCodigovsPassword = async (user,token,connection) => {
    try{
        let result = await connection.query(`SELECT * FROM ${table_client} WHERE cedula_nit = ?`,user);
        if(result.length > 0){
            var { password, estado } = result[0];
            if(estado == 'C'){
                if(password == md5(token)){
                    return true;
                }
            }
        }
        return false;
    }catch(error){
        return false;
    }
}

const actializaPassword = async (req,res) => {
    try{
        const { user, newPassword, newPasswordConfirm, token, captcha } = req.body;
        if(user === undefined || newPassword === undefined || newPasswordConfirm == undefined || token == undefined){
            return res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
        }
        if(newPassword == newPasswordConfirm){
            let {statusCaptcha, msg_captcha} = await global_c.verifyCaptcha(req.connection.remoteAddress, captcha);
            if(statusCaptcha){ // valida captcha
                const connection = await getConnection();
                let valida = await validaCodigovsPassword(user,token,connection);
                if(valida){
                    global_c.updatePassword(newPassword,table_client,'cedula_nit',user,connection); // actualiza el campo contraseña
                    let result = await connection.query(`UPDATE ${table_client} SET estado = 'A' WHERE cedula_nit = ?`,user);
                    if(result.affectedRows > 0){
                        connection.end();
                        return res.status(200).json({ status : 200, msg : 'Proceso realizado correctamente' });
                    }
                    connection.end();
                    return res.status(400).json({ status : 400, msg : 'Error en cambio de contraseña, vuelva a realizar el proceso.' });
                }else{
                    connection.end();
                    return res.status(400).json({ status : 400, msg : msgIncorrecto });
                }
            }else{
                return res.status(400).json({status : 400, msg : msg_captcha});
            }    
        }
        return res.status(400).json({ status : 400, msg : 'Contraseñas no coinciden' });
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

try{
    module.exports = {
        startSession,
        logOut,
        sendRecuperarContrasena,
        validateCodigo,
        actializaPassword
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}