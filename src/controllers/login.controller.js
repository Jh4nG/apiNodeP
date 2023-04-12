const { getConnection } = require("./../database/database");
const global_c = require("./../assets/global.controller");
const { fecha_actual, fecha_actual_all, correo_corporativo } = global_c;

const table_users = "adm_usuarios";
const table_client = "adm_clientes";

const startSession = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { user, password : getPassword } = req.body;
        if(user === undefined || getPassword === undefined){
            return res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
        }
        // Si existe el usuario en table_users entonces es admin o operador
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
            return res.status(400).json({status: 400, msg : 'El USUARIO no esta creado en la base de datos de Provired Colombia !!!'});
        }
        // Si pasa, se valida contraseña a partir de la data
        if(password === getPassword){
            switch(tipousuario){
                case 'S': // Suscriptor
                    const d = new Date();
                    if(estado == 'A'){
                        if(fecha_vence != '0000-00-00' && fecha_actual > fecha_vence){
                            // Se actualiza el cliente a suspendido
                            result = await connection.query(`UPDATE ${table_client} SET estado = 'S', fecha_modi = ? WHERE cedula_nit = ?`,[fecha_actual_all,user]);
                            // await update_token(1,user,tipousuario); // Actualiza para tener un token
                            // Se envía correo por terminación de contrato
                            const { valor : correo_comercial } = await global_c.getParameter(5);
                            let html = `
                                <h3>Suscriptor: ${nombre}</h3>
                                <p style="color: #000 !important;">Direccion Oficina: ${direccion_of}</p>
                                <p style="color: #000 !important;">Teléfono: ${telefono_of}</p>
                                <p style="color: #000 !important;">Fecha vencimiento: ${fecha_vence}</p>
                            `;
                            const { valor, parametro } = await global_c.getParameter(1);
                            await global_c.sendEmail(correo_corporativo, correo_comercial, parametro, html);
                            return res.status(400).json({ status : 400, redirect : false, tipousuario, msg : valor });
                        }
                        var terminos_ok = true;
                        let msg = "";
                        if(fecha_acepta == "0000-00-00 00:00:00" || fecha_acepta == null){
                            terminos_ok = false;
                            const { valor, parametro } = await global_c.getParameter(8);
                            msg = valor;
                        }
                        // let token = await update_token(2,user,tipousuario); // Actualiza para tener un token
                        return res.status(200).json({ status : 200, user, redirect : true, tipousuario, terminos_ok, msg });
                    }
                    // update_token(1,user,tipousuario); // Actualiza para tener un token
                    return res.status(400).json({ status : 400, redirect : false, tipousuario, msg : "Usuario suspendido o no autorizado." });
                default: // Admin u operador
                    // let token = await update_token(2,user,tipousuario); // Actualiza para tener un token
                    return res.status(200).json({ status : 200, user, redirect : true, tipousuario });
            }
        }else{
            // update_token(1,user,tipousuario); // Actualiza para tener un token
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

module.exports = {
    startSession,
    logOut
}