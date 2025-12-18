"use strict";
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

var method = '';
var url = '';

var grade = function(){

    var forms;
    var init = function(){

        
        var btn = document.getElementById("add_grade");
        var div_grade = document.getElementById("div_grades");
        var btn_exclude = document.getElementById("delete_grade");

        btn.addEventListener('click', function() {
            var inputElements = div_grade.getElementsByTagName("input");
            var lastInput = inputElements[inputElements.length - 1];
            if (parseInt(lastInput.dataset.cont) == 24) {
                btn.disabled = true;
            }
            var cont = parseInt(lastInput.dataset.cont) + 1;
            if (cont.toString().length < 2) {
                var id = 'Grade0' + cont;
            } else {
                var id = 'Grade' + cont;
            }

            // Criar uma nova div
            var newDiv = document.createElement('div');
            newDiv.className = "col-sm-2 m-b-20";

            // Criar um novo input
            var newInput = document.createElement('input');
            newInput.className = "form-control";
            newInput.id = id;
            newInput.dataset.cont = cont;
            newInput.type = "text";
            newInput.maxLength = 50;
            newInput.autocomplete = "off";

            // Anexar o novo input à nova div
            newDiv.appendChild(newInput);

            // Anexar a nova div ao contêiner div_grade
            div_grade.appendChild(newDiv);
        });

        btn_exclude.addEventListener('click', function(){
            if(btn.disabled){
                btn.disabled = false;
            }
            var inputElements = div_grade.getElementsByTagName("input");
            if (inputElements.length > 1) {
                var lastInput = inputElements[inputElements.length - 1];
                div_grade.removeChild(lastInput.parentElement); // Remove a div que contém o input
            }
        });

        var validation = Array.prototype.filter.call(forms, function(form) {
            form.addEventListener('submit', function(event) {
                if (form.checkValidity() === false) {
                    event.preventDefault();
                    event.stopPropagation();
                }
                else{
                    event.preventDefault();
                    event.stopPropagation();
                    fetchApi();

                }
                form.classList.add('was-validated');
            }, false);
        });


        function fetchApi (){
            
            const data = {
                Grade: $("#Grade").val() || '',
                NroInicial:$("#NroInicial").val() || null,
                NroFinal:$("#NroFinal").val() || null,
                // Outros campos e valores aqui...
              };
              for (let i = 1; i <= 25; i++) {
                const gradeKey = "Grade" + i.toString().padStart(2, '0');
                data[gradeKey] = $("#" + gradeKey).val() || '';
              }
              fetch(url,{
                method: method,
                credentials: 'include',
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
              }).then((response) => response.json())
              .then((data) => {
                console.log(data)
                if(data.id){
                    Swal.fire({
                        icon: 'success',
                        title: 'Salvo com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                      }).then((result)=>{
                        if(result){
                            window.location.reload();
                        }
                      })

                      
                }
                else{
                    Swal.fire({
                        text: "Ocorreu um erro ao tentar salvar" ,
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                }
                
              })
        }

    }
    return {
        init: function() {
            forms = document.getElementsByClassName('needs-validation');
            init();
        }
    };
}()

grade.init()



function delete_grade(id){
    new swal({
        title: "Tem certeza?",
        text: "Tem certeza que deseja excluir essa grade?",
        icon: "warning",
        showCancelButton: true,  // Mostrar botão "Cancelar"
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sim',
        cancelButtonText: 'Não',
        }).then((result)=>{
          if(result.isConfirmed){
          fetch(`api/ger_grade/${id}/`,{
            method:"DELETE",
            headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
              },
          }).then(response=>{
            if (response.status === 204) {
              new swal({
                icon: 'success',
                title: 'Grade Excluída!',
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
          }).catch(error => {
            console.error('Erro ao enviar a solicitação:', error);
            });
          
        }
      })
}

function newgrade(){
    method = 'POST';
    url = 'api/ger_grade/'
    limpar_inputs();
    $("#Grade").val('');
    $("#NroInicial").val('');
    $("#NroFinal").val('');
    $("#Grade01").val('')
}


function limpar_inputs() {
    var div_grade = document.getElementById("div_grades");
    var inputElements = div_grade.getElementsByTagName("input");
    var elementsToRemove = [];

    for (var i = 1; i < inputElements.length; i++) {
        // Adiciona os elementos à lista de elementos a serem removidos
        elementsToRemove.push(inputElements[i].parentElement);
    }

    // Remove os elementos da lista de elementos a serem removidos
    for (var i = 0; i < elementsToRemove.length; i++) {
        div_grade.removeChild(elementsToRemove[i]);
    }
}


function editar_grade(id){
    method = 'PATCH';
    url = `api/ger_grade/${id}/`;
    limpar_inputs();
    fetch(`api/ger_grade/${id}/`,{
        method:"GET",
        headers: {
              'Content-Type': 'application/json',
              'X-CSRFToken': csrftoken,
        },
    }).then((res)=>res.json())
    .then((res)=>{
        if (res.id) {
            var div_grade = document.getElementById("div_grades");
            $("#Grade").val(res.Grade);
            $("#NroFinal").val(res.NroFinal);
            $("#NroInicial").val(res.NroInicial);
            $("#Grade01").val(res.Grade01);
        
            for (let i = 2; i <= 25; i++) {
                const gradeKey = "Grade" + i.toString().padStart(2, '0');
                var result = res[gradeKey];

                if (result) {
                    // Criar uma nova div
                    var newDiv = document.createElement('div');
                    newDiv.className = "col-sm-2 m-b-20";
        
                    // Criar um novo input
                    var newInput = document.createElement('input');
                    newInput.className = "form-control";
                    newInput.id = gradeKey;
                    newInput.dataset.cont = i;
                    newInput.value = result;
                    newInput.type = "text";
                    newInput.maxLength = 50;
                    newInput.autocomplete = "off";
        
                    // Anexar o novo input à nova div
                    newDiv.appendChild(newInput);
        
                    // Anexar a nova div ao contêiner div_grade
                    div_grade.appendChild(newDiv);
                    if(i == 25){
                        var btn = document.getElementById("add_grade");
                        btn.disabled = true
                    }
                }
            }
        }
        else{
            new swal({
                title: "Erro",
                text: "Houve um erro ao tentar buscar dados!",
                icon: "error",
                button: "OK",
                });
        }
    })
}