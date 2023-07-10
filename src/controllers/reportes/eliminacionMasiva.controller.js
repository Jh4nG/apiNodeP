const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { correo_corporativo, fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo } = global_c;

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
        const { data, name_user, username, captcha } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        
        let {statusCaptcha, msg_captcha} = await global_c.verifyCaptcha(req.connection.remoteAddress, captcha);
        if(statusCaptcha){
            if(data.length > 0){
                const connection = await getConnection();
                let body = ``;
                let statusSuccess = 0;
                let statusError = 0;
                for(let i=0;i<data.length;i++){
                    let dataEmail = await global_c.getDataEmailDeleteActivos(connection, [group_users,data[i].id]);
                    let { status, msg } = await global_c.deleteActivos(connection,data[i].id);
                    if(status == 200){
                        statusSuccess++;
                        if(dataEmail.status){
                            body += `<tr>
                                        <td>${dataEmail.municipio}</td>
                                        <td>${dataEmail.despacho}</td>
                                        <td>${dataEmail.radicado}</td>
                                        <td>${dataEmail.demandante}</td>
                                        <td>${dataEmail.demandado}</td>
                                    </tr>`;
                        }
                    }else{
                        statusError++;
                    }
                }
                const { status : statusParentUserEmail, data : dataParentUserEmail } = await global_c.getParentUserEmail(connection, username);
                if(statusParentUserEmail == 200){ // Se traen datos para el envío de correo
                    const { valor:correo_comercial } = await global_c.getParameter(connection,5);
                    const { valor:web_master } = await global_c.getParameter(connection,14);
                    let html = cuerpoCorreo(name_user, 'Eliminados', body, statusSuccess, statusError);
                    let icono = "b_drop.png";
                    await global_c.sendEmail(correo_corporativo, dataParentUserEmail.emails, "Eliminación de Vigilancia Judicial", html, `${correo_comercial},${web_master}`, icono);
                }
                return res.status(200).json({status : 200, msg : `Procesos ${msgDeleteOk}. Verifique su correo electrónico para mayor información.`});
            }else{
                return res.status(400).json({status : 400, msg : "No se ha seleccionado ningún registro"});
            }
        }else{
            return res.status(400).json({status : 400, msg : msg_captcha});
        }
    }catch(error){
        return res.status(500).json({ status : 500, msg : error.message });
    }
}

const cuerpoCorreo = (nameSuscriptor = '', type = '', bodyTableInfo = '', success = 0, error = 0)=>{
    let addInfo = ``;
    if(type == 'Eliminados'){
        addInfo = `<p style="color: #000 !important;"><b>Mensaje:</b> El retiro de sus procesos de vigilancia judicial fueron Exitosos !!!.  Recuerde que si eliminó estos procesos por error, deberá incluirlos nuevamente.</p>`;
    }
    let html = `
        <div style="word-wrap:break-word; font-family: Verdana, Arial, Helvetica, sans-serif; font-size: 16px; color:#000 !important">
            <p style="color: #000 !important;"><b>Suscriptor:</b> ${nameSuscriptor} </p>
            <p style="color: #000 !important;"><b>Cant. ${type} correctamente:</b> ${success} </p>
            <p style="color: #000 !important;"><b>Cant. no ${type} correctamente:</b> ${error} </p>
            ${addInfo}
        </div>
        <br>
        <div align="center">
            <h2>Registros ${type}</h2>
            <table border=1 width="100%" cellspacing=2 cellpading=2 align=left>
                <tr align=center valign=top style=font-weight:normal;color:white;background-color:#6D84A3;>
                    <td align=left width=80>Ciudad</td>
                    <td align=left width=200>Despacho</td>
                    <td align=left width=80>Radicacion</td>
                    <td align=left width=275>Demandante</td>
                    <td align=left width=275>Demandado</td>
                </tr>
                <tbody id="registrosDeleteMasivo">
                    ${bodyTableInfo}
                </tbody>
            </table>
        </div>
    `;
    return html;
}

const transferirData = async (req, res) => {
    try{
        const { data, user_transfer, name_user, username, captcha } = req.body;
        let { group_users,parent } = req.body;
        group_users = atob(group_users).split(',');
        parent = atob(parent);
        
        let {statusCaptcha, msg_captcha} = await global_c.verifyCaptcha(req.connection.remoteAddress, captcha);
        if(statusCaptcha){
            if(data.length > 0){
                const connection = await getConnection();
                for(let i=0;i<data.length;i++){
                    let dataEmail = await global_c.getDataEmailDeleteActivos(connection, [group_users,data[i].id]);

                }
            }else{
                return res.status(400).json({status : 400, msg : "No se ha seleccionado ningún registro"});
            }
        }else{
            return res.status(400).json({status : 400, msg : msg_captcha});
        }
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