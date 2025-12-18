  
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;


  (function ($) {
    $(".contact-editform").hide();
    $(".more-data").hide();
    Inputmask({ mask: '(99) 99999-9999' }).mask($("#TelefoneVendedor"));
    Inputmask('currency', {
      alias: 'numeric',
      suffix: '',
      radixPoint: ',',
      groupSeparator: '.',
      autoGroup: true,
      digits: 2,
      digitsOptional: false,
      placeholder: '0'
  }).mask($("#ComissaoVenda"))
  })(jQuery);
  
  // edit contact
  
  function editContact(index) {
    $("#v-pills-tabContent").hide();
    $(".contact-editform").show();
    $(".update-contact").data("id", index);
    fetch(`api/create-vendedor/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
        if(data){
          var valorAtual = data.ComissaoVenda;
          var valorAjustado = valorAtual / 1;
          $("#Vendedor").val(data.Vendedor);
          $("#empresa_id").val(data.empresa).trigger('change');
          $("#Integracao_EDI").val(data.Integracao_EDI);
          $("#Integracao_EDI2").val(data.Integracao_EDI2);
          $("#CodigoVendedor").val(data.CodigoVendedor);
          $("#VendedorBM").val(data.VendedorBM);
          $("#VendedorOriginal").val(data.VendedorOriginal);
          $("#Apelido").val(data.Apelido);
          $("#LegendaVendedor").val(data.LegendaVendedor);
          $("#TelefoneVendedor").val(data.TelefoneVendedor);
          $("#VendedorPadrao").val(data.VendedorPadrao);
          $("#ComissaoVenda").val(valorAjustado.toFixed(2).replace(".", ","));
          $("#CondicaoPgtoPadrao_id").val(data.CondicaoPgtoPadrao).trigger('change');
          $("#TransportadoraPadrao_id").val(data.TransportadoraPadrao).trigger('change');
          $("#MarcaPadrao").val(data.MarcaPadrao);
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
      text: "Tem certeza que deseja excluir esse vendedor?",
      icon: "warning",
      buttons: true,
      dangerMode:true
      }).then((willDelete)=>{
        if(willDelete){
        fetch(`api/create-vendedor/${index}`,{
          method:"DELETE",
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
            },
        }).then(response=>{
          if (response.status === 204) {
            swal({
              icon: 'success',
              title: 'Vendedor Excluido!',
              buttons: false,
              timer: 1500
              }).then(
                carrega_pagina()
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
     const newdata = {
        Vendedor: $("#Vendedor").val() || null,
        Integracao_EDI:$("#Integracao_EDI").val() || null,
        Integracao_EDI2:$("#Integracao_EDI2").val() || null,
        CodigoVendedor:$("#CodigoVendedor").val() || null,
        VendedorBM:$("#VendedorBM").val()|| null,
        VendedorOriginal:$("#VendedorOriginal").val()|| null,
        Apelido: $("#Apelido").val()|| null,
        LegendaVendedor:$("#LegendaVendedor").val()|| null,
        TelefoneVendedor: $("#TelefoneVendedor").val()|| null,
        VendedorPadrao:$("#VendedorPadrao").val()|| null,
        ComissaoVenda:removeCurrencyFormatting($("#ComissaoVenda").val()) || '0.00',
        CondicaoPgtoPadrao:$("#CondicaoPgtoPadrao_id").val()|| null,
        TransportadoraPadrao:$("#TransportadoraPadrao_id").val()|| null,
        MarcaPadrao:$("#MarcaPadrao").val()|| null
        // Outros campos e valores aqui...
      };

    fetch(`api/create-vendedor/${index}/`, {
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
                title: 'Vendedor salvo!',
                showConfirmButton: false,
                timer: 1500
              }).then(
                carrega_pagina()
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
  
Dropzone.options.csvImportarquivo = {
  paramName: "csvImportarquivo",
  maxFiles: 10,
  maxFilesize: 5,
  acceptedFiles: ".csv", // Aceitar apenas arquivos de imagem
  autoProcessQueue: false, // Desativar o envio automático
  init: function() {
      this.on("success", function(file, response) {
      // Lógica a ser executada após o upload bem-sucedido, se necessário
      console.log('response', response);
      });
    
  },
  addRemoveLinks: true
};

var btn_importa_csv = document.getElementById("new_template_csv") 
btn_importa_csv.addEventListener("click", function (e) {
  new swal({
    title: 'Aguarde...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    onOpen: () => {
      swal.showLoading();
    }
  });

  let data = new FormData();

  let dropzone = Dropzone.forElement("#csvImportarquivo");
  if (dropzone.getQueuedFiles().length > 0) {
    dropzone.getQueuedFiles().forEach((arquivo, index) => {
      data.append("Arquivo", arquivo);
    })
  }
  else {
    new swal({
      text: "Nenhum Arquivo Importado!",
      icon: "error",
      buttonsStyling: false,
      confirmButtonText: "Ok",
      customClass: {
        confirmButton: "btn btn-primary"
      }
    });
    return;
  }

  fetch(`api/create-vendedor/importar-arquivo/`, {
    method: "POST",
    headers: {
      'X-CSRFToken': csrftoken,
    },
    body: data,
  })
  .then((response) => {
    swal.close();
    if (response.status === 201) {
      new swal({
        icon: 'success',
        title: 'Arquivo Importado Com sucesso!',
        showConfirmButton: false,
        timer: 1500
      })
      window.location.reload();
    } else {
      response.json().then((data) => {
        new swal({
          title: "Ocorreu um erro ao tentar salvar",
          text: data.error,
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });  
      })
    }
  })
});


// Sistema de pesquisa
(function ($) {
  var bestPictures = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
      url: "api/create-vendedor/?query=%QUERY",
      wildcard: "%QUERY",
      filter: function (response) {
        
        return response; // Assumindo que a API retorna a lista diretamente
      }
    }
  });

  $("#remote .typeahead").on('typeahead:asyncrequest', function () {
    // Mostrar indicador de carregamento
    $(".loading-indicator-arquivos").show();
  });

  $("#remote .typeahead").on('typeahead:asyncreceive', function () {
    // Esconder indicador de carregamento
    $(".loading-indicator-arquivos").hide();
  });

  $("#remote .typeahead").typeahead(null, {
    name: "Vendedores",
    display: 'Vendedor',
    limit: 10,
    source: bestPictures
  }).on('typeahead:selected', function (e, datum) {
    var loader = document.getElementById('loader-3');
    loader.style.display='block';
    var v_pills = document.getElementById('v-pills-tab')
    var tab_content = document.getElementById('v-pills-tabContent')
    tab_content.innerHTML=""
    v_pills.innerHTML=''
    
    // Aqui você pode acessar o ID do item selecionado como datum.id
    var selectedId = datum.id;
    fetch(`api/create-vendedor/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        if(data.id){
          const generatedData = gera_lista_vendedores(data);
          v_pills.innerHTML = generatedData.pill;
          tab_content.innerHTML = generatedData.content;
          loader.style.display='none';
        }

        else{
          new swal({
            title: "Ocorreu um erro ao tentar Buscar dados",
            text: '',
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
              confirmButton: "btn btn-primary"
            }
          });  
        }
        
      })
      .catch(error => {
        new swal({
          title: "Ocorreu um erro ao tentar Buscar dados",
          text: '',
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });  
      });
  })

  $("#remote .typeahead").on('input', function() {
    if ($(this).val() === '') {
      var loader = document.getElementById('loader-3');
      loader.style.display='none';
      var v_pills = document.getElementById('v-pills-tab')
      var tab_content = document.getElementById('v-pills-tabContent')
      tab_content.innerHTML=""
      v_pills.innerHTML=""
      // O campo de pesquisa foi apagado
    // Faça uma requisição para buscar as opções que estavam antes aqui
    fetch('api/create-vendedor/')
    .then(response => response.json())
    .then(data => {
      if(data){
        const generatedData = gera_lista_vendedores(data);
        v_pills.innerHTML = generatedData.pill;
        tab_content.innerHTML = generatedData.content;
        $(".loading-indicator-arquivos").hide();
      }
    })
    .catch(error => {
      swal({
        text: "Ocorreu um erro ao tentar buscar dados!" ,
        icon: error,
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
    });
    });
    }
  });

})(jQuery);


