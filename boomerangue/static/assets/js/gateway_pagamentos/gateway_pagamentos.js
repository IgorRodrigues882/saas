// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;


"use strict";
var create = function(){

    var forms;
    let url;
    let method;
    var init = function(){


      var validation = Array.prototype.filter.call(forms, function(form) {
        form.addEventListener('submit', function(event) {
            if (form.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
            }
            else{
                event.preventDefault();
                event.stopPropagation();
                fetchApigateway();

            }
            form.classList.add('was-validated');
        }, false);
    });


        function verificaNomeArquivo(nomeArquivo) {
            // Regex para caracteres especiais
            var regex = /[^a-zA-Z0-9\-_.]/g;
        
            // Encontra todos os caracteres especiais no nome do arquivo
            var caracteresEspeciais = nomeArquivo.match(regex);
        
            if (caracteresEspeciais) {
                return "Erro: Não pode haver 'espaço' ou caracteres especiais no nome do arquivo: " + caracteresEspeciais.join(", ") +" Por favor renomeie-os antes de continuar.";
            } else {
                return true;
            }
        }
        function fetchApigateway (){
            let btn = document.getElementById("save_gateway")
            if(btn.dataset.id){
                method = 'PATCH'
                url = `api/gatewayPagamento/${btn.dataset.id}/`
            }
            else{
                method = "POST"
                url = 'api/gatewayPagamento/'
            }
            swal({
                title: 'Aguarde',
                text: 'Por favor, espere...',
                icon: 'info',
                allowOutsideClick: false,
                showConfirmButton: false,
                willOpen: () => {
                    Swal.showLoading()
                }
            });
            const data = new FormData()
            let file1 = document.getElementById("certificados")
            let file2 = document.getElementById("certificados_senhas")
            data.append('gateway_name', $("#gateway_name").val())
            data.append('gateway_type', $("#gateway_type").val())
            data.append('pix_key', $("#pix_key").val() || null)
            data.append('dev_key', $("#dev_key").val() || null)
            data.append("client_id", $("#client_id").val() || null)
            data.append("client_secret", $("#client_secret").val() || null)
            data.append("expiration_time", parseInt($("#expiration_time").val()) || null)
            if (file1.files.length > 0) {
                let result = verificaNomeArquivo(file1.files[0].name)
                if (result != true){
                    swal({
                        text: result,
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    return
                }
                else{
                    data.append('certificados', file1.files[0]);
                }
            }

            if (file2.files.length > 0) {
                let result = verificaNomeArquivo(file2.files[0].name)
                if (result != true){
                    swal({
                        text: result,
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    return
                }
                else{
                    data.append('certificados_senhas', file2.files[0]);
                }
            }

        
              fetch(url,{
                method: method,
                headers: {
                    // "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: data,
              }).then((response) => response.json())
              .then((data) => {
                if(data.id){
                    swal({
                        icon: 'success',
                        title: 'Salvo com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                      }).then(
                        
                        window.location.reload()
                      )

                      
                }
                else{
                    swal({
                        text: "Ocorreu um erro ao tentar salvar: " + data.error ,
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

create.init();

function editar_gateway(index){
    document.getElementById("save_gateway").dataset.id = index
    $('#dev_key').removeAttr('required');
    $('#client_id').removeAttr('required');
    $('#client_secret').removeAttr('required');
    swal({
        title: 'Aguarde',
        text: 'Por favor, espere...',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    });
    fetch(`api/gatewayPagamento/${index}/`)
    .then(res=>res.json())
    .then(data=>{
        console.log(data)
        $("#gateway_name").val(data.gateway_name)
        $("#gateway_type").val(data.gateway_type).trigger('change')
        $("#pix_key").val(data.pix_key)
        $("#dev_key").val(data.dev_key)
        $("#client_id").val(data.client_id)
        $("#client_secret").val(data.client_secret)
        $("#expiration_time").val(data.expiration_time)

        if(data.certificados){
            $('#certificados').removeAttr('required');
            fetch('api/gatewayPagamento/gera_url_temporaria/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    object: data.certificados_url
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data)
                $("#certificados_a_tag").attr('href', data);
            })
            $("#certificados_a").removeClass('d-none')

        }


        if(data.certificados_senhas){
            $("#certificados_senhas").removeAttr('required')
            fetch('api/gatewayPagamento/gera_url_temporaria/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Substitua 'YourAuthToken' pelo token de autenticação do usuário
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify({
                    // Substitua 'bucketName' e 'objectName' pelos valores apropriados
                    object: data.certificados_senhas_url
                })
            })
            .then(response => response.json())
            .then(data => {
                console.log(data)
                $("#certificados_senhas_a_tag").attr('href', data);
            })
            $("#certificados_senhas_a").removeClass('d-none')
        }

    })
    .then(()=>{
        swal.close()
    })
    .catch(error=>{
        swal({
            text: "Ocorreu um erro ao tentar Buscar dados" ,
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
                confirmButton: "btn btn-primary"
            }
        });
    })

}

function new_gateway(){
    document.getElementById("save_gateway").dataset.id = ""
    $("#gateway_name").val("")
    $("#gateway_type").val("").trigger('change')
    $("#certificados_a").addClass('d-none')
    $("#certificados_senhas_a").addClass('d-none')
    $('#dev_key').attr('required', true).val("");
    $('#client_id').attr('required', true).val("");
    $('#client_secret').attr('required', true).val("");
    $("#expiration_time").val("");

}
  
function mostrarSenha(inputId) {
    var input = document.getElementById(inputId);
    input.type = 'text';
  }
  
  function ocultarSenha(inputId) {
    var input = document.getElementById(inputId);
    input.type = 'password';
  }
  
  
  // delete
  function delete_gateway(index) {
    swal({
      title: "Tem certeza?",
      text: "Tem certeza que deseja excluir esse Gateway de pagamento?",
      icon: "warning",
      buttons: true,
      dangerMode:true
      }).then((willDelete)=>{
        if(willDelete){
        fetch(`api/gatewayPagamento/${index}`,{
          method:"DELETE",
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
            },
        }).then(response=>{
          if (response.status === 204) {
            swal({
              icon: 'success',
              title: 'gateway Excluido!',
              buttons: false,
              timer: 1500
              }).then(
                window.location.reload()
              )
            }
            else {
            swal({
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
    // var el = $('contact-tab-'+index);
    // el.addClass('delete-contact');
  }
  
  
  

 
  