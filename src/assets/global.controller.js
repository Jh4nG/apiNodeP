const config =  require("./../config");
const nodemailer = require("nodemailer");
const fs = require('file-system');
const { getConnection } = require("./../database/database");

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

const getParameter = async (id = 0) =>{
    try{
        const connection = await getConnection();
        const result = await connection.query(`SELECT * FROM adm_parametros WHERE id_parametro = ?`, id);
        if(result.length > 0){
            connection.end();
            return result[0];
        }
        connection.end();
        return false;
    }catch(error){
        return false;
    }
}

const sendEmail = async (from = 'webmaster@proviredcolombia.com',
                        to = '',
                        subject = 'Correo Provired',
                        html = '') => {
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

const getFechaConvert = (date = new Date()) => {
    const fecha = `${date.getFullYear()}-${(date.getMonth()+1 < 10)? `0${(date.getMonth()+1)}` : date.getMonth()+1}-${(date.getDate() < 10)? `0${date.getDate()}`:date.getDate()}`;
    const fecha_full = `${fecha} ${(date.getHours() < 10)? `0${date.getHours()}`:date.getHours()}:${(date.getMinutes() < 10)? `0${date.getMinutes()}`:date.getMinutes()}:${(date.getSeconds() < 10)? `0${date.getSeconds()}`:date.getSeconds()}`;
    return {fecha, fecha_full};
}

const getParentUser = async (id = '')=>{
    try{
        if(id == '' || id == null){
            return {status:400,msg:'El usuario es obligatorio'};
        }
        const connection = await getConnection();
        const result = await connection.query("SELECT GROUP_CONCAT(cedula_nit) as cc FROM adm_clientes WHERE telefono_re = ?",id);
        if(result.length > 0){
            connection.end();
            return {status:200,data:result[0]};
        }
        connection.end();
        return {status:400,data:[]};
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
    msgDataIncorrecta
}