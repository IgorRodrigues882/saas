"use strict";

let editar_criatividade = false
var url_criatividade;
var method_criatividade;
var criatividade_ = function(){
    var init = function(){

        $('#save_criatividade').on('click',function(){
            if($("#criatividade").val()){
                let data = {
                    criatividade: $("#criatividade").val() || null,
                    gpt:$('#gpt').val() || null,
                    key: $('#key').val()|| null
                }
                fetch(url_criatividade,{
                   method:method_criatividade,
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
                            button: "OK",
                        });
                        gera_tabela_criatividade()
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

criatividade_.init()

function new_criatividade(){
    editar_criatividade = false
    url_criatividade = 'api/criatividade/'
    method_criatividade = 'POST'
    $("#criatividade").val('')
    $('#gpt').val('')
    $('#key').val('')
}

function delete_criatividade(index){
    Swal.fire({
        title: 'Tem certeza?',
        text: "Tem certeza que deseja excluir essa criatividade?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Não, cancelar!'
      }).then((willDelete)=>{
        if(willDelete){
            fetch(`api/criatividade/${index}/`,{
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
                        gera_tabela_criatividade()
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

function edit_criatividade(id){
    url_criatividade = `api/criatividade/${id}/`
    method_criatividade = 'PATCH'
    fetch(`api/criatividade/${id}`, {
        method: 'GET',
        headers: {
            'X-CSRFToken': csrftoken,
        },
    }).then((response) => response.json())
    .then((data) => {
        if(data){
            $("#criatividade").val(data.criatividade)
            $('#gpt').val(data.gpt)
            $('#key').val(data.key)
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


function gera_tabela_criatividade(){
    fetch('api/criatividade/',{
        method:"GET",
        headers: {
            'X-CSRFToken': csrftoken,
        }
    })
    .then(res=>res.json())
    .then(data=>{
    let tbody = document.getElementById('tbody_criatividade')
    tbody.innerHTML=''
    let rowsHTML = ''; // String para construir HTM
          // Verifica se index é um objeto único e não um array, e o converte para um array

    for(let i = 0; i < data.length; i++){
        rowsHTML += `
        <tr>
            <td>
            <div class="media">
                <div class="square-box me-2"><img class="img-fluid b-r-5"
                    src="/static/assets/images/lampada-de-ideia.png" alt="" style="width: 100%; height: 100%; object-fit: contain;"></div>
                <div class="media-body ps-2">
                <div class="avatar-details"><a href="#">
                    <h6>${data[i].criatividade}</h6>
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
                    href="#" onclick="delete_criatividade(${data[i].id})">Excluir</a>
                    <a class="dropdown-item"
                    href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modal_add_criativiade" onclick="edit_criatividade(${data[i].id})">Editar</a>
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