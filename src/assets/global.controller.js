const xl = require('excel4node');
const util = require('util');
const config =  require("./../config");

const msgInsertOk = 'agregado/a correctamente';
const msgInsertErr = 'Error en inserción de';
const msgUpdateOk = 'actualizado/a correctamente';
const msgUpdateErr = 'Error en acutalización de';
const msgDeleteOk = 'eliminado/a correctamente';
const msgDeleteErr = 'Error en eliminación de';
const msgTry = 'Vuelva a intentarlo, si el error persiste contacte con el administrado.';
const msgDataIncorrecta = 'Data incorrecta o incompleta.';
const msgSinInfo = 'No hay resultados, por favor genere una nueva consulta cambiando los filtros.';
const rutaTmpExcel = config.excel;

const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

/**
 * Convertir fecha a string 
 * @param {*} fecha 
 * @returns 
 */
const convetirFecha = (fecha) => {
    if(fecha){
        var fecha = fecha.split('-').reverse();
        fecha[1] = meses[Number(fecha[1]-1)].substr(0,3);
        return fecha.join('-');
    }else{
        return 'N/A';
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
        let style = {
            font: {
                color : '#000000',
                size : 11
            },
            alignment: {
                wrapText : true // ajustar al ancho de la columna
            }
        };

        let styleRowGray = wb.createStyle({
            ...style,
            fill : {
                type: 'pattern', // the only one implemented so far.
                patternType: 'solid', // most common.
                fgColor:'#F5F5F5'
            }
        });
        let styleRowWhite = wb.createStyle({
            ...style,
            fill : {
                type: 'pattern', // the only one implemented so far.
                patternType: 'solid', // most common.
                fgColor:'#FFFFFF'
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
            let style = ( r % 2 == 0) ? styleRowGray : styleRowWhite;
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
                        if(valor === null || valor.trim() === ''){
                            ws.cell(row, i+1).string('N/A').style(style);
                        }else{
                            ws.cell(row, i+1).string(valor).style(style);
                        }
                        break;
                    case 'Date':
                            ws.cell(row, i+1).string(convetirFecha(valor)).style(style);
                        break;
                    case 'Datetime':
                            valor = `${convetirFecha(valor.split(' ')[0])} ${valor.split(' ')[1]}`;
                            ws.cell(row, i+1).string(valor).style(style);
                        break;
                    default:
                        ws.cell(row, i+1).string(`${valor}`).style(style);
                        break;
                }
            }
            row++;
        }
        let nameFile = `${config.excel}/${name_file}_${username}.xlsx`;
        let nameFileExport = `/excelTmp/${name_file}_${username}.xlsx`;
        
        let result = await wb.writeP(nameFile);
        if(result){
            const buffer = await wb.writeToBuffer();
            return {status : 200, msg : 'Archivo generado correctamente', nameFile : `${name_file}_${username}.xlsx`}
        }
        return {status : 400, url : '', msg : result.err};
    }catch(error){
        return {status : 500, url:'', msg : error.message};
    }
}

/**
 * Generador de Excel para el Informe Procesal
 * @param {*} name_user 
 * @param {*} name_file 
 * @param {*} heads 
 * @param {*} rows 
 * @returns 
 */
const generateExcelInformeProcesal = async (username, name_user, title_report, name_file, cmp, data, multidata) => {
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

        ws.cell(1, 2, 1, 3, true).string(title_report).style(styleHeader);
        ws.row(1).setHeight(70);

        ws.cell(2, 2, 2, 3, true).string(`${name_user}`).style(styleHeader);
        ws.row(2).setHeight(45);

        // Estilos
        let style = {
            font: {
                color : '#000000',
                size : 12
            },
            alignment: {
                wrapText : true // ajustar al ancho de la columna
            },
            border: {
                left: {
                    style: 'thin', //§18.18.3 ST_BorderStyle (Border Line Styles) ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot']
                    color: '#000000' // HTML style hex value
                },
                right: {
                    style: 'thin',
                    color: '#000000'
                },
                top: {
                    style: 'thin',
                    color: '#000000'
                },
                bottom: {
                    style: 'thin',
                    color: '#000000'
                },
            }
        };

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
            },
            alignment: {
                horizontal: 'center',
                wrapText : true // ajustar al ancho de la columna
            },
            border: {
                left: {
                    style: 'thin', //§18.18.3 ST_BorderStyle (Border Line Styles) ['none', 'thin', 'medium', 'dashed', 'dotted', 'thick', 'double', 'hair', 'mediumDashed', 'dashDot', 'mediumDashDot', 'dashDotDot', 'mediumDashDotDot', 'slantDashDot']
                    color: '#000000' // HTML style hex value
                },
                right: {
                    style: 'thin',
                    color: '#000000'
                },
                top: {
                    style: 'thin',
                    color: '#000000'
                },
                bottom: {
                    style: 'thin',
                    color: '#000000'
                },
            }
        });

        let row = 4;
        // se imprimen valores
        for(let i = 0; i<cmp.length; i++){
            // Titulo
            ws.cell(row, 1).string(cmp[i].name_label).style(styleHeads);
            ws.column(1).setWidth(28);
            // Valor titulo
            if(cmp[i].multi_data == 1){
                let values = multidata.filter(({id_cmp_informe_procesal}) => id_cmp_informe_procesal == cmp[i].id ); // se obtienes los valores que tiene ese id 
                for(let v=0; v<values.length;v++){
                    if(values[v].value){
                        ws.cell(row, 2, row, 3, true).string(values[v].value).style(style);
                    }else{
                        ws.cell(row, 2, row, 3, true).string("").style(style);
                    }
                    ws.column(2).setWidth(30);
                    row++;
                }
            }else{
                if(data[cmp[i].name_cmp]){
                    ws.cell(row, 2, row, 3, true).string(data[cmp[i].name_cmp]).style(style);
                }else{
                    ws.cell(row, 2, row, 3, true).string("").style(style);
                }
                ws.column(2).setWidth(30);
                row++;
            }
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
    generateExcel,
    generateExcelInformeProcesal,
    deleteExcel,
    msgInsertOk,
    msgInsertErr,
    msgUpdateOk,
    msgUpdateErr,
    msgDeleteOk,
    msgDeleteErr,
    msgTry,
    msgDataIncorrecta,
    msgSinInfo,
    rutaTmpExcel
}