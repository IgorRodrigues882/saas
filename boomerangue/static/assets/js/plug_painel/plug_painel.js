"use strict";
  // Encontra o cookie que contém o csrftoken do Django
 // Encontra o cookie que contém o csrftoken do Django
 const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
 // Extrai o valor do csrftoken do cookie
 const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
 let editar = false
 var url;
var method;
var cadastro_tipo = function(){

    
    let btn_importa_csv;

    var init = function(){

        $("#salvar_tipo_empresa").on('click', function(){

            const data = new FormData();
            data.append("value", $("#value").val());
            data.append("value_prefixo", $("#value_prefixo").val());
            // Resto do código...
            fetch(url, {
                method: method,
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: data,
            }).then((response) => response.json())
            .then((data) => {
                if(data.id){
                    new swal({
						icon: 'success',
						title: 'Salvo!',
						buttons: false,
						timer: 1500
					  }).then(
						window.location.reload()
					  )
                }
                else{
                new swal({
                    title: "Erro",
                    text: data.error, 
                    icon: "error",
                    button: "OK",
                });

                }
            })
            .catch(error=>{
                new swal({
                title: "Erro",
                text: "Houve um erro ao chamar API", 
                icon: "error",
                button: "OK",
                });
            })
        })


    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

cadastro_tipo.init()



function new_(){
    url = 'api/ger_tipoempresa/';
    method = 'POST';
    editar = false
    $("#value").val('')
    $("#value_prefixo").val('')
}


function editar_tipo(id){
    url = `api/ger_tipoempresa/${id}/`;
    method = 'PATCH';
    editar = true
    fetch(`api/ger_tipoempresa/${id}`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
        },
    }).then((response) => response.json())
    .then((data) => {
        if(data){
            $("#value").val(data.value)
            $("#value_prefixo").val(data.value_prefixo)
        }
        else{
        new swal({
            title: "Erro",
            text: data.error, 
            icon: "error",
            button: "OK",
        });

        }
    })
    .catch(error=>{
        new swal({
        title: "Erro",
        text: "Houve um erro ao chamar API", 
        icon: "error",
        button: "OK",
        });
    })
}


function delete_(id){

    Swal.fire({
        title: 'Tem certeza?',
        text: "Tem certeza que deseja excluir essa empresa?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Não, cancelar!'
      }).then((willDelete)=>{
            if(willDelete){
            fetch(`api/ger_tipoempresa/${id}/`,{
                method:"DELETE",
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    // Você pode adicionar cabeçalhos de autenticação, se necessário
                  },
            }).then(response=>{
                if (response.ok) {
                   new swal({
                        icon: 'success',
                        title: 'Excluido!',
                        buttons: false,
                        timer: 1500
                      }).then(
                        window.location.reload()
                      )
                  }
                  else {
                   new swal({
                        title: "Erro",
                        text: "Houve um erro ao tentar excluir!",
                        icon: "error",
                        button: "OK",
                      });
                    
                  }
                response.json()
            }).then(te=>{
                console.log(te)
            })
            .catch(error => {
                console.error('Erro ao enviar a solicitação:', error);
              });
            
        }
        })
}




// #############################
let id_temporario;
function ver_empresa(id){
    id_temporario = id
    fetch_api(id);

}

