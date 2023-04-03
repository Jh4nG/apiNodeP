import { getConnection } from "./../database/database";

const table_users = "adm_usuarios";
const table_client = "adm_clientes";

const startSession = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { user, password : getPassword } = req.body;
        if(user === undefined || getPassword === undefined){
            res.status(400).json({status: 400, msg : 'Faltan campos que son obligatorios'});
            return;
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
                var { password, estado, fecha_vence, fecha_acepta } = result[0];
            }
        }
        
        if(result.length == 0){ // Si result no tiene resultados, el usuario no existe
            res.status(400).json({status: 400, msg : 'El USUARIO no esta creado en la base de datos de Provired Colombia !!!'});
            return;
        }
        // Si pasa, se valida contraseña a partir de la data
        if(password === getPassword){
            switch(tipousuario){
                case 'S': // Suscriptor
                    const d = new Date();
                    const actual= `${d.getFullYear()}-${(d.getMonth()+1 < 10)? `0${d.getMonth()+1}` : d.getMonth()}-${d.getDate()}`;
                    if(estado == 'A'){
                        if(fecha_vence != '0000-00-00' && actual > fecha_vence){ // Si pasa, se envía correo por terminación de contrato
                            
                        }
                        var terminos_ok = true;
                        if(fecha_acepta == "0000-00-00 00:00:00"){
                            terminos_ok = false;
                        }
                        res.status(200).json({ status : 200, redirect : true, tipousuario, terminos_ok });
                        return;
                    }
                    res.status(400).json({ status : 400, redirect : false, tipousuario, msg : "Usuario suspendido o no autorizado." });
                    return;
                default: // Admin u operador
                    res.status(200).json({ status : 200, redirect : true, tipousuario });
                    return;
            }
        }else{
            res.json(res.status(400).json({ status : 400, redirect : false, msg : "Usuario o contraseña incorrectos" }));
        }
    }catch(error){
        res.json({ status : 500, tipousuario:"", redirect : false, msg : error.message});
    }
}

export const methods = {
    startSession
}