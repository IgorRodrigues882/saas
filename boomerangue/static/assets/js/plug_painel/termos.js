"use strict";
var terms = function(){

    let btn_importa_csv;

    var init = function(){



        $('#salvar_termos').click(function() {
            let lista = [];
            let inputs = document.querySelectorAll('input[data-chave]'); // Seleciona todos os inputs com o atributo data-chave
        
            // Loop através dos inputs e adiciona os valores editados à lista
            inputs.forEach(input => {
                if(input.getAttribute('data-chave') == 'novo_termo'){
                    input.setAttribute('data-chave', input.value);
                }
                lista.push({
                    chave: input.getAttribute('data-chave'),
                    valor: input.value
                });
            });
            
            console.log(lista)
            
            swal.fire({
                title: "Aguarde!",
                text: "Sua solicitação está sendo processada...",
                icon: "info",
                buttons: false,
            });
        
            fetch('api/stringspersonalizadas/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({termos: lista, grupo: id_temp_term}),
            })
            .then(response => response.json())
            .then(data => {
                if(data.message){
                    swal.fire({
                        icon: 'success',
                        title: 'Salvo!',
                        buttons: false,
                        timer: 1500
                    })
                }
                else{
                    new swal({
                        title: "Erro",
                        text: "Houve um erro", 
                        icon: "error",
                        button: "OK",
                    });
                }
            })
            .catch((error) => {
                console.error('Error:', error);
            });
        });
        






    }
    return {
        init: function() {
            // btn_importa_csv = document.getElementById('new_csv')
            init();
        }
    };
}()

terms.init()

let id_temp_term
function termos(id){
    id_temp_term = id
    let body = document.getElementById('body_termos')
    body.innerHTML = '';
    swal.fire({
        title: "Aguarde!",
        text: "Sua solicitação está sendo processada...",
        icon: "info",
        buttons: false,
    });
    fetch(`api/stringspersonalizadas/${id}/`)
    .then(response => response.json())
    .then(data => {
        console.log(data)
        if(data.length > 0){
            body.innerHTML = gera_lista_termos(data)
        }
    })
    .catch((error) => {
        swal.fire({
            title: "Erro",
            text: "Houve um erro ao chamar API", 
            icon: "error",
            button: "OK",
        });
    })
    .finally(()=>{
        swal.close()
    })

}


function gera_lista_termos(index){
        let rowsHTML = ''; // String para construir HTM
          let somaTotal = 0
          // Verifica se index é um objeto único e não um array, e o converte para um array
          if (!Array.isArray(index)) {
            index = [index];
          }

          for(let i = 0; i < index.length; i++){
            rowsHTML += `
                    <div class="mb-3 row">
                      <label class="col-sm-3 col-form-label">${index[i].chave}</label>
                      <div class="col-sm-9">
                        <input class="form-control" type="text" data-chave='${index[i].chave}' value='${index[i].valor}'>
                      </div>
                    </div>
            `
          }


          return rowsHTML
}


function add_terms(){
    let body = document.getElementById('body_termos')

    let divRow = document.createElement('div');
    divRow.className = 'mb-3 row';

    let label = document.createElement('label');
    label.className = 'col-sm-3 col-form-label';
    label.textContent = 'Novo termo';
    divRow.appendChild(label);

    let divCol = document.createElement('div');
    divCol.className = 'col-sm-9';
    divRow.appendChild(divCol);

    let input = document.createElement('input');
    input.className = 'form-control';
    input.type = 'text';
    input.setAttribute('data-chave', 'novo_termo');
    divCol.appendChild(input);

    // Cria o botão de excluir
    let deleteButton = document.createElement('button');
    deleteButton.textContent = 'Excluir';
    deleteButton.onclick = delete_termo;
    deleteButton.className = 'btn btn-danger mt-1'; 
    deleteButton.innerHTML = '<i class="fa fa-trash"></i>'; 
    divCol.appendChild(deleteButton);

    body.appendChild(divRow);
}

// Função para excluir um termo
function delete_termo(event) {
    // Remove o elemento pai do botão (a div da linha)
    event.target.parentNode.parentNode.remove();
}

