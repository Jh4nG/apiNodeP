const { getConnection } = require("./../../database/database");
const global_c = require("./../../assets/global.controller");
const { correo_corporativo, fecha_actual, fecha_actual_all, msgInsertOk, msgInsertErr, msgUpdateOk, msgUpdateErr, msgDeleteOk, msgDeleteErr, msgTry, msgSinInfo, rutaTmpExcel } = global_c;

const reportIncidencia = async (req, res) => {
    try{
        const { username, asunto, descripcion } = req.body;
        if(req.files){
            var { image } = req.files;
        }
        if(username && asunto && descripcion){
            const connection = await getConnection();
            const suscriptor = await connection.query(`SELECT nombre FROM adm_clientes WHERE username = ?`,username);
            if(suscriptor.length > 0){
                if(image !== undefined){ // Se guarda imagen para adjuntarla al correo
                    image.mv(`${rutaTmpExcel}/${image.name}`, async err => {
                        if(err) return res.json({status:400, msg : `Error al adjuntar imagen. Por favor vuelva a interntarlo.`});
                        
                        let { status, msg } = await enviarMsg(connection, suscriptor, descripcion, asunto, image, true);
                        return res.status(status ? 200 : 400).json({status : status ? 200 : 400, msg});
                    });
                    return;
                }
                let { status, msg } = await enviarMsg(connection, suscriptor, descripcion, asunto, false, false); 
                connection.end();
                return res.status(status ? 200 : 400).json({status : status ? 200 : 400, msg});
            }
            connection.end();
            return res.json({status:400, msg : `Suscriptor no disponible.`});
        }
        return res.json({status:400, msg : `Faltan campos por llenar, por favor ingrese toda la información.`});
    }catch(error){
        return res.json({ status : 500, msg : error.message});
    }
}

const enviarMsg = async (connection, suscriptor, descripcion, asunto, image, statusImg = false) => {
    try{
        const { valor:correo_comercial } = await global_c.getParameter(connection,5);
        const { valor:web_master } = await global_c.getParameter(connection,14);
        let html = `
                    <p style="color: #000 !important;"><b>Suscriptor:</b> ${suscriptor[0].nombre} </p>
                    <p style="color: #000 !important;"><b>Asunto:</b> ${asunto} </p>
                    <p style="color: #000 !important;"><b>Descripción:</b> ${descripcion} </p>
                `;
        await global_c.sendEmail(correo_corporativo, web_master, 'Reporte incidencia plataforma', html, `${correo_comercial}`,'drop', (statusImg) ? `${rutaTmpExcel}/${image.name}` : false, (statusImg) ? image.name : '');
        if(statusImg){
            await global_c.deleteExcel(image.name);
        }
        return {status : true, msg : `Incidencia reportada correctamente.`};
    }catch(error){
        return {status : false, msg : error.message};
    }
}

try{
    module.exports = {
        reportIncidencia
    }
}catch(error){
    console.log(error.message);
    module.exports = error.message;
}