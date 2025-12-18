"use strict";
let editar_tomvoz = false
var url_tomvoz;
var method_tomvoz;
var tomvoz_ = function(){

    var init = function(){

        $('#save_tomvoz').on('click',function(){
            if($("#tomvoz").val()){
                let data = {
                    tomvoz: $("#tomvoz").val() || null,
                    gpt:$('#gpt_tom').val() || null,
                    key: $('#key_tom').val()|| null
                }
                fetch(url_tomvoz,{
                   method:method_tomvoz,
                   headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                    },
                    body: JSON.stringify(data)
                })
                .then(res=>res.json())
                .then(data=>{
                    if(data){
                        swal.fire({
                            title: "Sucesso!",
                            text: "Item salvo", 
                            icon: "success",
                        });
                        gera_tabela_tom()
                    }
                    else{
                        swal.fire({
                            title: "Erro",
                            text: "Ocorreu um erro ao tentar salvar!", 
                            icon: "error",
                            button: "OK",
                        });
                    }
                })

            }
            else{
                swal.fire({
                    title: "Erro",
                    text: "Preencha o campo criatividade!", 
                    icon: "error",
                    button: "OK",
                });
            }

        })
    
    }
    return {
        init: function() {
            init();
        }
    };
}()

tomvoz_.init()

function new_tom(){
    editar_tomvoz = false
    url_tomvoz = 'api/tomvoz/'
    method_tomvoz = 'POST'
    $("#tomvoz").val('')
    $('#gpt_tom').val('')
    $('#key_tom').val('')
}

function delete_tom(index){
    Swal.fire({
        title: 'Tem certeza?',
        text: "Tem certeza que deseja excluir esse tom de voz?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Não, cancelar!'
      }).then((willDelete)=>{
        if(willDelete){
            fetch(`api/tomvoz/${index}/`,{
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
                        gera_tabela_tom()
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

function edit_tom(id){
    url_tomvoz = `api/tomvoz/${id}/`
    method_tomvoz = 'PATCH'
    fetch(`api/tomvoz/${id}/`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
        },
    }).then((response) => response.json())
    .then((data) => {
        if(data){
            $("#tomvoz").val(data.tomvoz)
            $('#gpt_tom').val(data.gpt)
            $('#key_tom').val(data.key)
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


function gera_tabela_tom(){
    fetch('api/tomvoz/',{
        method:"GET",
        headers: {
            'X-CSRFToken': csrftoken,
        }
    })
    .then(res=>res.json())
    .then(data=>{
    let tbody = document.getElementById('tbody_tom')
    tbody.innerHTML=''
    let rowsHTML = ''; // String para construir HTM
          // Verifica se index é um objeto único e não um array, e o converte para um array

    for(let i = 0; i < data.length; i++){
        rowsHTML += `
        <tr>
            <td>
            <div class="media">
                <div class="square-box me-2"><img class="img-fluid b-r-5"
                    src="/static/assets/images/gravador-de-voz.png" alt="" style="width: 100%; height: 100%; object-fit: contain;"></div>
                <div class="media-body ps-2">
                <div class="avatar-details"><a href="#">
                    <h6>${data[i].tomvoz}</h6>
                    </a><span></span></div>
                </div>
            </div>
            </td>
            <td class="img-content-box">
            <h6>${data[i].gpt}</h6>
            </td>
            <td>
            ${data[i].key}
            </td>
            <td>
            <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                    aria-haspopup="true" aria-expanded="false">Opções</button>
                <div class="dropdown-menu">
                    <a class="dropdown-item"
                    href="#" onclick="delete_tom(${data[i].id})">Excluir</a>
                    <a class="dropdown-item"
                    href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modal_add_tomvoz" onclick="edit_tom(${data[i].id})">Editar</a>
                </div>
            </td>
      </tr>
        `

    }
    tbody.innerHTML = rowsHTML;
    })
    .catch(error=>{
        swal.fire({
            title: "Erro",
            text: "Ocorreu um erro ao tentar buscar 'criatividades'", 
            icon: "error",
            button: "OK",
        });
    })

}