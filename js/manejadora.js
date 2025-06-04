document.addEventListener("DOMContentLoaded", () => {
    crearTablaPinturas()



    document.getElementById("btnAgregar").addEventListener("click", agregarPintura)
    document.getElementById("btnModificar").addEventListener("click",modificarPintura)


    const btnFiltrar = document.getElementById("btnFiltrar");
    if (btnFiltrar) {
        btnFiltrar.addEventListener("click", async () => {
            const marcaFiltro = document.getElementById("inputFiltroMarca").value.trim().replace(/\s+/g, ' ').toLowerCase();
            const data = await solicitudes();
            if (!Array.isArray(data)) return;

            const pinturasFiltradas = data.filter(pintura => {
                const marcaNormalizada = pintura.marca.trim().replace(/\s+/g, ' ').toLowerCase();
                return marcaNormalizada === marcaFiltro;
            });
            if(marcaFiltro === ""){
                crearTablaPinturas()
            }
            crearTablaPinturas(pinturasFiltradas);
        });
    }

    const btnPromedio = document.getElementById("btnPromedio");
    if (btnPromedio) {
        btnPromedio.addEventListener("click", promedio);
    }
    const btnEstadisticas = document.getElementById("btnEstadistica")
    if(btnEstadisticas){
        btnEstadisticas.addEventListener("click", ejecutarFuncionesEstadisticas )
    }

    const btnExportar = document.getElementById("btnCSV");
    if(btnExportar){
        btnExportar.addEventListener("click", exportarCSV)
    }
});

const API = "https://utnfra-api-pinturas.onrender.com/pinturas/"


async function solicitudes(id="", metodo="GET", body=null){
    const opciones = {
        method: metodo,
        headers: {
            "Content-Type": "application/json"
        }
    }
    if(body){
        opciones.body = JSON.stringify(body);
    }
    try{
        
        const url = id ? API + id : API

        const res = await fetch(url, opciones)
        if(!res.ok){
            throw new Error("Error en la respuesta de la API");
        }
        if(metodo === "DELETE"){
            return true;
        }


        const data = await res.json();

        if (Array.isArray(data)) {
            const datosFiltrados = data.filter(pintura => {
                return (typeof pintura.id === "number" &&
                    typeof pintura.marca === "string" &&
                    typeof pintura.precio === "number" &&
                    typeof pintura.color === "string" &&
                    typeof pintura.cantidad === "number")
            });
            return datosFiltrados.slice(0, 100) //  PROFEEEE BORRE ESTA LINEA SI QUIERE TRAER TODO POR LA API ESTA TODA ROTA Y TARDA MUCHO SINO
            return datosFiltrados;
        }
        
        if (data.pintura) {
            console.log(data.pintura)
            return data.pintura;
        }
        
        return data;
        
    } catch (error){
        console.log("Error al realizar la solicitud:" , error);
        return false
    }
    
}

async function modificarPintura(e){
    e.preventDefault()
    if(!validarFormulario())return;
    const pintura = await obtenerDatosFormulario()
    const id = document.getElementById("inputID").value
    const res = await solicitudes(id, "PUT", pintura)
    if (res){
        crearTablaPinturas()
        limpiarFormulario()
        alertaExitoError("Pintura modificada con exito")
        return
    }
    alertaExitoError("Error al modificar la pintura", "danger")
}


async function alertaExitoError(mensaje = "", tipo = "success") {

    const alertasAnteriores = document.querySelectorAll("#frmFormulario .alert");
    alertasAnteriores.forEach(alerta => alerta.remove());


    const alerta = document.createElement("div");
    alerta.classList.add("alert", "alert-" + tipo, "alert-dismissible", "fade", "show", "mt-4");
    alerta.setAttribute("role", "alert");
    alerta.textContent = mensaje;


    const contenedor = document.getElementById("frmFormulario");
    contenedor.appendChild(alerta);


    setTimeout(() => {
        alerta.classList.remove("show"); 
        alerta.classList.add("hide");    
        alerta.remove();                 
    }, 4000); 
}



