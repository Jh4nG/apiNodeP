const xl = require('excel4node');
const util = require('util');
const config =  require("./../config");
const nodemailer = require("nodemailer");
const fs = require('file-system');
const { getConnection } = require("./../database/database");
const { type } = require('os');

const correo_corporativo = 'webmaster@proviredcolombia.com';
const d = new Date();
const fecha_actual = `${d.getFullYear()}-${(d.getMonth()+1 < 10)? `0${d.getMonth()+1}` : d.getMonth()+1}-${(d.getDate() < 10)? `0${d.getDate()}`:d.getDate()}`;
const fecha_actual_all = `${fecha_actual} ${(d.getHours() < 10)? `0${d.getHours()}`:d.getHours()}:${(d.getMinutes() < 10)? `0${d.getMinutes()}`:d.getMinutes()}:${(d.getSeconds() < 10)? `0${d.getSeconds()}`:d.getSeconds()}`;

const msgInsertOk = 'agregado/a correctamente';
const msgInsertErr = 'Error en inserción de';
const msgUpdateOk = 'actualizado/a correctamente';
const msgUpdateErr = 'Error en acutalización de';
const msgDeleteOk = 'eliminado/a correctamente';
const msgDeleteErr = 'Error en eliminación de';
const msgTry = 'Vuelva a intentarlo, si el error persiste contacte con el administrado.';
const msgDataIncorrecta = 'Data incorrecta o incompleta.';
const msgSinInfo = 'No hay resultados, por favor genere una nueva consulta cambiando los filtros.';

/**
 * Verifica que los parámetros dentro del array no sean inválidos
 * @param {*} params 
 * @returns 
 */
const validateParams = (params = {}) =>{
    try{
        let valida = [];
        Object.keys(params).forEach(element => {
            if(params[element] == undefined || params[element] == ''){
                return valida.push(`El parámetro "${element}" es requerido`);
            }
        });
        if(valida.length > 0){
            return {status : false, msg : valida.join('. ')};
        }
        return {status : true};
    }catch(error){
        return {status : false, msg: error.message};
    }
}

/**
 * Genera un token único
 * @param {int} length 
 * @returns 
 */
const generate_token = (length) => {
    //edit the token allowed characters
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = [];  
    for (var i=0; i<length; i++) {
        var j = (Math.random() * (a.length-1)).toFixed(0);
        b[i] = a[j];
    }
    return b.join("");
}

/**
 * Verifica el token contra la BD para acceder a la data
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 * @returns 
 */
const verifyToken = async (req,res,next) => {
    try{
        const connection = await getConnection();
        let { user,tipousuario,token } = req.params;
        token = (token == null || token == undefined) ? req.body.token : token;
        user = (user == null || user == undefined) ? req.body.user : user;
        tipousuario = (tipousuario == null || tipousuario == undefined) ? req.body.tipousuario : tipousuario;

        if((token == null || token == undefined) || (user == null || user == undefined) || ((tipousuario == null || tipousuario == undefined)) ){
            connection.end();
            return {status : 400, msg : 'No autorizado'};
        }else{
            let table = (tipousuario == 'S') ? 'adm_clientes' : 'adm_usuarios';
            let campo = (tipousuario == 'S') ? 'cedula_nit' : 'username';    
            const result = await connection.query(`SELECT token FROM ${table} WHERE ${campo} = ?`,user);
            if(result.length > 0){
                if(token === result[0].token){
                    connection.end();
                    next();
                }
                connection.end();
                return res.status(400).json({status : 400, msg : 'No autorizado'});
            }else{
                connection.end();
                return res.status(400).json({status : 400, msg : 'No autorizado'});
            }
        }
    }catch(error){
        return res.status(500).json({status : 500, msg : error.message});
    }
}

/**
 * Obtiene los parámetros definidos por el id
 * @param {int} id 
 * @returns 
 */
const getParameter = async (connection, id = 0) =>{1
    try{
        // const connection = await getConnection();
        const result = await connection.query(`SELECT * FROM adm_parametros WHERE id_parametro = ?`, id);
        if(result.length > 0){
            return result[0];
        }
        return false;
    }catch(error){
        return false;
    }
}

