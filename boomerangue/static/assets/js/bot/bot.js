// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

"use strict";
var create = function(){


    var init = function(){

        var form = document.getElementById("create_bot_form");

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

        function fetchApi (){
            
          const form_data = new FormData(document.querySelector("#create_bot_form"));
          const data = Object.fromEntries(form_data.entries());
          swal({
            title: 'Carregando...',
            icon: 'info',
            button: false,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });
              console.log(data)
              fetch('api/bots/',{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
              })
              .then((response) => response.json())
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
              .catch(e=>{
                swal({
                  text: "Ocorreu um erro ao tentar salvar" ,
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                      confirmButton: "btn btn-primary"
                  }
              });
              })
              .finally(()=>{
                swal.close()
              })
        }


        // var formCanal = document.getElementById("submit-new-canal");

        // formCanal.addEventListener('submit', function(event) {
        //     if (formCanal.checkValidity() === false) {
        //         event.preventDefault();
        //         event.stopPropagation();
        //     }
        //     else{
        //         event.preventDefault();
        //         event.stopPropagation();
        //         fetchApiBotCanal();
  
        //     }
        //     formCanal.classList.add('was-validated');
        // }, false);
  
  
        //   function fetchApiBotCanal (){
              
              
        //       const data = {
        //           canal: $(".canal").val() || '',
        //           provedor:$(".provedor_id").val() || '',
        //           canal_ativo:$(".canal_ativo").val(),
        //           // Outros campos e valores aqui...
        //         };
        //         fetch('api/bot_canal/',{
        //           method: "POST",
        //           headers: {
        //               "Content-Type": "application/json",
        //               'X-csrftoken1': csrftoken,
        //           },
        //           body: JSON.stringify(data),
        //         }).then((response) => response.json())
        //         .then((data) => {
        //           if(data.id){
        //               swal({
        //                   icon: 'success',
        //                   title: 'Salvo com sucesso!',
        //                   showConfirmButton: false,
        //                   timer: 1500
        //                 }).then(
                          
        //                       //window.location.reload()
        //                 )
  
                        
        //           }
        //           else{
        //               swal({
        //                   text: "Ocorreu um erro ao tentar salvar" ,
        //                   icon: "error",
        //                   buttonsStyling: false,
        //                   confirmButtonText: "Ok",
        //                   customClass: {
        //                       confirmButton: "btn btn-primary"
        //                   }
        //               });
        //           }
                  
        //         })
        //   }
  

    }
    return {
        init: function() {
            init();
            Inputmask({ mask: '99.99' }).mask($('input[name="taxa_crescimento"]'));
            Inputmask({ mask: '99.99' }).mask($('#taxa_crescimento'));
            Inputmask({ mask: '+55 (99)99999-9999' }).mask($('#test-numero-destino'))
        }
    };
}()

create.init();



  (function ($) {
    $(".contact-editform").hide();
  })(jQuery);
  

