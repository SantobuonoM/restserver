const express = require('express')
const fileUpload = require('express-fileupload');
const { request } = require('./usuario');
const app = express();
const producto = require('../models/producto')
const usuario = require('../models/usuario');
const fs = require('fs');
const path = require('path');

// default options 

app.use(fileUpload());

app.put('/upload/:tipo/:id', function(req, res) {

    let archivo = req.files.archivo;
    let tipo = req.params.tipo;
    let id = req.params.id;
    let nombreCortado = archivo.name.split('.');
    let extension = nombreCortado[nombreCortado.length - 1];


    let tiposValidos = ['productos', 'usuarios'];
    if (tiposValidos.indexOf(tipo) < 0) {

        return res.status(400).json({
            ok: false,
            err: {
                message: 'Los tipos permitidos son: ' + tiposValidos.join(', '),
            }
        })
    };

    let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];
    if (extensionesValidas.indexOf(extension) < 0) {


        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las extensiones permitidas son: ' + extensionesValidas.join(' , '),
                ext: extension
            }
        })
    };
    /////////////////
    ////// cambiar nombre de usuario
    ///////////////
    let nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extension }`

    archivo.mv(`uploads/${tipo}/${nombreArchivo}`, (err) => {

        if (err)
            return res.status(500).json({
                ok: false,
                err

            });

        if (tipo === 'usuario') {

            imagenUsuario(id, res, nombreArchivo);

        } else {

            imagenProducto(id, res, nombreArchivo);

        }


    })


});

function imagenUsuario(id, res, nombreArchivo) {

    usuario.findById(id, (err, usuarioDB) => {

        if (err) {
            return res.status(500).json({
                ok: false,
                err
            })


        }

        if (!usuarioDB) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'El usuario no existe'
                }
            })
        }


        let pathImagen = path.resolve(__dirname, `../../uploads/usuarios/${usuarioDB.img}`);
        if (fs.existsSync(pathImagen)) {
            fs.unlinkSync(pathImagen)
        };
        borraArchivo(usuarioDB, 'usuarios')

        usuarioDB.img = nombreArchivo;


        console.log(usuarioDB);

        usuarioDB.save((err, usuarioGuardado) => {
            console.log('error', err);

            res.json({
                ok: true,
                usuario: usuarioGuardado,
                img: nombreArchivo
            })

        })



    })


}

function imagenProducto(id, res, nombreArchivo) {

    producto.findById(id, (err, productoDB) => {

        if (err) {
            borraArchivo(nombreArchivo, 'productos');
            return res.status(500).json({
                ok: false,
                err
            })


        }

        if (!productoDB) {
            borraArchivo(nombreArchivo, 'productos');
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'El producto no existe'
                }
            })
        }
        borraArchivo(productoDB.img, 'productos')

        productoDB.img = nombreArchivo;

        let pathImagen = path.resolve(__dirname, `../../uploads/productos/${productoDB.img}`);
        if (fs.existsSync(pathImagen)) {
            fs.unlinkSync(pathImagen)
        };

        imagenProductos(id, res, nombreArchivo)



        console.log(productoDB);

        productoDB.save((err, productoGuardado) => {
            console.log('error', err);

            res.json({
                ok: true,
                usuario: productoGuardado,
                img: nombreArchivo
            })

        })

    })
};

function borraArchivo(nombreImagen, tipo) {

    let pathImagen = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImagen}`);

    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen)
    };
}

module.exports = app;