async function agregarPintura(e){
    e.preventDefault()
    if(!validarFormulario()) return;
    const pintura = await obtenerDatosFormulario()
    const res = await solicitudes("", "POST", pintura)
    if(res){
        crearTablaPinturas()
        limpiarFormulario()
        alertaExitoError("Pintura agregada con exito")
        return
    }
    alertaExitoError("Error al agregar la pintura", "danger")
}


async function obtenerKeysPinturas(){
    const data = await solicitudes();
    if (!Array.isArray(data)) return; 

    const keys = Object.keys(data[0]);
    keys.push("Acciones")
    return keys;
}

async function obtenerValoresPinturas(){
    const data = await solicitudes();
    if (!Array.isArray(data)) return; 
    const valores = data.map(pintura=> Object.values(pintura))

    return valores;
}


async function crearTablaPinturas(data = null) {
    const listado = document.getElementById("divListado");

    listado.innerHTML = "<spinner class='spinner-border text-primary m-4' role='status'><span class='visually-hidden'></span></spinner>"; 

    const keys = await obtenerKeysPinturas();
    const valores = data ? data.map(pintura => Object.values(pintura)) : await obtenerValoresPinturas();

    if (window.innerWidth < 770) {
        listado.innerHTML = "";
        valores.forEach(valoresPintura => {
            const tableContainer = document.createElement("div");
            tableContainer.classList.add("table-responsive", "mb-3");

            const table = document.createElement("table");
            table.classList.add("table", "table-bordered", "table-sm");

            const tbody = document.createElement("tbody");


            valoresPintura.forEach((valor, index) => {
                const tr = document.createElement("tr");

                const th = document.createElement("th");
                th.textContent = keys[index];
                th.classList.add("text-start", "align-middle");
                tr.appendChild(th);

                const td = document.createElement("td");
                td.classList.add("text-start", "align-middle");

                if (typeof valor === "string" && valor.startsWith("#")) {
                    const inputColor = document.createElement("input");
                    inputColor.type = "color";
                    inputColor.disabled = true;
                    inputColor.value = valor;
                    td.appendChild(inputColor);
                } else {
                    td.textContent = valor;
                }

                tr.appendChild(td);
                tbody.appendChild(tr);
            });

            const actionsRow = document.createElement("tr");
            const actionsHeader = document.createElement("th");
            actionsHeader.textContent = "Acciones";
            actionsHeader.classList.add("text-start", "align-middle");
            actionsRow.appendChild(actionsHeader);

            const actionsCell = document.createElement("td");
            actionsCell.classList.add("d-flex", "gap-2", "justify-content-center");

            const btnEliminar = document.createElement("button");
            btnEliminar.classList.add("btn", "btn-danger");
            btnEliminar.innerHTML = '<i class="fas fa-trash"></i>';
            btnEliminar.addEventListener("click", async (e) => {
                e.preventDefault();
                const id = valoresPintura[0];
                let confirmacion = confirm("¿Estás seguro que deseas eliminar la pintura?");
                if (!confirmacion) return;
                const res = await solicitudes(id, "DELETE");
                if (res) {
                    crearTablaPinturas();
                    const listaAccordion = document.getElementById("flush-collapseTwo");
                    const altaAccordion = document.getElementById("flush-collapseThree");

                    const bootstrapCollapseLista = new bootstrap.Collapse(listaAccordion, { toggle: false });
                    const bootstrapCollapseAlta = new bootstrap.Collapse(altaAccordion, { toggle: false });
                    bootstrapCollapseLista.hide();
                    bootstrapCollapseAlta.show();
                    alertaExitoError("pintura eliminada con exito")
                    return;
                }
                alertaExitoError("Error al eliminar la pintura", "danger")
            });

            const btnCargarFormulario = document.createElement("button");
            btnCargarFormulario.classList.add("btn", "btn-primary");
            btnCargarFormulario.innerHTML = '<i class="fas fa-edit"></i>';
            btnCargarFormulario.addEventListener("click", async (e) => {
                e.preventDefault();
                const id = valoresPintura[0];
                const res = await solicitudes(id, "GET");
                if (res) {
                    document.getElementById("inputMarca").value = res.marca;
                    document.getElementById("inputPrecio").value = res.precio;
                    document.getElementById("inputColor").value = res.color;
                    document.getElementById("inputCantidad").value = res.cantidad;
                    document.getElementById("inputID").value = res.id;

                    const listaAccordion = document.getElementById("flush-collapseTwo");
                    const altaAccordion = document.getElementById("flush-collapseThree");

                    const bootstrapCollapseLista = new bootstrap.Collapse(listaAccordion, { toggle: false });
                    const bootstrapCollapseAlta = new bootstrap.Collapse(altaAccordion, { toggle: false });

                    bootstrapCollapseLista.hide();
                    bootstrapCollapseAlta.show();
                }
            });

            

            actionsCell.appendChild(btnEliminar);
            actionsCell.appendChild(btnCargarFormulario);
            actionsRow.appendChild(actionsCell);
            tbody.appendChild(actionsRow);

            table.appendChild(tbody);
            tableContainer.appendChild(table);
            listado.appendChild(tableContainer);
        });
    } else {
        const tablaContainer = document.createElement("div");
        tablaContainer.classList.add("table-responsive");

        const tabla = document.createElement("table");
        tabla.classList.add("table", "table-primary", "table-striped-columns", "table-sm", "table-bordered");
        tabla.style.marginTop = "20px";
        const thead = document.createElement("thead");
        const tr = document.createElement("tr");

        keys.forEach(key => {
            const th = document.createElement("th");
            th.textContent = key;
            th.classList.add("text-center", "align-middle");
            tr.appendChild(th);
        });
        thead.appendChild(tr);
        tabla.appendChild(thead);

        const tbody = document.createElement("tbody");
        valores.forEach(valoresPintura => {
            const tr = document.createElement("tr");

            valoresPintura.forEach(valor => {
                const td = document.createElement("td");
                td.classList.add("text-center", "align-middle");

                if (typeof valor === "string" && valor.startsWith("#")) {
                    const inputColor = document.createElement("input");
                    inputColor.type = "color";
                    inputColor.disabled = true;
                    inputColor.value = valor;
                    td.appendChild(inputColor);
                } else {
                    td.textContent = valor;
                }

                tr.appendChild(td);
            });

            const tdAcciones = document.createElement("td");
            tdAcciones.classList.add("d-flex", "gap-1", "justify-content-center");

            const btnEliminar = document.createElement("button");
            btnEliminar.classList.add("btn", "btn-danger");

            const iconoTrash = document.createElement("i");
            iconoTrash.classList.add("fas", "fa-trash");

            btnEliminar.appendChild(iconoTrash);
            btnEliminar.addEventListener("click", async (e) => {
                e.preventDefault();
                const id = valoresPintura[0];
                let confirmacion = confirm("¿Estás seguro que deseas eliminar la pintura?");
                if (!confirmacion) return;
                const res = await solicitudes(id, "DELETE");
                
                if (res) {
                    crearTablaPinturas();
                    const listaAccordion = document.getElementById("flush-collapseTwo");
                    const altaAccordion = document.getElementById("flush-collapseThree");

                    const bootstrapCollapseLista = new bootstrap.Collapse(listaAccordion, { toggle: false });
                    const bootstrapCollapseAlta = new bootstrap.Collapse(altaAccordion, { toggle: false });
                    bootstrapCollapseLista.hide();
                    bootstrapCollapseAlta.show();
                    alertaExitoError("pintura eliminada con exito")
                    return;
                }

                alertaExitoError("Error al eliminar la pintura", "danger")
            });

            const btnCargarFormulario = document.createElement("button");
            btnCargarFormulario.classList.add("btn", "btn-primary");
            const iconoCargar = document.createElement("i");
            iconoCargar.classList.add("fas", "fa-edit");
            btnCargarFormulario.appendChild(iconoCargar);
            btnCargarFormulario.addEventListener("click", async (e) => {
                e.preventDefault();
                const id = valoresPintura[0];
                const res = await solicitudes(id, "GET");
                if (res) {
                    document.getElementById("inputMarca").value = res.marca;
                    document.getElementById("inputPrecio").value = res.precio;
                    document.getElementById("inputColor").value = res.color;
                    document.getElementById("inputCantidad").value = res.cantidad;
                    document.getElementById("inputID").value = res.id;

                    const listaAccordion = document.getElementById("flush-collapseTwo");
                    const altaAccordion = document.getElementById("flush-collapseThree");

                    const bootstrapCollapseLista = new bootstrap.Collapse(listaAccordion, { toggle: false });
                    const bootstrapCollapseAlta = new bootstrap.Collapse(altaAccordion, { toggle: false });

                    bootstrapCollapseLista.hide();
                    bootstrapCollapseAlta.show();
                }
            });

            tdAcciones.appendChild(btnEliminar);
            tdAcciones.appendChild(btnCargarFormulario);
            tr.appendChild(tdAcciones);
            tbody.appendChild(tr);
        });
        listado.innerHTML = "";
        tabla.appendChild(tbody);
        tablaContainer.appendChild(tabla);
        listado.appendChild(tablaContainer);
    }
}


