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
                template_name: $(".template_name").val() || null,
                category:$(".category").val() || null,
                language:$(".language").val() || null,
                possui_call_to_action: $(".add_call_to").prop('checked') ? 'S' : 'N'
                // Outros campos e valores aqui...
              };
              fetch('api/wpp_templates/',{
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
              }).then((response) => response.json())
              .then((data) => {
                console.log(data)
                if(data.possui_call_to_action == 'S'){
                  let divs = document.querySelectorAll('#div_call_to_action');
                  let promises = []; // array para armazenar todas as promessas
                  console.log("entrou iifif")
                  divs.forEach((div, index) => {
                      let dados = {
                          template: data.id,
                          palavra_acao: $(div).find(".nome_acao").val(),
                          link: $(div).find(".link_acao").val() || null,
                          template_resposta: $(div).find(".template_resposta").val(),
                      }
                      if(dados.template_resposta == ''){
                          swal({
                            text: "Mensagem Resposta não pode estar vazia" ,
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        });
                        return
                      }
                      console.log('dadad', dados)
                      let promise = fetch('/pt/api/callToActionTemplate/',{
                          method: "POST",
                          headers: {
                              "Content-Type": "application/json",
                              'X-CSRFToken': csrftoken,
                          },
                          body: JSON.stringify(dados),
                      })
                      .then((response) => response.json())
                      .then((data) => {
                        console.log(data)
                          if(!data.id){
                              swal({
                                  text: "Ocorreu um erro ao tentar salvar Calltoactions" ,
                                  icon: "error",
                                  buttonsStyling: false,
                                  confirmButtonText: "Ok",
                                  customClass: {
                                      confirmButton: "btn btn-primary"
                                  }
                              });
                              throw new Error('Erro ao salvar Calltoactions'); // interrompe a execução se houver um erro
                          }
                      })
                      promises.push(promise); // adiciona a promessa ao array
                  });
                  Promise.all(promises).then(() => { // executa o código somente após todas as promessas serem resolvidas
                    swal({
                        icon: 'success',
                        title: 'Salvo com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(
                        window.location.reload()
                    )
                });
                }
                else if(data.id !='' & data.possui_call_to_action == 'N'){
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
                        text: "Ocorreu um erro ao tentar salvar " + data.error  ,
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
    Inputmask('currency', {
      prefix: 'R$ ',
      groupSeparator: '.',
      radixPoint: ',',
      digits: 2,
      autoGroup: true,
      rightAlign: false,
  }).mask($("#valor_pix"))
  })(jQuery);
  

 
  
// limpa divs criadas
function clearDivs() {
  // Seleciona todas as divs clonadas
  let divs = document.querySelectorAll('#div_call_to_action_2')
  if(divs.length>1){
    let clonedDivs = Array.from(divs).slice(1);
        
    // Remove todas as divs clonadas
    clonedDivs.forEach(div => div.remove());
  }
    // Seleciona a primeira di
    let firstDiv = divs[0];
  
  // Limpa os valores dos inputs da primeira div
  $(firstDiv).find("input").val("");
  $(firstDiv).find("select").val("").trigger('change');
}


  // edit contact


  function editContact(index) {
    clearDivs()
    $("#add_call_to").prop('checked', false).trigger('change')
    $("#v-pills-tabContent").hide();
    $(".contact-editform").show();
    $(".update-contact").data("id", index);
    fetch(`api/wpp_templates/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
        if(data){
            $("#template_name").val(data.template_name)
            $("#category").val(data.category).trigger('change')
            $("#language").val(data.language).trigger('change')
            if(data.possui_call_to_action == 'S'){
              $("#add_call_to").prop('checked', true).trigger('change')
            }
            else{
              $("#add_call_to").prop('checked', false).trigger('change')
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
      text: "Tem certeza que deseja excluir esse Template?",
      icon: "warning",
      buttons: true,
      dangerMode:true
      }).then((willDelete)=>{
        if(willDelete){
        fetch(`api/wpp_templates/${index}`,{
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
  function activeDiv(index){
    id_template=index
    console.log(index)
    var list_component = document.getElementById('list_components-'+index);
    var geral = document.getElementById("geral-"+index)
    var loader = geral.children[2]
    loader.style.display = 'block'
    fetch(`api/wpp_templatescomponents_retorno/${index}`,{
    }).then(response => response.json())
    .then(data => {
      console.log(data)
      if(data){
        list_component.innerHTML=''
        var div = []
        let contentClass = "";
        let content = ''
        let btn_display = '';
        let modal = '#modalAddcomponente'
        let onclick;
        for(let i = 0; i< data.length; i++){
          if (data[i].id_sendpulse){
            btn_display = 'd-none';
            modal = '#modal_componente_sendpulse'
            onclick = `busca_termos_sendpulse(${data[i].id})`
            if(data[i].component_type == "BUTTONS"){
              modal = '#flow_fluxo'
              onclick = `add_flow_id(${data[i].id})`
            }
          }
          else{
            onclick = `editar_component(${data[i].id})`
          }
          if (data[i].component_type == "HEADER") {
            contentClass = "badge-primary";
          } else if (data[i].component_type == "BODY") {
            contentClass = "badge-secondary";
          } else if (data[i].component_type == "FOOTER") {
            contentClass = "badge-success";
          } else if (data[i].component_type == "BUTTONS") {
            contentClass = "badge-warning";
          } else if (data[i].component_type == "LIST") {
            contentClass = "badge-danger";
          }
          if (data[i].format == 'TEXT'){
            content = `<p style='color:black;'>${data[i].text_content}</p>`
          }
          else if (data[i].format == 'IMAGE'){
            let imageUrl = data[i].image_content ? data[i].image_content != null && data[i].image_content != '': data[i].url_formatada;
            
            content = `<div style="display:flex; justify-content:center; align-items:center; position: relative;">
            <div style="width: 120px; height:120px;">
                <div class="sidebar-img-content">
                    <img class="img-fluid" src="${imageUrl}" alt="" style="object-fit: cover; width: 100%; height: 100%;">
                    <a id="removeButton_logo" href="#" class="btn btn-secondary" style="position: absolute; top: 0; right: 5px; border-radius: 50%; padding: 10px; height: 40px; width:40px; border:none; display:none;">
                        <i class="fa fa-trash"></i>
                    </a>
                </div>
            </div>
        </div>
        ${ data[i].text_content ? `<p style='color:black; margin-top:15px;'>${data[i].text_content}</p>` : ''}
        `
          }
          div += `
            <div class="col-sm-11">
            <div class="card position-relative">
            <button type="button" class="btn btn-danger btn-sm custom-btn position-absolute bottom-0 end-0 ${btn_display}" onclick="excluir_componente(${data[i].id}, ${index})"><i class="fa fa-trash-o custom-icon"></i></button>
            <a href='#' data-bs-toggle="modal" data-bs-target=${modal} onclick=${onclick}>
            <div class="media p-20">
                <div class="media-body">
                    <h6 class="mt-0 mega-title-badge">${data[i].format}<span class="badge ${contentClass} pull-right digits">${data[i].component_type}</span>
                    </h6>
                    ${content}
                </div>
            </div>
        </a>
            </div>
          </div>
          `
        }

        list_component.innerHTML = div
        loader.style.display = 'none'

      }
      else if(data.error){
        list_component.innerHTML = 'Não há componentes!'
      }

    })

    $(".contacts-tabs .nav-link ").removeClass("active show");
    $(".contacts-tabs .tab-content .tab-content-child ").removeClass(
        "active show"
      );
    $(".contact-tab-" + index).addClass("active show");
    $("#v-pills-tabContent").show();
    $(".contact-editform").hide();
  }
  
  // upload images
  
  function readURL(input, index) {
    // console.log(input.files[0]);
    var elems = document.getElementsByClassName("update_img_" + index);
    for (i = 0; i < elems.length; i++) {
      elems[i].src = window.URL.createObjectURL(input.files[0]);
    }
  }
  

  $(".format").on('change', function(e){
    if(e.target.value == 'TEXT'){
      // Mostra a textarea e oculta a dropzone
      $("#text_area_wpp").removeClass('d-none').addClass('d-block d-sm-flex');
      $("#title_textarea").text('Texto (Mensagem que será enviada pelo whatsapp)')
      $("#dropzone_wpp_image").removeClass('d-block d-sm-flex').addClass('d-none');
    } else if(e.target.value == 'IMAGE') {
      // Mostra a dropzone e oculta a textarea
      $("#dropzone_wpp_image").removeClass('d-none').addClass('d-block d-sm-flex');
      $("#title_textarea").text('Legenda Imagem')
    }
  })

  $(".update-contact").on("click", function (e) {
    swal({
      title: 'Aguarde...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      showConfirmButton: false,
    });
     var index = $(".update-contact").data('id')
    
     const newdata = {
        template_name: $("#template_name").val() || null,
        category:$("#category").val() || null,
        language:$("#language").val() || null,
        possui_call_to_action: $("#add_call_to").prop('checked') ? 'S' : 'N'
        // Outros campos e valores aqui...
      };

    fetch(`api/wpp_templates/${index}/`, {
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
        if(data.possui_call_to_action == 'S'){
          console.log("entrou iifif")
          let divs = document.querySelectorAll('#div_call_to_action_2');
          let promises = []; // array para armazenar todas as promessas
          divs.forEach((div, index) => {
              let dados = {
                  template: data.id,
                  palavra_acao: $(div).find("#nome_acao").val(),
                  link: $(div).find("#link_acao").val() || null,
                  template_resposta: $(div).find("#template_resposta").val(),
                  processada: 'N',
                  opcoes: $(div).find("#opcoes").val() || null,
              }

              if(dados.opcoes == 'PIX'){
                if($(div).find("#valor_pix").val() != ''){
                  let valorPix = $(div).find("#valor_pix").val()
                  valorPix = valorPix.replace('R$', '').trim();
                  // Substitui a vírgula pelo ponto e converte para float
                  valorPix = parseFloat(valorPix.replace(',', '.')).toFixed(2);
                  dados['valor_pix'] = valorPix;
                }
                else{
                  swal({
                    text: "Valor Pix não pode estar vazio" ,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
                return
                }
              }

              if(dados.palavra_acao == ''){
                swal({
                  text: "Palavra ação não pode estar vazia" ,
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                      confirmButton: "btn btn-primary"
                  }
              });
              return
            }

              if(dados.template_resposta == ''){
                swal({
                  text: "Mensagem Resposta não pode estar vazia" ,
                  icon: "error",
                  buttonsStyling: false,
                  confirmButtonText: "Ok",
                  customClass: {
                      confirmButton: "btn btn-primary"
                  }
              });
              return
            }

              let id = $(div).find("#link_acao").data('id');
              console.log("TTTSS",id )
              let url = id ? `/pt/api/callToActionTemplate/${id}/` : '/pt/api/callToActionTemplate/';
              let method = id ? 'PATCH' : 'POST';
              console.log('dadad', dados)
              let promise = fetch(url,{
                  method: method,
                  headers: {
                      "Content-Type": "application/json",
                      'X-CSRFToken': csrftoken,
                  },
                  body: JSON.stringify(dados),
              })
              .then((response) => response.json())
              .then((data) => {
                console.log(data)
                  if(!data.id){
                      swal({
                          text: "Ocorreu um erro ao tentar salvar Calltoactions" ,
                          icon: "error",
                          buttonsStyling: false,
                          confirmButtonText: "Ok",
                          customClass: {
                              confirmButton: "btn btn-primary"
                          }
                      });
                      throw new Error('Erro ao salvar Calltoactions'); // interrompe a execução se houver um erro
                  }
              })
              promises.push(promise); // adiciona a promessa ao array
          });
          Promise.all(promises).then(() => { // executa o código somente após todas as promessas serem resolvidas
            swal({
                icon: 'success',
                title: 'Salvo com sucesso!',
                showConfirmButton: false,
                timer: 1500
            }).then(
                
            )
        });
        }
       else if(data.possui_call_to_action == 'N'){
        console.log('entyrou elseif')
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
          console.log('Entrou else')
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
        swal({
          title: "Erro",
          text: "Houve um erro ao tentar salvar!",
          icon: "error",
          button: "OK",
        });
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


  function excluir_componente(index, id){
    swal({
      title: "Tem certeza?",
      text: "Tem certeza que deseja excluir esse Componente?",
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
                activeDiv(id)
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
  
var id_template;
var method;
var url = '';
function editar_component(index){
    url = `api/wpp_templatescomponents/${index}/`
    method = 'PATCH'
    swal({
      title: 'Aguarde...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      showConfirmButton: false,
    });
    fetch(`api/wpp_templatescomponents/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
    .then(response => response.json())
    .then(data => {
        if(data){
            console.log("dadososos", data)
            $(".component_type").val(data.component_type).trigger('change')
            $(".format").val(data.format).trigger('change')
            if(data.text_content == null){
              var ajuste = ''
            }
            else{
              var ajuste = data.text_content
            }
            if (data.possui_qrcode_pix == 'S') {
              $("#possui_qrcode_pix").prop("checked", true);
            } else {
              $("#possui_qrcode_pix").prop("checked", false);
          }
            if(data.image_content){
              const dropzone2 = Dropzone.forElement("#wppimage");
              var url = new URL(data.image_content);
              console.log(url)
              url.protocol = 'https:'; // Altera o protocolo para HTTPS
              var pathname = url.pathname; // Retorna "/media/media/banner_mobile/provider.png"
              var filename = pathname.split("/").pop(); // Retorna "provider.png"
              fetch(url.href)
              .then(res => res.blob())
              .then(blob => {
                const file = new File([blob], filename, {type: "image/*"});
                dropzone2.removeAllFiles()
                dropzone2.addFile(file);
              });
            }
            simplemde.value(ajuste);
            swal.close()
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

function add_component(index){
  $(".component_type").val('').trigger('change')
  $(".format").val('').trigger('change')
  simplemde.value('');
  id_template = index;
  url = 'api/wpp_templatescomponents/'
  method = 'POST'
}

"use strict";
var create_component = function(){

    var forms;
    var init = function(){
      Dropzone.options.wppimage = {
        paramName: "wppimage",
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
          console.log(method, url, id_template)
          
            console.log($(".text_content").val())
            const dropzone = Dropzone.forElement("#wppimage");
            var data = new FormData();
            data.append("template", id_template);
            data.append("component_type", $(".component_type").val() || '');
            data.append("format", $(".format").val() || '');
            data.append("text_content", $(".text_content").val() || '');
            data.append("image_content", dropzone.getQueuedFiles()[0] || '');
            if ($("#possui_qrcode_pix").prop('checked') == true) {
              data.append("possui_qrcode_pix", 'S');
            }
            else{
              data.append("possui_qrcode_pix", 'N');
            }
            
              console.log('AJAJHAJAJAJ', data)
              if($(".component_type").val() == "" || $(".format").val() == ""){
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
              fetch(url,{
                method: method,
                headers: {
                    // "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: data,
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
                        activeDiv(id_template)
                            // window.location.reload()
                      )

                      
                }
                else if(data == 'Item with this characteristic already exists.'){
                    swal({
                        text: "Um item com esse componente já existe nesse Template" ,
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
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
            forms = document.getElementsByClassName('needs-validation2');
            init();
        }
    };
}()

create_component.init();

// Sistema de pesquisa

(function ($) {
  var bestPictures = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
      url: "api/list_templates/?query=%QUERY",
      wildcard: "%QUERY",
      filter: function (response) {
        
        return response; // Assumindo que a API retorna a lista diretamente
      }
    }
  });

  $("#remote .typeahead").typeahead(null, {
    name: "templates",
    display: 'template_name',
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
    console.log(datum)
    fetch(`api/wpp_templates/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        if(data.id){

          v_pills.innerHTML = `
          <a class="contact-tab-${data.id} nav-link active" id="v-pills-user-tab" data-bs-toggle="pill" onclick="activeDiv('${data.id}')"
          href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
          <div class="media"><img class="img-50 img-fluid m-r-20 rounded-circle update_img_0"
              src="/static/assets/images/avtar/whatsapp.png" alt="">
              <div class="media-body">
              <h6><span class="first_name_0"></span>${data.template_name}</h6>
              <p class="email_add_0">${data.category}</p>
              </div>
          </div>
          </a>
          `

          tab_content.innerHTML=`
          <div class="tab-pane contact-tab-${datum.id} tab-content-child fade active show" id="v-pills-contact${datum.id}" role="tabpanel"
          aria-labelledby="v-pills-contact${datum.id}-tab">
          <div class="profile-mail">
            <div class="media align-items-center"><img class="img-100 img-fluid m-r-20 rounded-circle update_img_0"
                src="/static/assets/images/avtar/whatsapp.png" alt="">
              <input class="updateimg" type="file" name="img" onchange="readURL(this,0)">
              <div class="media-body mt-0">
                <h5><span class="first_name_0">${datum.template_name}</span></h5>
                <p class="email_add_0"><p>
                <ul>
                  <li><a href="javascript:void(0)" onclick="editContact('${datum.id}')">Editar</a></li>
                  <li><a href="javascript:void(0)" onclick="deleteContact('${datum.id}')">Deletar</a></li>
                  <li><a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modalAddcomponente" onclick="add_component('${datum.id}')">Adicionar Componente</a></li>
                </ul>
              </div>
            </div>
            <div class="email-general" id="geral-${datum.id}" >
              <h6 class="mb-3">Componentes</h6>
              <div id="list_components-${datum.id}">
                
              </div>
              <div class="loader-box" id="loader-2">
                <div class="loader-2"></div>
              </div>
            </div>
          </div>
        </div>
          `

          activeDiv(selectedId)
          loader.style.display='none';
        }
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
  })

  $("#remote .typeahead").on('input', function() {
    if ($(this).val() === '') {
      var loader = document.getElementById('loader-3');
      loader.style.display='block';
      var v_pills = document.getElementById('v-pills-tab')
      var tab_content = document.getElementById('v-pills-tabContent')
      tab_content.innerHTML=""
      v_pills.innerHTML=""
      // O campo de pesquisa foi apagado
    // Faça uma requisição para buscar as opções que estavam antes aqui
    fetch('api/retorna_originais/')
    .then(response => response.json())
    .then(data => {
      if(data){
        var pill = []
        var content = []
        var id;
        for(let i = 0; i<data.length; i++){
          var active = ''
          if(i==0){
            active = 'active'
            id = data[i].id
          }
          pill += `
          <a class="contact-tab-${data[i].id} nav-link ${active}" id="v-pills-user-tab" data-bs-toggle="pill" onclick="activeDiv('${data[i].id}')"
          href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
          <div class="media"><img class="img-50 img-fluid m-r-20 rounded-circle update_img_0"
              src="/static/assets/images/avtar/whatsapp.png" alt="">
              <div class="media-body">
              <h6><span class="first_name_0"></span>${data[i].template_name}</h6>
              <p class="email_add_0">${data[i].category}</p>
              </div>
          </div>
          </a>
          `

          content +=`
          <div class="tab-pane contact-tab-${data[i].id} tab-content-child fade ${active} show" id="v-pills-contact${data[i].id}" role="tabpanel"
          aria-labelledby="v-pills-contact${data[i].id}-tab">
          <div class="profile-mail">
            <div class="media align-items-center"><img class="img-100 img-fluid m-r-20 rounded-circle update_img_0"
                src="/static/assets/images/avtar/whatsapp.png" alt="">
              <input class="updateimg" type="file" name="img" onchange="readURL(this,0)">
              <div class="media-body mt-0">
                <h5><span class="first_name_0">${data[i].template_name}</span></h5>
                <p class="email_add_0">${data[i].category}<p>
                <ul>
                  <li><a href="javascript:void(0)" onclick="editContact('${data[i].id}')">Editar</a></li>
                  <li><a href="javascript:void(0)" onclick="deleteContact('${data[i].id}')">Deletar</a></li>
                  <li><a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modalAddcomponente" onclick="add_component('${data[i].id}')">Adicionar Componente</a></li>
                </ul>
              </div>
            </div>
            <div class="email-general" id="geral-${data[i].id}" >
              <h6 class="mb-3">Componentes</h6>
              <div id="list_components-${data[i].id}">
                
              </div>
              <div class="loader-box" id="loader-2">
                <div class="loader-2"></div>
              </div>
            </div>
          </div>
        </div>
          `
        }
        v_pills.innerHTML = pill
        tab_content.innerHTML = content
        activeDiv(id)
        loader.style.display='none';
      }
    })
    .catch(error => {
      swal({
        text: "Ocorreu um erro ao tentar buscar dados!" ,
        icon: "error",
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

function sendFilters() {
  // Obter todos os checkboxes marcados
  const checkboxes = document.querySelectorAll('input[name="filterOption"]:checked');
  
  // Extrair os valores marcados
  const selectedFilters = Array.from(checkboxes).map(checkbox => checkbox.value);

  // Construir a URL da API com os filtros
  const apiUrl = 'api/retorna_filtro/?filterOption=' + selectedFilters.join(',');
  
  var loader = document.getElementById('loader-3');
  loader.style.display='block';
  var v_pills = document.getElementById('v-pills-tab')
  var tab_content = document.getElementById('v-pills-tabContent')
  tab_content.innerHTML=""
  v_pills.innerHTML=""

  // Enviar os dados para a API (substitua a URL da API conforme necessário)
  fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  })
  .then(response => response.json())
  .then(data => {
    if(data.length){
      var pill = []
      var content = []
      var id;
      for(let i = 0; i<data.length; i++){
        var active = ''
        if(i==0){
          active = 'active'
          id = data[i].id
        }
        pill += `
        <a class="contact-tab-${data[i].id} nav-link ${active}" id="v-pills-user-tab" data-bs-toggle="pill" onclick="activeDiv('${data[i].id}')"
        href="#v-pills-user" role="tab" aria-controls="v-pills-user" aria-selected="true">
        <div class="media"><img class="img-50 img-fluid m-r-20 rounded-circle update_img_0"
            src="/static/assets/images/avtar/whatsapp.png" alt="">
            <div class="media-body">
            <h6><span class="first_name_0"></span>${data[i].template_name}</h6>
            <p class="email_add_0">${data[i].category}</p>
            </div>
        </div>
        </a>
        `

        content +=`
        <div class="tab-pane contact-tab-${data[i].id} tab-content-child fade ${active} show" id="v-pills-contact${data[i].id}" role="tabpanel"
        aria-labelledby="v-pills-contact${data[i].id}-tab">
        <div class="profile-mail">
          <div class="media align-items-center"><img class="img-100 img-fluid m-r-20 rounded-circle update_img_0"
              src="/static/assets/images/avtar/whatsapp.png" alt="">
            <input class="updateimg" type="file" name="img" onchange="readURL(this,0)">
            <div class="media-body mt-0">
              <h5><span class="first_name_0">${data[i].template_name}</span></h5>
              <p class="email_add_0">${data[i].category}<p>
              <ul>
                <li><a href="javascript:void(0)" onclick="editContact('${data[i].id}')">Editar</a></li>
                <li><a href="javascript:void(0)" onclick="deleteContact('${data[i].id}')">Deletar</a></li>
                <li><a href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#modalAddcomponente" onclick="add_component('${data[i].id}')">Adicionar Componente</a></li>
              </ul>
            </div>
          </div>
          <div class="email-general" id="geral-${data[i].id}" >
            <h6 class="mb-3">Componentes</h6>
            <div id="list_components-${data[i].id}">
              
            </div>
            <div class="loader-box" id="loader-2">
              <div class="loader-2"></div>
            </div>
          </div>
        </div>
      </div>
        `
      }
      v_pills.innerHTML = pill
      tab_content.innerHTML = content
      activeDiv(id)
      loader.style.display='none';
    }

    else{
      swal({
        text: "Não há registros" ,
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
    });
    loader.style.display='none';
    }
    
  })
  .catch(error => {
    swal({
      text: "Ocorreu um erro ao tentar buscar dados!" ,
      icon: "error",
      buttonsStyling: false,
      confirmButtonText: "Ok",
      customClass: {
          confirmButton: "btn btn-primary"
      }
  });
  });
}



function add_termo_text(termo) {
  var doc = simplemde.codemirror.getDoc();
  var cursor = doc.getCursor(); // Obtenha a posição do cursor
  doc.replaceRange(termo, cursor); // Insira o termo na posição do cursor
}



$("#sincronizar").on('click',function(e){
  e.preventDefault();
  swal({
    title: 'Aguarde...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showCancelButton: false,
    showConfirmButton: false,
  });
  fetch('api/wpp_templates/busca_sendpulse/',{
    method:'POST',
    body: JSON.stringify({
      "bot_id":  $("#bot_sendpulse").val()
    }),
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    }
  })
  .then(res=>res.json())
  .then(data=>{
    if(data.success){
      swal({
        icon: 'success',
        title: 'Sincronizado!',
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
  .catch(error=>{
    swal({
      text: "Ocorreu um erro ao tentar chamar a API" ,
      icon: "error",
      buttonsStyling: false,
      confirmButtonText: "Ok",
      customClass: {
          confirmButton: "btn btn-primary"
      }
  });
  })
})


$('.add_call_to').change(function() {
  if(this.checked) {
    $('#div_call_to_action').removeClass('d-none');
    $("#add_call_action_option").removeClass('d-none');
} else {
    $('#div_call_to_action').addClass('d-none');
    $("#add_call_action_option").addClass('d-none');
}
});

$('#add_call_to').change(function() {
  if(this.checked) {
    fetch(`/pt/api/callToActionTemplate/${$(".update-contact").data('id')}/`)
              .then(response => response.json())
              .then(data => {
                if(data.length>0){
                  console.log(data)
                  $("#nome_acao").val(data[0].palavra_acao)
                  $("#link_acao").val(data[0].link)
                  $("#template_resposta").val(data[0].template_resposta).trigger('change')
                  $("#link_acao").data('id', data[0].id)
                  $("#opcoes").val(data[0].opcoes).trigger('change')
                  if(data[0].opcoes == 'PIX'){
                    let pix = data[0].valor_pix.replace('.', ',')
                    $("#valor_pix").val(pix)
                  }

                  // Adiciona novas divs de acordo com a quantidade retornada
                  for (let i = 1; i < data.length; i++) {
                      let div = document.querySelector('#div_call_to_action_2'); // isso cria uma cópia da div
                      $(div).find('select').select2('destroy');
                      let clone = div.cloneNode(true); 
                      // div.classList.add('div_call_to_action'); // isso adiciona a classe à div clonada
                      document.querySelector('#div_mae_action_edit').appendChild(clone); // isso adiciona a div clonada ao DOM
                      // Preenche os campos da nova div com os dados retornados

                        $(clone).find("#opcoes").on("change", function(e) {
                          e.preventDefault();
                          let value = e.target.value;
                          console.log(value)
                          if (value == "PIX") {
                            $(this).closest(".col-xl").next(".col-xl").removeClass("d-none");
                          } else {
                            $(this).closest(".col-xl").next(".col-xl").addClass("d-none");
                          }
                      });
                      Inputmask('currency', {
                        prefix: 'R$ ',
                        groupSeparator: '.',
                        radixPoint: ',',
                        digits: 2,
                        autoGroup: true,
                        rightAlign: false,
                    }).mask($(clone).find("#valor_pix"))
                      $(clone).find("#nome_acao").val(data[i].palavra_acao);
                      $(clone).find("#link_acao").val(data[i].link);
                      $(clone).find("#link_acao").data("id", data[i].id);
                      $(clone).find("#template_resposta").val(data[i].template_resposta).trigger('change')
                      $(clone).find("#opcoes").val(data[i].opcoes).trigger('change')
                      if(data[i].opcoes == 'PIX'){
                        let pix = data[i].valor_pix.replace('.', ',')
                        $(clone).find("#valor_pix").val(pix)
                      }

                      $(div).find('select').select2();
                      $(clone).find('select').select2();
                  }
                }
              })
    $('#div_call_to_action_2').removeClass('d-none');
    $("#add_call_action_option_2").removeClass('d-none');
} else {
    $('#div_call_to_action_2').addClass('d-none');
    $("#add_call_action_option_2").addClass('d-none');
    clearDivs()
}
});

$("#add_call_action_option").on('click', function(){
  let divs = document.querySelectorAll('#div_call_to_action')
  console.log(divs.length)
  if (divs.length < 3) {
      let div = document.getElementById('div_call_to_action');
      $(div).find('select').select2('destroy'); 
      let clone = div.cloneNode(true); // isso cria uma cópia da div
      div.parentNode.appendChild(clone); // isso adiciona a div clonada ao DOM
      $(div).find('select').select2();
      $(clone).find('select').select2();
  }
});

$("#add_call_action_option_2").on('click', function(){
  let divs = document.querySelectorAll('#div_call_to_action_2')
  console.log(divs.length)
  if (divs.length < 3) {
      let div = document.getElementById('div_call_to_action_2');
      $(div).find('select').select2('destroy'); 
      let clone = div.cloneNode(true); // isso cria uma cópia da div
      div.parentNode.appendChild(clone); // isso adiciona a div clonada ao DOM
      $(div).find('select').select2();
      $(clone).find('select').select2();
  }
});

$("#add_call_action_option_3").on('click', function(){
  let divs = document.querySelectorAll('#div_call_to_action_3')
  console.log(divs.length)
  if (divs.length < 3) {
      let div = document.getElementById('div_call_to_action_3');
      $(div).find('select').select2('destroy'); 
      let clone = div.cloneNode(true); // isso cria uma cópia da div
      div.parentNode.appendChild(clone); // isso adiciona a div clonada ao DOM
      $(div).find('select').select2();
      $(clone).find('select').select2();
  }
});

function vinculo_sendpulse_bot(index){
  document.getElementById("salvar_provedor_sendpsulse").dataset.id = index
  clearDivs()
  fetch(`/pt/api/callToActionTemplate/${index}/`)
              .then(response => response.json())
              .then(data => {
                if(data.length>0){
                  document.getElementById("salvar_provedor_sendpsulse").dataset.edit = '1'
                  console.log(data)
                  $("#sendpulse_action").val(data[0].palavra_acao)
                  $("#sendpulse_link_acao").val(data[0].link)
                  $("#template_resposta_sendpulse").val(data[0].template_resposta).trigger('change')
                  $("#sendpulse_link_acao").data('id', data[0].id)

                  // Adiciona novas divs de acordo com a quantidade retornada
                  for (let i = 1; i < data.length; i++) {
                      let div = document.querySelector('#div_call_to_action_3'); // isso cria uma cópia da div
                      $(div).find('select').select2('destroy');
                      let clone = div.cloneNode(true); 
                      // div.classList.add('div_call_to_action'); // isso adiciona a classe à div clonada
                      document.querySelector('#div_mae_action_edit_2').appendChild(clone); // isso adiciona a div clonada ao DOM
                      // Preenche os campos da nova div com os dados retornados
                      $(clone).find("#sendpulse_action").val(data[i].palavra_acao);
                      $(clone).find("#sendpulse_link_acao").val(data[i].link);
                      $(clone).find("#sendpulse_link_acao").data("id", data[i].id);
                      $(clone).find("#template_resposta_sendpulse").val(data[i].template_resposta).trigger('change')
            
                      $(div).find('select').select2();
                      $(clone).find('select').select2();

                  }
                }
              })
}

function salvar_sendpulse_action(){
  let btn = document.getElementById("salvar_provedor_sendpsulse")
  let id = btn.dataset.id
  let method = 'POST'
  let flag = false
  let url = '/pt/api/callToActionTemplate/'
  if (btn.dataset.edit == '1'){
    method = 'PATCH'
    flag =  true
  }

    const data = {
      possui_call_to_action: 'S'
      // Outros campos e valores aqui...
    };
    fetch(`/pt/api/wpp_templates/${id}/`,{
      method: "PATCH",
      headers: {
          "Content-Type": "application/json",
          'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify(data),
    }).then((response) => response.json())
    .then((data) => {
      console.log(data)
    })
  let divs = document.querySelectorAll('#div_call_to_action_3');
                  let promises = []; // array para armazenar todas as promessas
                  console.log("entrou iifif")
                  divs.forEach((div, index) => {
                      let dados = {
                          template: id,
                          palavra_acao: $(div).find("#sendpulse_action").val(),
                          link: $(div).find("#sendpulse_link_acao").val() || null,
                          template_resposta: $(div).find("#template_resposta_sendpulse").val(),
                          processada: 'N'
                      }
                      console.log('dadad', dados.processada)
                      if (flag){
                        url = `/pt/api/callToActionTemplate/${$(div).find("#sendpulse_link_acao").data('id')}/`
                      }
                      let promise = fetch(url,{
                          method: method,
                          headers: {
                              "Content-Type": "application/json",
                              'X-CSRFToken': csrftoken,
                          },
                          body: JSON.stringify(dados),
                      })
                      .then((response) => response.json())
                      .then((data) => {
                        console.log(data)
                          if(!data.id){
                              swal({
                                  text: "Ocorreu um erro ao tentar salvar Calltoactions" ,
                                  icon: "error",
                                  buttonsStyling: false,
                                  confirmButtonText: "Ok",
                                  customClass: {
                                      confirmButton: "btn btn-primary"
                                  }
                              });
                              throw new Error('Erro ao salvar Calltoactions'); // interrompe a execução se houver um erro
                          }
                      })
                      promises.push(promise); // adiciona a promessa ao array
                  });
                  Promise.all(promises).then(() => { // executa o código somente após todas as promessas serem resolvidas
                    swal({
                        icon: 'success',
                        title: 'Salvo com sucesso!',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(
                        window.location.reload()
                    )
                });
}


  $("#opcoes").on("change", function(e){
    e.preventDefault()
    let value = e.target.value
    if (value == "PIX") {
      $("#value_pix_div").removeClass("d-none");
    } else {
      $("#value_pix_div").addClass("d-none");
    }
  })


function excluir_call_to_action(index){
  console.log("chamou delete")
  console.log(index)
  var btn = index
  var parentDiv = btn.closest('.row')
  console.log(parentDiv)
  var id = $(parentDiv.children[1]).data("id")
  var divpai = $(parentDiv)
  console.log(id)
  if ($(`div[id=${parentDiv.id}]`).length > 1) {
        // Se houver mais de uma div com o id 'div_call_to_action_2', remove a div pai
        parentDiv.remove();
        $(parentDiv.children[1]).data("id", '')
    } else {
        // Se a div pai for a única div com o id 'div_call_to_action_2', limpa os inputs
        divpai.find('input').val('');
        divpai.find('select').val('').trigger('change');
        $(parentDiv.children[1]).data("id", '')
  }
  if(id){
    swal({
      title: 'Aguarde...',
      allowOutsideClick: false,
      allowEscapeKey: false,
      showCancelButton: false,
      showConfirmButton: false,
    });
    fetch(`/pt/api/callToActionTemplate/${id}/`,{
      method:'DELETE',
      headers: {
        // "Content-Type": "application/json",
        'X-CSRFToken': csrftoken,
    },
    })
    .then(res=>{
      console.log("RES", res)
      if(res.ok){
        swal({
          icon: 'success',
          title: 'Call to action excluída',
          showConfirmButton: false,
          timer: 1500
      })
      }
      else{
        swal({
          icon: 'error',
          title: 'Ocorreu um erro ao excluir',
          showConfirmButton: false,
      })
      }
    })
    .catch(error=>{
      swal({
        icon: 'error',
        title: 'Ocorreu um erro ao excluir',
        showConfirmButton: false,
    })
    })
  }
  
}