/**
 * Envia un email con una plantilla definida
 * @param {string} from 
 * @param {string} to 
 * @param {string} subject 
 * @param {string} html 
 * @returns 
 */
const sendEmail = async (from = 'webmaster@proviredcolombia.com',
                        to = '',
                        subject = 'Correo Provired',
                        html = '',
                        cc = '') => {
    try{
        // let testAccount = await nodemailer.createTestAccount();
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: config.host_mail,
            port: 465,
            secure: config.SMTPAuth_mail, // true for 465, false for other ports
            auth: {
                user: config.username_mail, // generated ethereal user
                pass: config.password_mail, // generated ethereal password
            },
        });
        let htmlBody = fs.readFileSync("./src/assets/plantillaCorreo.html", 'utf8');
        htmlBody = htmlBody.replace('#TitleCorreo',subject);
        htmlBody = htmlBody.replace('#bodyCorreo',html);
        let parameters = {
            from: from, // sender address
            to: to, // list of receivers
            cc : cc, // Con copia
            subject: subject, // Subject line
            html: htmlBody, // html body
        };
        
        // send mail with defined transport object
        let info = await transporter.sendMail(parameters);
    
        if(info.messageId.length > 0){
            return true;
        }else{
            return false;
        }
    }catch(error){
        return error.message;
    }
}

/**
 * Convierte las en string válidos
 * @param {date} date 
 * @returns 
 */
const getFechaConvert = (date = new Date()) => {
    const fecha = `${date.getFullYear()}-${(date.getMonth()+1 < 10)? `0${(date.getMonth()+1)}` : date.getMonth()+1}-${(date.getDate() < 10)? `0${date.getDate()}`:date.getDate()}`;
    const fecha_full = `${fecha} ${(date.getHours() < 10)? `0${date.getHours()}`:date.getHours()}:${(date.getMinutes() < 10)? `0${date.getMinutes()}`:date.getMinutes()}:${(date.getSeconds() < 10)? `0${date.getSeconds()}`:date.getSeconds()}`;
    return {fecha, fecha_full};
}

/**
 * Obtiene los id hijos dependiendo de un padre
 * @param {string} id 
 * @returns 
 */
const getParentUser = async (connection, id = '')=>{
    try{
        if(id == '' || id == null){
            return {status:400,msg:'El usuario es obligatorio'};
        }
        const result = await connection.query("SELECT GROUP_CONCAT(cedula_nit) as cc,cedula_nit FROM adm_clientes WHERE telefono_re = ?",id);
        if(result.length > 0){
            // connection.end();
            return {status:200,data:result[0]};
        }
        // connection.end();
        return {status:400,data:[]};
    }catch(error){
        return {status : 500, msg : error.message};
    }
}

const getParentUserEmail = async (connection, id = '') => {
    if(id == '' || id == null){
        return {status:400,msg:'El usuario es obligatorio'};
    }
    const result = await connection.query("SELECT GROUP_CONCAT(email) as emails FROM adm_clientes WHERE telefono_re = ?",id);
    if(result.length > 0){
        return {status:200,data:result[0]};
    }
    return {status:400,data:[]};
}

/**
 * Verifica que exista un archivo 
 * @param {string} user 
 * @param {string} radicado 
 * @param {int} idplanilla 
 * @param {string} nameFile 
 * @returns 
 */
const verifyAuto = async (connection, parent = "",radicado = "",idplanilla = 0, nameFile = '') =>{
    try{
        // const connection = await getConnection();
        // const result = await connection.query(`SELECT ruta FROM adm_autos WHERE username = ? AND radicacion = ? AND idplanilla = ?`,[parent,radicado,idplanilla]);
        // if(result.length > 0){
        //     return {status : true, ruta : result[0].ruta};
        // }
        const url_rad = `/${parent}/${radicado}/${nameFile}.pdf`;
        const url_idplanilla = `/${parent}/${radicado}/${idplanilla}/${nameFile}.pdf`;
        if(fs.existsSync(`${config.autos+url_rad}`)){
            setAuto(connection, 'insert', parent,radicado,idplanilla,url_rad); // se guarda el auto
            return {status : true, ruta : url_rad};
        }
        if(fs.existsSync(`${config.autos+url_idplanilla}`)){
            setAuto(connection, 'insert', parent,radicado,idplanilla,url_idplanilla); // se guarda el auto
            return {status : true, ruta : url_idplanilla};
        }
        return {status : false, ruta : ""};
    }catch(error){
        return {status : 500, msg : error.message};
    }
}