async function obtenerDatosFormulario(){

    const marca = document.getElementById("inputMarca").value
    const precio = Number(document.getElementById("inputPrecio").value)
    const color = document.getElementById("inputColor").value
    const cantidad = Number(document.getElementById("inputCantidad").value)
   
    return {
        marca,
        precio,
        color,
        cantidad
    }
}

async function cantidadPinturasCargadas(){
    const data = await solicitudes();
    return data.length;
}

async function marcaMasComun(){
    const data = await solicitudes();
    if(!Array.isArray(data)) return;
    const marcas = data.map(pintura => pintura.marca);
    const contador = marcas.reduce((acumulador, marca) => {
        acumulador[marca] = (acumulador[marca] || 0) + 1;

        return acumulador;
    }, {})
    const max = Math.max(...Object.values(contador));
    const marcaMasComun = Object.keys(contador).find(marca => contador[marca] === max);
    
    return marcaMasComun ? marcaMasComun : "No hay marcas cargadas";
}

async function pinturaMasCara() {
    const data = await solicitudes();
    if (!Array.isArray(data)) return;
    const pinturaCara = data.reduce((max, pintura) => {
        return pintura.precio > max.precio ? pintura : max;
    }, { precio: 0 });

    return pinturaCara;
}

async function promedioPorMarca() {
    const data = await solicitudes();
    if (!Array.isArray(data)) return;

    const marcas = [...new Set(data.map(pintura => pintura.marca))];
    const promedios = marcas.map(marca => {
        const pinturasMarca = data.filter(pintura => pintura.marca === marca);
        const promedio = pinturasMarca.reduce((acc, pintura) => acc + pintura.precio, 0) / pinturasMarca.length;
        return { marca, promedio: promedio.toFixed(2) };
    });

    const promedioGeneral = (data.reduce((acc, pintura) => acc + pintura.precio, 0) / data.length).toFixed(2);



    return { promedioGeneral, promedios };
}

