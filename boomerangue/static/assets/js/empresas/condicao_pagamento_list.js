
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;


  (function ($) {
    $(".contact-editform").hide();
    $(".more-data").hide();
    Inputmask('currency', {
        alias: 'numeric',
        suffix: '',
        radixPoint: ',',
        groupSeparator: '.',
        autoGroup: true,
        digits: 2,
        digitsOptional: false,
        placeholder: '0'
    }).mask($("#valor_minimo"))
  })(jQuery);
  
  // edit contact
  
  function editContact(index) {
    $("#v-pills-tabContent").hide();
    $(".contact-editform").show();
    $(".update-contact").data("id", index);
    fetch(`api/create-condPagamento/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
      console.log(data)
        if(data){
            var valorAtual = data.valor_minimo;
            var valorAjustado = valorAtual / 1;
            $("#condicoes_pagamento").val(data.condicoes_pagamento)
            $("#valor_minimo").val(valorAjustado.toFixed(2).replace(".", ","))
            $('#status_condicoes_pagamento').val(data.status_condicoes_pagamento)
            $('#NroParcelas').val(data.NroParcelas)
            $("#CondicaoPadrao").val(data.CondicaoPadrao)
            $("#CondicaoAtiva").val(data.CondicaoAtiva).trigger('change')
            $("#prazo_medio").val(data.prazo_medio)
            $("#EDI_Integracao").val(data.EDI_Integracao)
            $("#CodTipoDocumentoCobranca").val(data.CodTipoDocumentoCobranca)
            $("#CondicaoAmigavel").val(data.CondicaoAmigavel)
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
      text: "Tem certeza que deseja excluir essa empresa?",
      icon: "warning",
      buttons: true,
      dangerMode:true
      }).then((willDelete)=>{
        if(willDelete){
        fetch(`api/create-condPagamento/${index}`,{
          method:"DELETE",
          headers: {
            'Content-Type': 'application/json',
            // Você pode adicionar cabeçalhos de autenticação, se necessário
            },
        }).then(response=>{
          if (response.status === 204) {
            swal({
              icon: 'success',
              title: 'Cond Pagamento Excluida!',
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
  
function removeCurrencyFormatting(value) {
    // Remove o prefixo, separador de milhares e qualquer caractere não numérico
    var valor = value.replace(/[^0-9,-]/g, '').replace(',', '.');
    return parseFloat(valor)
}

  $(".update-contact").on("click", function (e) {
    $("#v-pills-tabContent").show();
    $(".contact-editform").hide();
     var index = $(".update-contact").data('id')
    console.log(removeCurrencyFormatting($("#valor_minimo").val()))
     const newdata = {
        condicoes_pagamento: $("#condicoes_pagamento").val() || '',
        valor_minimo:removeCurrencyFormatting($("#valor_minimo").val())|| '',
        NroParcelas:$("#NroParcelas").val(),
        CondicaoPadrao:$("#CondicaoPadrao").val() || '',
        CondicaoAtiva:$("#CondicaoAtiva").val() || '',
        prazo_medio:$("#prazo_medio").val() || '',
        CodTipoDocumentoCobranca:$("#CodTipoDocumentoCobranca").val() || '00',
        CondicaoAmigavel:$("#CondicaoAmigavel").val() || null,
        EDI_Integracao:$("#EDI_Integracao").val(),
        status_condicoes_pagamento:$("#status_condicoes_pagamento").val(),
        // Outros campos e valores aqui...
      };

    fetch(`api/create-condPagamento/${index}/`, {
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
                title: 'Condição de pagamento salva!',
                showConfirmButton: false,
                timer: 1500
              }).then(
                window.location.reload
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
    $(".more-data").show();
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
  
  