function gera_lista_vendedores(index){

  if (!Array.isArray(index)) {
    index = [index];
  }
  
        var pill = []
        var content = []
        var id;
        for(let i = 0; i<index.length; i++){
          var active = ''
          if(i==0){
            active = 'active'
            id = index[i].id
          }
          let vp = ''
          if(index[i].VendedorPadrao == 'S'){
            vp = 'Sim'
          }
          else{
            vp = 'Não'
          } 
          pill += `
          <a class="contact-tab-${index[i].id} nav-link ${active}" id="v-pills-user-tab" data-bs-toggle="pill" onclick="activeDiv('${index[i].id}')"
          href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
          <div class="media"><img class="img-50 img-fluid m-r-20 rounded-circle update_img_0"
              src="/static/assets/images/user/2.png" alt="">
            <div class="media-body">
              <h6> <span class="first_name_0">${index[i].Vendedor}</span></h6>
              <p class="email_add_0">${index[i].CodigoVendedor}</p>
            </div>
          </div>
        </a>
          `

          content +=`
          <div class="tab-pane contact-tab-${index[i].id} tab-content-child fade ${active} show" id="v-pills-contact${index[i].id}" role="tabpanel"
        aria-labelledby="v-pills-contact${index[i].id}-tab">
        <div class="profile-mail">
          <div class="media align-items-center"><img class="img-100 img-fluid m-r-20 rounded-circle update_img_0"
              src="/static/assets/images/user/2.png" alt="">
            <input class="updateimg" type="file" name="img" onchange="readURL(this,0)">
            <div class="media-body mt-0">
              <h5><span class="first_name_0">${index[i].Vendedor}</span></h5>
              <p class="email_add_0">${index[i].empresa}</p>
              <ul>
                <li><a href="javascript:void(0)" onclick="editContact('${index[i].id}')">Editar</a></li>
                <li><a href="javascript:void(0)" onclick="deleteContact('${index[i].id}')">Deletar</a></li>
                <li><a href="javascript:void(0)" onclick="printContact('${index[i].id}')" data-bs-toggle="modal"
                    data-bs-target="#printModal">Imprimir</a></li>
              </ul>
            </div>
          </div>
          <div class="email-general">
            <h6 class="mb-3">Detalhes</h6>
            <ul>
              <li>Nome <span class="font-primary first_name_0">${index[i].Vendedor}</span></li>
              <li>Empresa <span class="font-primary">${index[i].empresa}</span></li>
              <li>Apelido<span class="font-primary mobile_num_0">${index[i].Apelido}</span></li>
              <li>Cód Vendedor<span class="font-primary email_add_0">${index[i].CodigoVendedor}</span></li>
              <li>Vendedor BM<span class="font-primary url_add_0">${index[i].VendedorBM}</span></li>
              <li>Vendedor Original<span class="font-primary mobile_num_0">${index[i].VendedorOriginal}</span></li>
              <li>Legenda Vendedor<span class="font-primary mobile_num_0">${index[i].LegendaVendedor}</span></li>
              <li>Telefone Vendedor<span class="font-primary mobile_num_0">${index[i].TelefoneVendedor}</span></li>
              <li>Vendedor Padrão<span class="font-primary mobile_num_0">${vp}</span></li>
              <li>Comissão Venda<span class="font-primary mobile_num_0">${index[i].ComissaoVenda}</span></li>
            </ul>
          </div>
        </div>
      </div>
          `
        }
        activeDiv(id);

        return { pill: pill, content: content };

}

function carrega_pagina(){
  var v_pills = document.getElementById('v-pills-tab')
  var tab_content = document.getElementById('v-pills-tabContent')
  tab_content.innerHTML=""
  v_pills.innerHTML=''
  fetch('api/create-vendedor/')
  .then(response => response.json())
  .then(data => {
    if(data){
      const generatedData = gera_lista_vendedores(data);
      v_pills.innerHTML = generatedData.pill;
      tab_content.innerHTML = generatedData.content;
      $(".loading-indicator-arquivos").hide();
    }
  })
  .catch(error => {
    swal({
      text: "Ocorreu um erro ao tentar buscar dados!" ,
      icon: error,
      buttonsStyling: false,
      confirmButtonText: "Ok",
      customClass: {
          confirmButton: "btn btn-primary"
      }
  });
  });
}