async function promedio(){
    const data = await solicitudes();
    if (!Array.isArray(data)) return;

    const promedio = data.reduce((acc, pintura) => acc + pintura.precio, 0) / data.length;
    alert(`El precio promedio de las pinturas es: $${promedio.toFixed(2)}`);
}

async function ejecutarFuncionesEstadisticas() {
    const divEstadisticas = document.getElementById("idEstadisticas");
    divEstadisticas.innerHTML = "<spinner class='spinner-border text-primary m-5' role='status'><span class='visually-hidden'></span></spinner>"


    const estadisticasContainer = document.createElement("div");
    estadisticasContainer.classList.add("card", "p-3", "shadow-sm");

    const titulo = document.createElement("h4");
    titulo.textContent = "Estadísticas de Pinturería";
    titulo.classList.add("text-center", "mb-3");
    estadisticasContainer.appendChild(titulo);

    const cantidadMasCargada = await cantidadPinturasCargadas();
    const marcaComun = await marcaMasComun();
    const pinturaCara = await pinturaMasCara();
    const { promedioGeneral, promedios } = await promedioPorMarca();

    const cantidadPinturas = document.createElement("p");
    cantidadPinturas.innerHTML = `<strong>Cantidad de pinturas cargadas:</strong> ${cantidadMasCargada}`;
    estadisticasContainer.appendChild(cantidadPinturas);

    const marcaMasComunElemento = document.createElement("p");
    marcaMasComunElemento.innerHTML = `<strong>Marca más común:</strong> ${marcaComun}`;
    estadisticasContainer.appendChild(marcaMasComunElemento);

    const pinturaMasCaraElemento = document.createElement("p");
    pinturaMasCaraElemento.innerHTML = `<strong>Pintura más cara:</strong> ${pinturaCara.marca} - $${pinturaCara.precio}`;
    estadisticasContainer.appendChild(pinturaMasCaraElemento);

    const promedioGeneralElemento = document.createElement("p");
    promedioGeneralElemento.innerHTML = `<strong>Promedio general de precios:</strong> $${promedioGeneral}`;
    estadisticasContainer.appendChild(promedioGeneralElemento);

    const promediosPorMarcaTitulo = document.createElement("h5");
    promediosPorMarcaTitulo.textContent = "Promedio por marca:";
    promediosPorMarcaTitulo.classList.add("mt-3");
    estadisticasContainer.appendChild(promediosPorMarcaTitulo);

    const listaPromedios = document.createElement("ul");
    listaPromedios.classList.add("list-group");
    promedios.forEach(({ marca, promedio }) => {
        const item = document.createElement("li");
        item.classList.add("list-group-item");
        item.textContent = `${marca}: $${promedio}`;
        listaPromedios.appendChild(item);
    });
    
    divEstadisticas.innerHTML = "";

    estadisticasContainer.appendChild(listaPromedios);

    divEstadisticas.appendChild(estadisticasContainer);
}