/**
 * Setea un auto
 * @param {string} user 
 * @param {string} radicado 
 * @param {int} idplanilla 
 * @param {string} ruta 
 * @returns 
 */
const setAuto = async (connection, type = 'insert', user = "",radicado = "",idplanilla = 0, ruta = "") =>{
    try{
        let sql = "";
        let data = [];
        switch(type){
            case 'insert':
                sql = "INSERT INTO adm_autos(username, radicacion, idplanilla, ruta) VALUES(?,?,?,?)";
                data = [user,radicado,idplanilla,ruta];
                break;
        }
        const result = await connection.query(sql,data);
        if(result.affectedRows == 1){
            return true;
        }
        return false;
    }catch(error){
        return {status : 500, msg : error.message};
    }
}

/**
 * Verifica si tiene expediente_digital de adm_clientes_misproceso
 * @param {*} connection 
 * @param {*} despacho 
 * @param {*} radicacion 
 * @returns 
 */
const getExpediente = async (connection, despacho = '', radicacion = '') =>{
    try{
        // const connection = await getConnection();
        const queryExpediente = await connection.query(`SELECT expediente_digital FROM adm_clientes_misprocesos WHERE despacho = ? AND radicacion = ? LIMIT 1`,[despacho,radicacion]);
        if(queryExpediente.length > 0){
            if(queryExpediente[0].expediente_digital != null){
                return {statusExpediente : true, url : queryExpediente[0].expediente_digital};
            }
        }
        return {statusExpediente : false, url : ''};
    }catch(error){
        return {status : false, msg : error.message, url : ''};
    }
}

/**
 * Obtiene la etiqueta de un registro
 * @param {*} connection 
 * @param {*} despacho 
 * @param {*} user 
 * @returns 
 */
const getEtiqueta = async (connection, radicacion = '', despacho = '', user = '') => {
    try{
        const queryEtiqueta = await connection.query(`SELECT etiqueta_suscriptor FROM adm_clientes_misprocesos WHERE radicacion = ? AND username IN (?) AND despacho = ? AND etiqueta_suscriptor <> ''`,[radicacion,user,despacho]);
        if(queryEtiqueta.length > 0){
            return {statusEtiqueta : true, etiqueta : queryEtiqueta[0].etiqueta_suscriptor};
        }
        return {statusEtiqueta : false, etiqueta : ''};
    }catch(error){
        return {statusEtiqueta : 500, etiqueta : error.message};
    }
}

/**
 * Obtiene la estructura de los genéricos, desde el departamento hasta el despacho (sólo códigos y nombres)
 * @param {} despacho 
 */
const getGenericosAll = async (connection, despacho = '') =>{
    try{
        // const connection = await getConnection();
        const queryGenericos = await connection.query(`SELECT ad.IdDes,ad.despacho,ac.IdCorp,ac.corporacion,am.IdMun,am.municipio,adp.IdDep,adp.departamento 
                                    FROM adm_despacho ad 
                                    INNER JOIN adm_corporacion ac ON ad.corporacion_IdCorp = ac.IdCorp
                                    INNER JOIN adm_municipio am ON ac.municipio_IdMun = am.IdMun
                                    INNER JOIN adm_depto adp ON am.depto_IdDep = adp.IdDep
                                    WHERE ad.IdDes = ?`,despacho);
        if(queryGenericos.length > 0){
            // connection.end();
            return {status : true, data : queryGenericos[0]};
        }
        return {status : false, data : []};
    }catch(error){
        return {status : false, data : []};
    }
}

/**
 * Generador de Excel
 * @param {*} name_user 
 * @param {*} name_file 
 * @param {*} heads 
 * @param {*} rows 
 * @returns 
 */
