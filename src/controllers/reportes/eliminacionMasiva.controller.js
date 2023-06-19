const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

const table = "EliminacionMasiva";
const query_base = `SELECT SQL_CALC_FOUND_ROWS * FROM ${table}`;

const getData = async (req,res) => {
    try{
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        let {status, count_rows, data, msg} = await getDataResp(group_users);
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const getDataResp = async (group_users) =>{
    try{
        let params = [group_users];
        const result = await connection.query(query_base,params);
        const queryCount = await connection.query(`SELECT FOUND_ROWS() as cantidad`);
        let count_rows = queryCount[0].cantidad;
        let data = [];
        if(result.length > 0 ){
            connection.end();
            return {status:200, count_rows, data : result, msg : 'Generado correctamente'};
        }
        connection.end();
        return {status:400, count_rows, data, msg : msgSinInfo};
    }catch(error){
        return { status : 500, count_rows : 0, data : [], msg : error.message}
    }
}

const insertData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`INSERT INTO ${table} VALUES()`, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `EliminacionMasiva ${msgInsertOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgInsertErr} EliminacionMasiva. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const updateData = async (req,res) => {
    try{
        const connection = await getConnection();
        const { id } = req.body;
        const result = await connection.query(`UPDATE ${table} SET , WHERE id = ? `, [id]);
        if(result.affectedRows > 0){
            connection.end();
            return res.status(200).json({status:200, msg : `EliminacionMasiva ${msgUpdateOk}`});
        }
        connection.end();
        return res.status(400).json({status:400, msg : `${msgUpdateErr} EliminacionMasiva. ${msgTry}`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const deleteData = async (req,res)=>{
    try{
        const { id, name_user, username, captcha } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secret_key_captcha + "&response=" + captcha + "&remoteip=" + req.connection.remoteAddress;
        request(verificationUrl,async function(error,response,body) {
            body = JSON.parse(body);
            // Success will be true or false depending upon captcha validation.
            if(body.success !== undefined && !body.success) {
              return res.status(400).json({status : 400, "msg" : "Error captcha, verifique nuevamente"});
            }
            const connection = await getConnection();
            const insert = await connection.query(`INSERT INTO adm_listado_activos_eliminados (depto,ciudad,despacho,suscriptor,radicado,rad23,fecha_registro,proceso,demandante,demandado)
                                                    SELECT left(despacho,2),left(despacho,5),despacho,usuario,radicacion,codigo_23,fecha_registro,proceso,demandante,demandado FROM ${table} WHERE id_userope = ?`,[id]);
            
            if(insert.affectedRows > 0){
                const dataEmail = await getDataEmail(connection, [group_users,group_users,id], username);
                const result = await connection.query(`DELETE FROM ${table} WHERE id_userope = ?`,[id]);
                if(result.affectedRows > 0){
                    const { valor:correo_comercial } = await global_c.getParameter(connection,5);
                    const { valor:web_master } = await global_c.getParameter(connection,14);
                    if(dataEmail.status){
                        let html = `
                                <p style="color: #000 !important;"><b>Suscriptor:</b> ${name_user} </p>
                                <p style="color: #000 !important;"><b>Despacho:</b> ${dataEmail.despacho} </p>
                                <p style="color: #000 !important;"><b>Ciudad:</b> ${dataEmail.municipio} </p>
                                <p style="color: #000 !important;"><b>Departamento:</b> ${dataEmail.departamento} </p>
                                <p style="color: #000 !important;"><b>Radicado (9 digitos):</b> ${dataEmail.radicado} </p>
                                <p style="color: #000 !important;"><b>Radicado (23 digitos):</b> ${dataEmail.codigo_23} </p>
                                <p style="color: #000 !important;"><b>Tipo de Proceso:</b> ${dataEmail.proceso} </p>
                                <p style="color: #000 !important;"><b>Demandante:</b> ${dataEmail.demandante} </p>
                                <p style="color: #000 !important;"><b>Demandado:</b> ${dataEmail.demandado} </p>
                            `;
                        await global_c.sendEmail(correo_corporativo, dataEmail.emails, "Eliminación de Vigilancia Judicial", html, `${correo_comercial},${web_master}`);
                    }
                    connection.end();
                    return res.status(200).json({status : 200, msg : `Procesos ${msgDeleteOk}`});
                }
                connection.end();
                return res.status(400).json({status : 400, msg : `${msgDeleteErr} Procesos. ${msgTry}`});
            }
            connection.end();
            return res.status(400).json({status : 400, msg : `${msgDeleteErr} Procesos. ${msgTry}`, msgExtra : 'Error en inserción activos eliminados.'});
          });
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const getDataId = async (req,res)=>{
    try{
        const connection = await getConnection();
        const { id } = req.params;
        const result = await connection.query(`SELECT * FROM ${table} WHERE id = ?`, [id]);
        let data = []
        if(result.length > 0 ){
            data = result[0];
        }
        connection.end();
        return res.status(200).json({status:200, data : data});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const exportExcel = async (req,res) =>{
    try{
        const { username, name_user, name_file } = req.body;
        let { status, data } = await getData();
        if(status == 200){
            if(data.length > 0){
                const title_report = "EliminacionMasiva";
                const heads = [
                    {name: "Prueba", campo : 'name_prueba', width : 15}, // Este tamaño debe ser fijo para poder respetar la imagen
                    {name: "fechas", campo : 'fechas', width : 30, type : 'Date'},
                ];
                let {status, url, msg} = await global_c.generateExcel(username, name_user, title_report, name_file, heads, data);
                if(status == 200){
                    return res.status(status).json({status, url, msg});
                }
                return res.status(status).json({status, msg});
            }
            return res.status(status).json({status, msg});
        }
        return res.status(status).json({status, count_rows, data, msg});
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message, url : '' });
    }
}

try{
    module.exports = {
        getData,
        insertData,
        updateData,
        deleteData,
        getDataId,
        exportExcel
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}