async function exportarCSV() {
    const listaDescargable = await solicitudes();
    if (!Array.isArray(listaDescargable) || listaDescargable.length === 0) {
        alertaExitoError("No hay datos para exportar", "danger");
        return;
    }

    const cabeceras = Object.keys(listaDescargable[0]).join(',');
    const filas = listaDescargable.map(obj => Object.values(obj).join(',')).join('\n');
    const contenido = `${cabeceras}\n${filas}`;
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'datos-exportados.csv';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }, 5000);

    alertaExitoError("Datos exportados con éxito", "success");
}


function validarFormulario() {
    const marca = document.getElementById("inputMarca");
    const precio = document.getElementById("inputPrecio");
    const cantidad = document.getElementById("inputCantidad");

    const feedbacks = {
        marca:    marca.nextElementSibling,
        precio:   precio.nextElementSibling,
        cantidad: cantidad.nextElementSibling
    };

    let valid = true;

    if (!marca || !precio || !cantidad) {
        console.error("Falta algún elemento del formulario en el DOM");
        return false;
    }

    [marca, precio, cantidad].forEach(input => {
        input.classList.remove("is-invalid", "is-valid");
    });

    Object.values(feedbacks).forEach(div => div.textContent = "");

    if (!marca.value.trim()) {
        marca.classList.add("is-invalid");
        feedbacks.marca.textContent = "Por favor complete la marca.";
        valid = false;
    } else {
        marca.classList.add("is-valid");
    }

    if (precio.value <= 50 || precio.value >= 500 || !precio.value || isNaN(precio.value)) {
        precio.classList.add("is-invalid");
        feedbacks.precio.textContent = "Ingrese un precio válido entre 50 y 500.";
        valid = false;
    } else {
        precio.classList.add("is-valid");
    }

    if (cantidad.value < 1 || cantidad.value >= 400 || isNaN(cantidad.value)) {
        cantidad.classList.add("is-invalid");
        feedbacks.cantidad.textContent = "Cantidad entre 1 y 400.";
        valid = false;
    } else {
        cantidad.classList.add("is-valid");
    }

    if (valid) {
        setTimeout(() => {
            [marca, precio, cantidad].forEach(input => {
                input.classList.remove("is-valid", "is-invalid");
            });
        }, 4000); 
        alertaExitoError("Se ingreso con exito la pintura" , "success")
    }

    return valid;
}

function limpiarFormulario(){
    document.getElementById("frmFormulario").reset()
}