$('#editModal').each(function() {
  $(this).on('show.bs.modal', function (event) {
    var clickedElement = $(event.relatedTarget); // Clicked element
    var botId = clickedElement.data('id') || clickedElement.closest('[data-id]').data('id'); // Extract data-id attribute from th
    editContact(botId);
  });
});

  // edit contact
  
  function editContact(index) {
    swal({
      icon: 'info', // Altere para "info" ou qualquer outro ícone conforme sua preferência
      title: 'Carregando...', // Adicione um GIF de carregamento aqui
      button: false,
      showConfirmButton: false,
      willOpen: () => {
        Swal.showLoading(); // Mostra o loader antes do conteúdo ser renderizado
      },
      allowOutsideClick: false, // Impede cliques no fundo durante o carregamento
    })
    $("#v-pills-tabContent").hide();
    $(".contact-editform").show();
    $(".update-contact").data("id", index);
    fetch(`api/bots/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
      .then(data => {
		  if (data) {
			  $("#edit_bot").val(data.bot)
        $("#edit_bot_apelido").val(data.bot_apelido)
        $("#edit_bot_numero").val(data.bot_numero)
        $("#edit_bot_ativo").val(data.bot_ativo).trigger('change')
        $("#edit_bot_passivo").val(data.bot_passivo).trigger('change')
			  $("#edit_bot_tipo").val(data.bot_tipo).trigger('change')
			  if (data.webhook_ativo === "S") {
				  $("#webhook_ativo").prop("checked", true)
			  } else {
				  $("#webhook_ativo").prop("checked", false)
			  }
			  $("#url_webhook").val(data.url_webhook)
        $("#bot_padrao").val(data.bot_padrao).trigger('change')
        $("#bot_provedor").val(data.bot_provedor).trigger('change')
        
        $("#limite_diario").val(data.limite_diario)
        $("#limite_semanal").val(data.limite_semanal)
        $("#limite_envio_plataforma").val(data.limite_envio_plataforma)
        if(data.taxa_crescimento.length == 4){
          $("#taxa_crescimento").val('0'+data.taxa_crescimento)
        }
        else{
          $("#taxa_crescimento").val(data.taxa_crescimento)
        }
      }
        else{
            swal({
                title: "Houve um erro ao tentar buscar informações",
                icon: "error",
                dangerMode: true,
              })
        }
    })
    .catch(error => {
        swal({
            title: `Houve um erro ao tentar buscar informações ${error}`,
            icon: "error",
            dangerMode: true,
          })
    })
  
  }

function apenasNumeros(numero) {
    return numero.replace(/\D/g, '');
}


function abrirModalTeste(id, edi) {
  document.getElementById("submit-test-bot").dataset.id = id
  document.getElementById("submit-test-bot").dataset.edi = edi

}

$("#submit-test-bot").on('click', (e) => {
  swal({
    title: 'Aguarde...',
    icon: 'info',
    button: false,
    closeOnClickOutside: false,
    closeOnEsc: false,
  });
  var edi = document.getElementById('submit-test-bot').dataset.edi;
  console.log("EDI", edi)
  var destino = apenasNumeros($("#test-numero-destino").val());
  var text_message = $("#test-text-message").val();
  fetch(`api/messages/send-text/${edi}/`, {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body: JSON.stringify({
      text_message: text_message,
      number: destino
    })
  })
    .then((res) => res.json())
    .then((res) => {
      console.log('RESPONSE', res)
      if (res.success) {
        swal({
          title: 'Mensagem enviada!',
          icon: 'success',
          closeButton: true,
          closeOnClickOutside: false,
          closeOnEsc: false,
        });
      } else {
        swal({
          title: 'Mensagem não enviada!',
          icon: 'error',
          closeButton: true,
          closeOnClickOutside: false,
          closeOnEsc: false,
        });
      }
    }).catch((error) => {
      swal({
        title: `Houve um error: ${error}`,
        icon: 'error',
        closeButton: true,
        closeOnClickOutside: false,
        closeOnEsc: false,
      });
    })
})
  

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
          swal({
            title: 'Carregando...',
            icon: 'info',
            button: false,
            closeOnClickOutside: false,
            closeOnEsc: false,
          });
        fetch(`/api/bots/${index}/`,{
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
          swal({
            title: "Erro",
            text: "Houve um erro ao tentar excluir!",
            icon: "error",
            button: "OK",
            });
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
    swal({
      title: 'Carregando...',
      icon: 'info',
      button: false,
      closeOnClickOutside: false,
      closeOnEsc: false,
    });
    
    $("#v-pills-tabContent").show();
    $(".contact-editform").hide();
     var index = $(".update-contact").data('id')
    
     const newdata = {
        bot: $("#edit_bot").val() || null,
        bot_apelido:$("#edit_bot_apelido").val() || null,
        bot_numero:$("#edit_bot_numero").val() || null,
        bot_ativo:$("#edit_bot_ativo").val() || null,
        bot_passivo:$("#edit_bot_passivo").val() || null,
        bot_tipo: $("#edit_bot_tipo").val() || null,
        webhook_ativo: $("#webhook_ativo").val() || 'N',
        url_webhook: $("#url_webhook").val() || '',
        bot_provedor: $("#bot_provedor").val() || null,
        legenda_1: $('#legenda_1').val() || null,
        legenda_2: $('#legenda_2').val() || null,
        legenda_3: $('#legenda_3').val() || null,
        legenda_4: $('#legenda_4').val() || null,
        limite_diario: $("#limite_diario").val() || 100,
        limite_semanal: $("#limite_semanal").val() || 500,
        taxa_crescimento: $("#taxa_crescimento").val() || "01.20",
        limite_envio_plataforma: $('#limite_envio_plataforma').val() || 0,
        bot_padrao: $("#bot_padrao").val()

      };

    fetch(`/api/bots/${index}/`, {
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
        swal({
          title: "Erro",
          text: "Houve um erro ao tentar salvar!",
          icon: "error",
          button: "OK",
        });
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
  
  $('#webhook_ativo').each(function () {
    $(this).on('change', function (e) {
      var checkboxValue = $(this).prop('checked') ? 'S' : 'N';
      e.target.value = checkboxValue
    });
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
  

$('#bot_provedor').on('change', async function(e){
  let id = e.target.value
  let data = await retorna_data(id)
  fetch_legendas(data, edit = true)
})

$('#bot_provedor_new').on('change', async function(e){
  let id = e.target.value
  let data = await retorna_data(id)
  fetch_legendas(data, edit = false)
})


async function retorna_data(id){
  let dados;
  await fetch(`api/bot_provedor/${id}/`,{
    method: 'GET',
    headers: {
      'Content-Type': 'application/json', // Indica o tipo de conteúdo
      'X-CSRFToken': csrftoken,
    }
  })
  .then(res=>res.json())
  .then(data=>{
    dados = data
  })
  return dados;
}


function fetch_legendas(index, edit){
  
  let legendas = edit ? document.getElementById('legendas_edit') : document.getElementById('legendas')
  legendas.innerHTML = ''
  let divs = '';
  
  if (index.legenda_1) {
    divs += `
      <div class="col m-b-20">
        <label for="legenda_1">${index.legenda_1}</label>
        <input class="form-control " type="text"  ${edit ? 'id="legenda_1"' : 'name="legenda_1"'}  required="" maxlength="100" autocomplete="off">
      </div>
    `;
  }

  if (index.legenda_2) {
    divs += `
      <div class="col m-b-20">
        <label for="legenda_2">${index.legenda_2}</label>
        <input class="form-control " type="text"  ${edit ? 'id="legenda_2"' : 'name="legenda_2"'}  required="" maxlength="100" autocomplete="off">
      </div>
    `;
  }

  if (index.legenda_3) {
    divs += `
      <div class="col m-b-20">
        <label for="legenda_3">${index.legenda_3}</label>
        <input class="form-control " type="text"  ${edit ? 'id="legenda_3"' : 'name="legenda_3"'}  required="" maxlength="100" autocomplete="off">
      </div>
    `;
  }

  if (index.legenda_4) {
    divs += `
      <div class="col m-b-20">
        <label for="legenda_4">${index.legenda_4}</label>
        <input class="form-control " type="text"  ${edit ? 'id="legenda_4"' : 'name="legenda_4"'}  required="" maxlength="100" autocomplete="off">
      </div>
    `;
  }

  legendas.innerHTML = divs;
  
  if(edit){
    let id =  $(".update-contact").data("id");
    fetch(`api/bots/${id}/`)  // Substitua pela URL correta do seu endpoint de detalhes
      .then(response => response.json())
        .then(data => {
          if (data) {
              $('#legenda_1').val(data.legenda_1)
              $('#legenda_2').val(data.legenda_2)
              $('#legenda_3').val(data.legenda_3)
              $('#legenda_4').val(data.legenda_4)
          }
        })
        .finally(()=>{
          swal.close()
        })
  }

}