const generateExcel = async (username, name_user, title_report, name_file, heads, rows) => {
    try{
        // Libro
        let wb = new xl.Workbook();
        wb.writeP = util.promisify(wb.write);
        // Hoja
        let ws = wb.addWorksheet('Reporte');

        // Se añade imagen de provired
        ws.addImage({
            path: `${__dirname}/images/provired.png`,
            type: 'picture',
            position: {
                type: 'twoCellAnchor',
                from: {
                    col: 1,
                    colOff: 0,
                    row: 1,
                    rowOff: 0,
                },
                to: {
                    col: 2,
                    colOff: 0,
                    row: 3,
                    rowOff: 0,
                },
            }
        });

        // Estilos Cabecera 
        let styleHeader = wb.createStyle({
            alignment: {
                horizontal: 'left',
                vertical : 'center'
            },
            font: {
                bold: true,
                color : '#ffffff',
                size : 16,
            },
            fill : {
                type: 'pattern', // the only one implemented so far.
                patternType: 'solid', // most common.
                fgColor:'#6D84A3'
            },
            border: {
                bottom: {
                    style: "thin",
                    color: "#ffffff"
                },
            }
        });

        ws.cell(1, 2, 1, heads.length, true).string(title_report).style(styleHeader);
        ws.row(1).setHeight(60);

        ws.cell(2, 2, 2, heads.length, true).string(`${name_user}`).style(styleHeader);
        ws.row(2).setHeight(30);

        // Estilos
        let style = wb.createStyle({
            font: {
                color : '#000000',
                size : 12
            },
            alignment: {
                wrapText : true // ajustar al ancho de la columna
            }
        });

        let styleHeads = wb.createStyle({
            font: {
                bold: true,
                color : '#ffffff',
                size : 13,
            },
            fill : {
                type: 'pattern', // the only one implemented so far.
                patternType: 'solid', // most common.
                fgColor:'#6D84A3'
            }
        });

        let row = 4;
        // Cabeceras
        for(let i = 0; i<heads.length; i++){
            ws.cell(row, i+1).string(heads[i].name).style(styleHeads);
            ws.column(i+1).setWidth(heads[i].width);
        }
        row++;

        for(let r = 0; r<rows.length; r++){
            for(let i = 0; i<heads.length; i++){
                let objeto = rows[r];
                let valor = objeto[heads[i].campo];
                let type = typeof(valor);
                if(heads[i].type != undefined){
                    type = heads[i].type;
                }
                switch(type){
                    case 'number':
                        ws.cell(row, i+1).number(valor).style(style);
                        break;
                    case 'object':
                        if(valor === null){
                            ws.cell(row, i+1).string('N/A').style(style);
                        }else{
                            ws.cell(row, i+1).string(valor).style(style);
                        }
                        break;
                    case 'Date':
                        
                        break;
                    default:
                        ws.cell(row, i+1).string(`${valor}`).style(style);
                        break;
                }
                // ws.row(row).setHeight(20);
            }
            row++;
        }
        let nameFile = `${config.excel}/${name_file}_${username}.xlsx`;
        let nameFileExport = `/excelTmp/${name_file}_${username}.xlsx`;
        
        let result = await wb.writeP(nameFile);
        if(result){
            return {status : 200, url : nameFileExport, msg : 'Archivo generado correctamente'}
        }
        return {status : 400, url : '', msg : result.err};
    }catch(error){
        return {status : 500, url:'', msg : error.message};
    }
}

/**
 * Elimina un elemento dentro de la carperta excelTmp
 * @param {*} nameFile 
 * @returns 
 */
const deleteExcel = async (nameFile = '') => {
    try{
        fs.unlinkSync(`${config.excel}/${nameFile}`);
        return {status : 200, msg : `Archivo ${msgDeleteOk}`};
    }catch(error){
        return {status : 500, msg : error.message};
    }
}


module.exports = {
    sendEmail,
    generate_token,
    verifyToken,
    getParameter,
    validateParams,
    getFechaConvert,
    getParentUser,
    getParentUserEmail,
    verifyAuto,
    getExpediente,
    getGenericosAll,
    getEtiqueta,
    generateExcel,
    deleteExcel,
    correo_corporativo,
    fecha_actual,
    fecha_actual_all,
    msgInsertOk,
    msgInsertErr,
    msgUpdateOk,
    msgUpdateErr,
    msgDeleteOk,
    msgDeleteErr,
    msgTry,
    msgDataIncorrecta,
    msgSinInfo
}