function fetch_api(id){
    let tb = document.getElementById('tb_empresas');
    let loader = document.getElementById('loader-tb_empresa')
    loader.style.display = 'block'
    let opcao = 'remover'
    tb.innerHTML = ''
    fetch(`api/create-empresa/get_empresas/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({'id': id}),
    }).then((response) => response.json())
    .then((data) => {
        console.log(data)
        if(data){
            tb.innerHTML = gera_tb_empresas(data, opcao)
        }
        else{
        new swal({
            title: "Erro",
            text: data.error, 
            icon: "error",
            button: "OK",
        });

        }
    })
    .catch(error=>{
        new swal({
        title: "Erro",
        text: "Houve um erro ao chamar API "+ error, 
        icon: "error",
        button: "OK",
        });
    })
    .finally(()=>{
        loader.style.display = 'none'
    })
}


let id_grupo
function add_empresa(id){
    id_grupo = id
    let tb = document.getElementById('tb_empresas_add');
    let loader = document.getElementById('loader-tb_add');
    loader.style.display = 'block'
    let opcao = 'add'
    tb.innerHTML = ''
    fetch(`api/create-empresa/get_empresas/`, {
        method: 'POST',
        headers: {
            'X-CSRFToken': csrftoken,
            'Content-Type': 'application/json'
        },
        body:JSON.stringify({'id': null}),
    }).then((response) => response.json())
    .then((data) => {
        console.log(data)
        if(data){
            tb.innerHTML = gera_tb_empresas(data, opcao)
        }
        else{
        new swal({
            title: "Erro",
            text: data.error, 
            icon: "error",
            button: "OK",
        });

        }
    })
    .catch(error=>{
        new swal({
        title: "Erro",
        text: "Houve um erro ao chamar API "+ error, 
        icon: "error",
        button: "OK",
        });
    }).finally(()=>{
        loader.style.display = 'none'
    })
}


function gera_tb_empresas(index, opcao){
    let rowsHTML = ''; // String para construir HTM
          let somaTotal = 0
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }
          let btn;
          let titulo;
          if(opcao == 'remover'){
            btn = 'danger';
            titulo = 'remover';
          }
            else{
                btn = 'info';
                titulo = 'Adicionar';
            }

          for(let i = 0; i < index.length; i++){
            rowsHTML += `
            <tr>
                <td>
                <h6 class="task_title_0">${index[i].empresa}</h6>
                <p class="project_name_0">${index[i].cnpj}</p>
                <p class="">#${index[i].id}</p>
                </td>
                <td>
                <p class="task_desc_0"></p>
                </td>
                <td><a href="javascript:void(0)" class="btn btn-${btn}" onclick="editar_empresa(${index[i].id},'${opcao}')">${titulo}</a></td>
            </tr>
            `
          }


          return rowsHTML
}

function editar_empresa(id, status){
        const data = {
            tipo_de_negocio: status == 'remover' ? null : id_grupo
        }


    fetch(`api/create-empresa/${id}/`, {
        method: 'PATCH',
        headers: {
            'X-CSRFToken': csrftoken,
            "Content-Type": "application/json",
        },
        body:JSON.stringify(data),
    }).then((response) => {
        if(response.ok){
            new swal({
                icon: 'success',
                title: 'Salvo!',
                buttons: false,
                timer: 1500
            })

            status =='remover' ? fetch_api(id_temporario) : add_empresa(id_grupo)
        }
        else{
            new swal({
                title: "Erro",
                text: 'Houve Um erro', 
                icon: "error",
                button: "OK",
            });
        }
        })
    .catch(error=>{
        new swal({
        title: "Erro",
        text: "Houve um erro ao chamar API "+ error, 
        icon: "error",
        button: "OK",
        });
    })
}

// ######################################################################################
let url_api
function select_option(id){
    // let loader = document.getElementById('loader-tb_select');
    // loader.style.display = 'block'
    swal.fire({
        title: "Aguarde!",
        text: "Buscando dados...",
        icon: "info",
        buttons: false,
    });
    let bodyModal = document.getElementById('mb-select');
    bodyModal.innerHTML = ''
    $("#salvar_select").data('id',id)
    fetch(`api/select_tipo_campanha/${id}/`)
    .then((response) => response.json())
    .then((data) => {
        console.log(data)
        bodyModal.innerHTML = gera_lista_option(data)

    })
    .catch(error=>{
        new swal({
            title: "Erro",
            text: 'erro', 
            icon: "error",
            button: "OK",
        });
    })
    .finally(()=>{
        loader.style.display = 'none'
        swal.close()
    })
}

$("#salvar_select").on('click', function(){
    swal.fire({
        title: "Aguarde!",
        text: "Salvando...",
        icon: "info",
        buttons: false,
    });
    const data = new FormData();
    $("[id='option']").each(function() {
        data.append('option', $(this).val());
    });
    $("[id='option_prefix']").each(function() {
        data.append('option_prefix', $(this).val());
    });
    data.append("tipo_empresa", $("#salvar_select").data('id'));
    console.log(data)
    fetch('api/select_tipo_campanha/', {
        method: "POST",
        headers: {
            'X-CSRFToken': csrftoken,
        },
        body: data,
    }).then((response) => response.json())
    .then((data) => {
        console.log(data)
        if(data){
            new swal({
                icon: 'success',
                title: 'Salvo!',
                buttons: false,
                timer: 1500
              })
        }
        else{
        new swal({
            title: "Erro",
            text: 'erro', 
            icon: "error",
            button: "OK",
        });

        }
    })
    .catch(error=>{
        new swal({
        title: "Erro",
        text: "Houve um erro ao chamar API", 
        icon: "error",
        button: "OK",
        });
    })
})


function gera_lista_option(index){
    let rowsHTML = ''; // String para construir HTM
          let somaTotal = 0
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          for(let i = 0; i < index.length; i++){
            rowsHTML += `
            <div class="mb-3 d-block">

                      <label class="col-form-label">Option</label>
                      <div class="col-sm-12 d-flex">
                        <div class="col-sm-8">
                          <input class="form-control" id="option" data-idopt="${index[i].id}" value="${index[i].option}" maxlength="50" type="text">
                        </div>
                        <div class="col-sm-2 ms-2">
                          <input class="form-control" id="option_prefix" data-idpref="${index[i].id}" value="${index[i].option_prefix}" maxlength="5" placeholder="prefixo" type="text">
                        </div>
                        <div class="col-sm-2 ms-2">
                          <button class="btn btn-danger" id="excluir_option" onclick="excluir_option(${index[i].id})"><i class="fa fa-trash-o"></i></button>
                        </div>
                      </div>

                    </div>
            `
          }


          return rowsHTML
}


function addOption() {
    let bodyModal = document.getElementById('mb-select');

    // Cria os elementos
    let div1 = document.createElement('div');
    div1.className = 'mb-3 d-block';

    let label = document.createElement('label');
    label.className = 'col-form-label';
    label.textContent = 'Option';

    let div2 = document.createElement('div');
    div2.className = 'col-sm-12 d-flex';

    let div3 = document.createElement('div');
    div3.className = 'col-sm-8';

    let input1 = document.createElement('input');
    input1.className = 'form-control';
    input1.id = 'option';
    input1.maxLength = '50';
    input1.type = 'text';

    let div4 = document.createElement('div');
    div4.className = 'col-sm-2 ms-2';

    let input2 = document.createElement('input');
    input2.className = 'form-control';
    input2.id = 'option_prefix';
    input2.maxLength = '5';
    input2.placeholder = 'prefixo';
    input2.type = 'text';

    let div5 = document.createElement('div');
    div5.className = 'col-sm-2 ms-2';

    let button = document.createElement('button');
    button.className = 'btn btn-danger';
    button.id = 'excluir_option';
    button.onclick = function() { excluir_option(this); };

    let i = document.createElement('i');
    i.className = 'fa fa-trash-o';

    // Anexa os elementos
    button.appendChild(i);
    div5.appendChild(button);
    div4.appendChild(input2);
    div3.appendChild(input1);
    div2.appendChild(div3);
    div2.appendChild(div4);
    div2.appendChild(div5);
    div1.appendChild(label);
    div1.appendChild(div2);
    bodyModal.appendChild(div1);
}

function excluir_option(index){
    if (index instanceof HTMLElement) {
        $(index).closest('.mb-3').remove();
    } else {
        Swal.fire({
            title: 'Tem certeza?',
            text: "Tem certeza que deseja excluir essa option?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sim, excluir!',
            cancelButtonText: 'Não, cancelar!'
          }).then((willDelete)=>{
                if(willDelete){
                fetch(`api/select_tipo_campanha/${index}/`,{
                    method:"DELETE",
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                        // Você pode adicionar cabeçalhos de autenticação, se necessário
                      },
                }).then(response=>{
                    if (response.ok) {
                       new swal({
                            icon: 'success',
                            title: 'Excluido!',
                            buttons: false,
                            timer: 1500
                          })

                      }
                      else {
                       new swal({
                            title: "Erro",
                            text: "Houve um erro ao tentar excluir!",
                            icon: "error",
                            button: "OK",
                          });
                        
                      }
                    response.json()
                }).then(te=>{
                    select_option($("#salvar_select").data('id'))
                })
                .catch(error => {
                    console.error('Erro ao enviar a solicitação:', error);
                  });
                
            }
            })
    }
}