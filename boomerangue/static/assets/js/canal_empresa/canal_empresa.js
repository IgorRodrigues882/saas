// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;


"use strict";
var create = function(){

    var forms;
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
                    fetchApi();

                }
                form.classList.add('was-validated');
            }, false);
        });

        function fetchApi (){
            
            
            const data = {
                canal: $(".canal_id").val() || '',
                bot:$(".bot_id").val() || '',
                bcc_ativo:$(".bcc_ativo").val(),
                key1:$(".key1").val(),
                key2:$(".key3").val(),
                key3:$(".key3").val(),
                key4:$(".key3").val(),
                limite_diario:$("#limite_diario").val() || '100',
                limite_semanal:$("#limite_semanal").val() || '500',
                taxa_crescimento_semanal:$("#taxa_crescimento_semanal").val() || '1',

                // Outros campos e valores aqui...
              };
              fetch('api/bot_canalempresa/',{
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

create.init();



  (function ($) {
    $(".contact-editform").hide();
  })(jQuery);
  


  

  // edit contact
  
  function editContact(index) {
    $("#v-pills-tabContent").hide();
    $(".contact-editform").show();
    $(".update-contact").data("id", index);
    fetch(`api/bot_canalempresa/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
        if(data){
            $("#canal_id").val(data.canal).trigger("change")
            $("#bot_id").val(data.bot).trigger("change")
            $("#bcc_ativo").val(data.bcc_ativo).trigger('change')
            $("#key1").val(data.key1)
            $("#key2").val(data.key2)
            $("#key3").val(data.key3)
            $("#key4").val(data.key4)
            $("#limite_diario").val(data.limite_diario)
            $("#limite_semanal").val(data.limite_semanal)
            $("#taxa_crescimento_semanal").val(data.taxa_crescimento_semanal)
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
        fetch(`api/bot_canalempresa/${index}`,{
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
        canal: $("#canal_id").val() || '',
        bot:$("#bot_id").val() || '',
        bcc_ativo:$("#bcc_ativo").val(),
        key1:$("#key1").val(),
        key2:$("#key3").val(),
        key3:$("#key3").val(),
        key4:$("#key3").val(),
        limite_diario:$("#limite_diario").val() || '',
        limite_semanal:$("#limite_semanal").val() || '',
        taxa_crescimento_semanal:$("#taxa_crescimento_semanal").val() || '',
        // Outros campos e valores aqui...
      };

    fetch(`api/bot_canalempresa/${index}/`, {
        method: 'PATCH', // Use 'PATCH' para atualizações parciais
        headers: {
          'Content-Type': 'application/json', // Indica o tipo de conteúdo
          'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify(newdata), // Novos dados em formato JSON
      })
      .then(response => response.json())
      .then(data => {
        console.log(data)
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
                text: "Houve um erro ao tentar salvar!",
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
  
  