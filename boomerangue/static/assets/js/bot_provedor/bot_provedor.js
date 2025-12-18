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
                  provedor: $(".provedor").val() || '',
                  email: $(".email").val() || '',
                  whatsapp: $(".whatsapp").val(),
                  sms: $(".sms").val(),
                  provedor_ativo: $(".provedor_ativo").val(),
                  legenda_1: $(".legenda_1").val() || null,
                  legenda_2: $(".legenda_2").val() || null,
                  legenda_3: $(".legenda_3").val() || null,
                  legenda_4: $(".legenda_4").val() || null,
                  provedor_teste: $('.provedor_teste').val() || null,
                  provedor_padrao: $('.provedor_padrao').val() || null,
                  parametro_1: $('.parametro_1').val() || null,
                  parametro_2: $('.parametro_2').val() || null,
                  parametro_3: $('.parametro_3').val() || null,
                  secret_1: $('.secret_1').val() || null,
                  secret_2: $('.secret_2').val() || null,
                  secret_3: $('.secret_3').val() || null,
                  NroNovoLimiteDiario: $('.NroNovoLimiteDiario').val() || 50,
                  NroNovoLimiteHora: $('.NroNovoLimiteHora').val() || 10,
                  NroNovoLimiteMinuto: $('.NroNovoLimiteMinuto').val() || 1,
                  NroNovoIntervaloMininoMin: $('.NroNovoIntervaloMininoMin').val() || 5,
                  NroNovoIntervaloMininoMax: $('.NroNovoIntervaloMininoMax').val() || 9,
                  LimiteDiario: $('.LimiteDiario').val() || 200,
                  LimiteHora: $('.LimiteHora').val() || 120,
                  LimiteMinuto: $('.LimiteMinuto').val() || 2,
                  IntervaloMininoMin: $('.IntervaloMininoMin').val() || 3,
                  IntervaloMininoMax: $('.IntervaloMininoMax').val() || 6,
                  provedor_url_api: $('.provedor_url_api').val() || null,
              };
        
              fetch('api/bot_provedor/',{
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
    $('.contact-editform input, .contact-editform select').prop('disabled', false);
    fetch(`api/bot_provedor/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
          if(data){
            console.log(data)
            $("#provedor").val(data.provedor)
            $("#email").val(data.email).trigger("change")
            $("#whatsapp").val(data.whatsapp).trigger('change')
            $("#sms").val(data.sms).trigger('change')
            $("#provedor_ativo").val(data.provedor_ativo).trigger('change')
            $("#legenda_1").val(data.legenda_1)
            $("#legenda_2").val(data.legenda_2)
            $("#legenda_3").val(data.legenda_3)
            $("#legenda_4").val(data.legenda_4)
            $("#provedor_padrao").val(data.provedor_padrao).trigger('change')
            $("#parametro_1").val(data.parametro_1)
            $("#parametro_2").val(data.parametro_2)
            $("#parametro_3").val(data.parametro_3)
            $("#secret_1").val(data.secret_1)
            $("#secret_2").val(data.secret_2)
            $("#secret_3").val(data.secret_3)
            $("#NroNovoLimiteDiario").val(data.NroNovoLimiteDiario)
            $("#NroNovoLimiteHora").val(data.NroNovoLimiteHora)
            $("#NroNovoLimiteMinuto").val(data.NroNovoLimiteMinuto)
            $("#NroNovoIntervaloMininoMin").val(data.NroNovoIntervaloMininoMin)
            $("#NroNovoIntervaloMininoMax").val(data.NroNovoIntervaloMininoMax)
            $("#LimiteDiario").val(data.LimiteDiario)
            $("#LimiteHora").val(data.LimiteHora)
            $("#LimiteMinuto").val(data.LimiteMinuto)
            $("#IntervaloMininoMin").val(data.IntervaloMininoMin)
            $("#IntervaloMininoMax").val(data.IntervaloMininoMax)
            $('#provedor_url_api').val(data.provedor_url_api)
            if($("#provedor_teste")){
                $("#provedor_teste").val(data.provedor_teste).trigger('change')
            }
            if(data.empresa != id_empresa){
                $('.contact-editform input, .contact-editform select').prop('disabled', true);
            }
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
        fetch(`api/bot_provedor/${index}`,{
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
    console.log($('#provedor_padrao').val())
     const newdata = {
      provedor: $("#provedor").val() || '',
      email: $("#email").val() || '',
      whatsapp: $("#whatsapp").val(),
      sms: $("#sms").val(),
      provedor_ativo: $("#provedor_ativo").val(),
      legenda_1: $("#legenda_1").val() || null,
      legenda_2: $("#legenda_2").val() || null,
      legenda_3: $("#legenda_3").val() || null,
      legenda_4: $("#legenda_4").val() || null,
      provedor_teste: $('#provedor_teste').val() || null,
      provedor_padrao: $('#provedor_padrao').val() || null,
      parametro_1: $('#parametro_1').val() || null,
      parametro_2: $('#parametro_2').val() || null,
      parametro_3: $('#parametro_3').val() || null,
      secret_1: $('#secret_1').val() || null,
      secret_2: $('#secret_2').val() || null,
      secret_3: $('#secret_3').val() || null,
      NroNovoLimiteDiario: $('#NroNovoLimiteDiario').val() || 50,
      NroNovoLimiteHora: $('#NroNovoLimiteHora').val() || 10,
      NroNovoLimiteMinuto: $('#NroNovoLimiteMinuto').val() || 1,
      NroNovoIntervaloMininoMin: $('#NroNovoIntervaloMininoMin').val() || 5,
      NroNovoIntervaloMininoMax: $('#NroNovoIntervaloMininoMax').val() || 9,
      LimiteDiario: $('#LimiteDiario').val() || 200,
      LimiteHora: $('#LimiteHora').val() || 120,
      LimiteMinuto: $('#LimiteMinuto').val() || 2,
      IntervaloMininoMin: $('#IntervaloMininoMin').val() || 3,
      IntervaloMininoMax: $('#IntervaloMininoMax').val() || 6,
      provedor_url_api: $('#provedor_url_api').val() || null,
  };
  
    console.log(newdata)

    fetch(`api/bot_provedor/${index}/`, {
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
              })
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
  