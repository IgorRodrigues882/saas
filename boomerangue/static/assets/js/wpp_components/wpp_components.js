// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;


"use strict";
var create_componente = function(){

    var forms;
    var init = function(){
      Dropzone.options.importimagewhatsapp = {
        paramName: "importimagewhatsapp",
        maxFiles: 1,
        maxFilesize: 5,
        acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
        autoProcessQueue: false, // Desativar o envio automático
        init: function() {
            var myDropzone = this; 
            this.on("success", function(file, response) {
            // Lógica a ser executada após o upload bem-sucedido, se necessário
            console.log(response);
            });
            this.on("addedfile", function(file) {
                // Cria um botão de exclusão
                var removeButton = Dropzone.createElement("<button class='dz-remove'>Remover imagem</button>");
                
                // Ouve o evento de clique no botão de exclusão
                removeButton.addEventListener("click", function(e) {
                  e.preventDefault();
                  e.stopPropagation();
    
                  // Remove o arquivo usando a referência armazenada à instância do Dropzone
                  myDropzone.removeFile(file);
                });
    
                // Adiciona o botão de exclusão ao arquivo de visualização
                file.previewElement.appendChild(removeButton);
            });
        }
        };
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
                template: $(".template").val() || null,
                component_type:$(".component_type").val() || null,
                format:$(".format").val() || null,
                text_content:$(".text_content").val() || null,
                // Outros campos e valores aqui...
              };

              if($(".template").val() == "" ||  $(".component_type").val() == "" || $(".format").val() == ""){
                swal({
                  text: "Preencha todos os campos" ,
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                      confirmButton: "btn btn-primary"
                  }
                  
              });
              return;
              }
              fetch('api/wpp_templatescomponents/',{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
              }).then((response) => response.json())
              .then((data) => {
                console.log(data)
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
                        text: data.error ,
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

create_componente.init();



  (function ($) {
    $(".contact-editform").hide();
  })(jQuery);
  

  

  // edit contact
  
  function editContact(index) {
    $("#v-pills-tabContent").hide();
    $(".contact-editform").show();
    $(".update-contact").data("id", index);
    fetch(`api/wpp_templatescomponents/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
        if(data){
            $("#template").val(data.template).trigger('change')
            $("#component_type").val(data.component_type).trigger('change')
            $("#format").val(data.format).trigger('change')
            $("#text_content").val(data.text_content)
        }
        else{
            swal({
                title: "Houve um erro ao tentar buscar informações",
                icon: "Error",
                dangerMode: true,
              })
        }
    })
    .catch(error => {
        swal({
            title: "Houve um erro ao tentar buscar informações",
            icon: "Error",
            dangerMode: true,
          })
    });
  
  }
  
  // print contact
  
  function printContact(index) {
    var print_name = $(".first_name_" + index).html();
    var plast_name = $(".last_name_" + index).html();
    var pemail_add = $(".email_add_" + index).html();
    var update_img = $(".update_img_" + index).attr("src");
    $("#printname").html(print_name);
    $("#printlast").html(plast_name);
    $("#printmail").html(pemail_add);
    $("#mailadd").html(pemail_add);
    $("#updateimg").attr("src", update_img);
  }
  
  // delete
  function deleteContact(index) {
    swal({
      title: "Tem certeza?",
      text: "Tem certeza que deseja excluir esse Provedor?",
      icon: "warning",
      buttons: true,
      dangerMode:true
      }).then((willDelete)=>{
        if(willDelete){
        fetch(`api/wpp_templatescomponents/${index}`,{
          method:"DELETE",
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
            },
        }).then(response=>{
          if (response.status === 204) {
            swal({
              icon: 'success',
              title: 'Excluido!',
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
  function activeDiv(index) {
    $(".contacts-tabs .nav-link ").removeClass("active show");
    $(".contacts-tabs .tab-content .tab-content-child ").removeClass(
        "active show"
      );
    $(".contact-tab-" + index).addClass("active show");
  }
  
  // upload images
  
  function readURL(input, index) {
    // console.log(input.files[0]);
    var elems = document.getElementsByClassName("update_img_" + index);
    for (i = 0; i < elems.length; i++) {
      elems[i].src = window.URL.createObjectURL(input.files[0]);
    }
  }
  

  $(".update-contact").on("click", function (e) {
    $("#v-pills-tabContent").show();
    $(".contact-editform").hide();
     var index = $(".update-contact").data('id')
    
     const newdata = {
        template: $("#template").val() || null,
        component_type:$("#component_type").val() || null,
        format:$("#format").val() || null,
        text_content:$("#text_content").val() || null,
        // Outros campos e valores aqui...
      };

    fetch(`api/wpp_templatescomponents/${index}/`, {
        method: 'PATCH', // Use 'PATCH' para atualizações parciais
        headers: {
          'Content-Type': 'application/json', // Indica o tipo de conteúdo
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(newdata), // Novos dados em formato JSON
      })
      .then(response => response.json())
      .then(data => {
        if(data.id){
            swal({
                icon: 'success',
                title: 'Atualizado!',
                showConfirmButton: false,
                timer: 1500
              }).then(
                window.location.reload()
              )
        }
        else{
            swal({
                title: "Erro",
                text: data.error,
                icon: "error",
                button: "OK",
              });
        }
      })
      .catch(error => {
        console.error('Erro ao atualizar dados:', error);
      });
  });
  
  $(".edit-information").on("click", function (e) {
    $(".edit-information").hide();
  });

  $("#cancel_edit").on("click", function (e) {
    $("#v-pills-tabContent").show();
    $(".contact-editform").hide();
  });
  
  // history
  
  function history(index) {
    $("#right-history").toggleClass("show");
  }
  
  $(".closehistory").click(function () {
    $("#right-history").removeClass("show");
  });
  
  // print modal


  
  function printDiv() {
    var divToPrint = document.getElementById("DivIdToPrint");
  
    var newWin = window.open("", "Print-Window");
  
    newWin.document.open();
  
    newWin.document.write(
      '<html><body onload="window.print()">' +
        divToPrint.innerHTML +
        "</body></html>"
    );
  
    newWin.document.close();
  
    setTimeout(function () {
      newWin.close();
    }, 10);
  }
  