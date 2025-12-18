
"use strict";
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
let imagesUploaded = false;
var template = function () {

  var create_template;
  var import_csv;
  var init = function () {


    // Configure os Dropzones

    Dropzone.options.imagebannerpc = {
      paramName: "image_banner_pc",
      maxFiles: 1,
      maxFilesize: 5,
      acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
      autoProcessQueue: false, // Desativar o envio automático
      addRemoveLinks: true,
      init: function () {
        this.on("success", function (file, response) {
          // Lógica a ser executada após o upload bem-sucedido, se necessário
          console.log(response);
        });
        imagesUploaded = true

      }
    };

    Dropzone.options.imagebannermobile = {
      paramName: "image_banner_mobile",
      maxFiles: 1,
      maxFilesize: 5,
      acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
      autoProcessQueue: false, // Desativar o envio automático
      addRemoveLinks: true,
      init: function () {
        this.on("success", function (file, response) {
          // Lógica a ser executada após o upload bem-sucedido, se necessário
          console.log(response);
        });
        imagesUploaded = true
      }
    }

    

    create_template.addEventListener('click', function () {
      var method; var url;
      if ($("#new_template").data('id') == 'new') {
        method = "POST";
        url = 'api/bmm_template/'
      }
      else {
        var id = $("#new_template").data('id')
        method = "PATCH";
        url = `api/bmm_template/${id}/`
      }

      const data = new FormData();
      data.append("empresa", $("#empresa").val() || '');
      data.append("nome_template", $("#nome_template").val() || '');
      data.append("texto_header", $("#texto_header").val() || '');
      data.append("texto_footer", $("#texto_footer").val() || '');
      data.append("texto_promocional", $("#texto_promocional").val() || '');
      data.append("link_footer", $("#link_footer").val() || '');
      data.append("link_marketing", $("#link_marketing").val() || '');
      data.append("campanha_motivo",$("#campanha_motivo").val() || '' );

      // Obtenha as imagens enviadas pelos Dropzones
        const element1 = document.getElementById("imagebannerpc");
        const element2 = document.getElementById("imagebannermobile");
        const element3 = document.getElementById('imagemfooter')
        if (element1) {
          const dropzone1 = Dropzone.forElement("#imagebannerpc");
          if (dropzone1 && dropzone1.getQueuedFiles().length > 0) {
            data.append("image_banner_pc", dropzone1.getQueuedFiles()[0]);
          }
        }
        if(element2){
          const dropzone2 = Dropzone.forElement("#imagebannermobile");
          if (dropzone2 && dropzone2.getQueuedFiles().length > 0) {
            data.append("image_banner_mobile", dropzone2.getQueuedFiles()[0]);
          }
        }
        if(element3){
          const dropzone3 = Dropzone.forElement("#imagemfooter");
          if (dropzone3 && dropzone3.getQueuedFiles().length > 0) {
            data.append("image_footer", dropzone3.getQueuedFiles()[0]);
          }
        }
      fetch(url, {
        method: method,
        headers: {
          'X-CSRFToken': csrftoken,
        },
        body: data,
      }).then((response) => response.json())
        .then((data) => {
          console.log(data)
          if (data.id) {
            swal({
              icon: 'success',
              title: 'Template salvo!',
              showConfirmButton: false,
              timer: 1500
            }).then(
               window.location.reload()
            )


          }
          else {
            swal({
              text: "Ocorreu um erro ao tentar salvar",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                confirmButton: "btn btn-primary"
              }
            });
          }

        })
    })


    // Função importar csv
    // import_csv.addEventListener("click", function (e) {
    //   if($("#template").val()==''){
    //     swal({
    //       text: "Escolha um template!",
    //       icon: "error",
    //       buttonsStyling: false,
    //       confirmButtonText: "Ok",
    //       customClass: {
    //         confirmButton: "btn btn-primary"
    //       }
    //     });
    //     return;
    //   }
        
    //   const data = new FormData();
    //   data.append("template", $("#template").val() || '');
    //   const dropzone1 = Dropzone.forElement("#csvImportTemplate");
    //   if (dropzone1.getQueuedFiles().length > 0) {
    //     dropzone1.getQueuedFiles().forEach((arquivo, index) => {
    //       data.append("Caminho", arquivo);
    //       data.append("NomeArquivo", arquivo.name);
    //       data.append("statusarquivo_id", 'S');
    //     })
    //   }
    //   else{
    //     swal({
    //       text: "Nenhum Arquivo Importado!",
    //       icon: "error",
    //       buttonsStyling: false,
    //       confirmButtonText: "Ok",
    //       customClass: {
    //         confirmButton: "btn btn-primary"
    //       }
    //     });
    //     return;
    //   }

    //   fetch('api/importa_csv_template/', {
    //     method: "POST",
    //     headers: {
    //         'X-CSRFToken': csrftoken,
    //     },
    //     body: data,
    // })
    // .then((response) => response.json())
    // .then((res) => {
    //     console.log(res);
    //     if (res.id) {
    //         console.log(res)
            
    //         swal({
    //             icon: 'success',
    //             title: 'Template Importado Com sucesso!',
    //             showConfirmButton: false,
    //             timer: 1500
    //         })
    //     } else {
    //         swal({
    //             text: "Ocorreu um erro ao tentar salvar",
    //             icon: "error",
    //             buttonsStyling: false,
    //             confirmButtonText: "Ok",
    //             customClass: {
    //             confirmButton: "btn btn-primary"
    //             }
    //         });
    //     }
    // });


    // })

  }

  return {
    init: function () {
      create_template = document.getElementById('new_template');
      import_csv = document.getElementById('new_template_csv');
      init();
    }
  };
}()

template.init()



function edit_template(index) {
  $("#new_template").data('id', index);
  try {

    swal({
      title: "Aguarde...",
      text: "Buscando dados...",
      icon: "info",
      showConfirmButton: false,
      allowOutsideClick: false,
    })

    fetch(`api/bmm_template/${index}/`)  // Substitua pela URL correta do seu endpoint de detalhes
      .then(response => response.json())
      .then(data => {
        if (data) {
          console.log(data)
          $("#empresa").val(data.empresa).trigger('change')
          $("#nome_template").val(data.nome_template)
          $("#texto_header").val(data.texto_header)
          $("#texto_footer").val(data.texto_footer)
          $("#texto_promocional").val(data.texto_promocional)
          $("#link_footer").val(data.link_footer)
          $("#link_marketing").val(data.link_marketing)
          $("#campanha_motivo").val(data.campanha_motivo).trigger('change')
          const div = document.getElementById('div_footer');
          const div_banner_pc = document.getElementById('div_banner_pc');
          const div_banner_mobile = document.getElementById('div_banner_mobile')
          if(data.image_banner_pc){
            div_banner_pc.innerHTML=''
            div_banner_pc.innerHTML=`
            <label>Imagem Banner PC</label>
            <div class="card card-image">
              <img src="${data.image_banner_pc}" class="card-img-top" alt="Imagem 1">
            </div>
            <button type="button" class="btn btn-danger btn-sm delete-image" onclick="removeImagembanner(${data.id}, 'image_banner_pc')">Remover Imagem</button>
            `
          }
          else{
            div_banner_pc.innerHTML=`
            <label>Imagem Banner PC</label>
            <form class="dropzone" id="imagebannerpc" action="/api/bmm_template/">
              <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                  <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
              </div>
            </form>
            `
            reinicia_dropzone('image_banner_pc')
          }
          if(data.image_banner_mobile){
            div_banner_mobile.innerHTML=''
            div_banner_mobile.innerHTML=`
            <label>Imagem Banner Mobile</label>
            <div class="card card-image">
              <img src="${data.image_banner_mobile}" class="card-img-top" alt="Imagem 1">
            </div>
            <button type="button" class="btn btn-danger btn-sm delete-image" onclick="removeImagembanner(${data.id}, 'image_banner_mobile')">Remover Imagem</button>
            `
          }
          else{
            div_banner_mobile.innerHTML=`
            <label>Imagem Banner Mobile</label>
            <form class="dropzone" id="imagebannermobile" action="/api/bmm_template/">
              <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                  <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
              </div>
            </form>
            `
            reinicia_dropzone('image_banner_mobile')
          }
          if(data.image_footer){
            div.innerHTML=`
            <label>Imagem footer</label>
            <div class="card card-image">
              <img src="${data.image_footer}" class="card-img-top" alt="Imagem 1">
            </div>
            <button type="button" class="btn btn-danger btn-sm delete-image" onclick="removeImagemFooter(${data.id})">Remover Imagem</button>
            `
            }
          else{
            div.innerHTML=`
            <label>Imagem footer</label>
            <form class="dropzone" id="imagemfooter" action="/api/bmm_template/">
              <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                  <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
              </div>
            </form>
            `
            registra_dropzone_modal_novo()
          }
          swal.close();
        }
        else {
          swal({
            title: "Houve um erro ao tentar buscar informações",
            icon: "error",
            dangerMode: true,
          })
        }
      })
      .catch(error => {
        swal({
          title: "Houve um erro ao tentar buscar informações",
          icon: "error",
          dangerMode: true,
        })
      });
  }
  catch (error) {
    swal({
      title: "Houve um erro ao tentar buscar informações",
      icon: "error",
      dangerMode: true,
    })
  }
}

function novo() {
  $("#new_template").data('id', 'new');
  $("#empresa").val('').trigger('change')
  $("#nome_template").val('')
  $("#texto_header").val('')
  $("#texto_footer").val('')
  $("#texto_promocional").val('')
  $("#link_marketing").val('')
  $("#campanha_motivo").val('VDP').trigger('change')
  let div_banner_pc = document.getElementById('div_banner_pc');
  let div_banner_mobile = document.getElementById('div_banner_mobile')
  div_banner_pc.innerHTML=`
    <label>Imagem Banner PC</label>
            <form class="dropzone" id="imagebannerpc" action="/api/bmm_template/">
              <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                  <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
              </div>
        </form>
  `
  reinicia_dropzone('image_banner_pc')
  div_banner_mobile.innerHTML=`
  <label>Imagem Banner Mobile</label>
            <form class="dropzone" id="imagebannermobile" action="/api/bmm_template/">
              <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                  <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
              </div>
            </form>
  `
  reinicia_dropzone('image_banner_mobile')

  const div = document.getElementById('div_footer')
  fetch(`api/save_opcao_padrao/ultima/`)
  .then(res =>{
    if(res.status == 404){
      div.innerHTML=`
      <label>Imagem footer</label>
      <form class="dropzone" id="imagemfooter" action="/api/bmm_template/">
        <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
            <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
        </div>
      </form>
      `
      registra_dropzone_modal_novo()
      return
    }
    else{
      return res.json()
    }
    })
  .then(data => {
      if(data){
        console.log(data)
        $("#link_footer").val(data.link_footer_padrao)
        if(data.imagem_footer_padrao){
          div.innerHTML=`
          <label>Imagem footer</label>
          <div class="card card-image">
            <img src="${data.imagem_footer_padrao}" class="card-img-top" alt="Imagem 1">
          </div>
          <button type="button" class="btn btn-danger btn-sm delete-image" onclick="remove_imagem()">Remover Imagem</button>
          `
        }
        else{
          div.innerHTML=`
          <label>Imagem footer</label>
          <form class="dropzone" id="imagemfooter" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          registra_dropzone_modal_novo()
        }
      }

  })
}

function remove_imagem(){
  const div = document.getElementById('div_footer')
  div.innerHTML=`
          <label>Imagem footer</label>
          <form class="dropzone" id="imagemfooter" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          registra_dropzone_modal_novo()
}

function removeImagembanner(templateId, imageType) {
  let div='';
  // Faça uma requisição fetch para a viewset do Django Rest Framework
  fetch(`/pt/api/remove_imagem/${templateId}/remove_image/?image_type=${imageType}`, {
      method: 'GET',
      headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
      },
  })
  .then(response => response.json())
  .then(data => {
      // Atualize a interface do usuário conforme necessário
      console.log(data)
      if(data.message){
        swal({
          icon: 'success',
          title: 'Imagem Removida!',
          buttons: false,
          timer: 1500
        })
        if(imageType == 'image_banner_pc'){
          console.log('Entrou no ppc')
          div = document.getElementById('div_banner_pc');
          div.innerHTML = ''
          div.innerHTML = `
          <label>Imagem Banner PC</label>
          <form class="dropzone" id="imagebannerpc" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          reinicia_dropzone(imageType)
        }
        else{
          console.log('Entrou no mobile')
          div = document.getElementById('div_banner_mobile');
          div.innerHTML = ''
          div.innerHTML = `
          <label>Imagem Banner Mobile</label>
          <form class="dropzone" id="imagebannermobile" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          reinicia_dropzone(imageType)
        }
      }
      // Remova o card ou faça outras atualizações no DOM
  })
  .catch(error => {
      console.error('Erro ao remover imagem:', error);
  });
}

function reinicia_dropzone(index) {
  var id = '';
  if (index == 'image_banner_pc') {
    id = 'imagebannerpc';
  } else {
    id = 'imagebannermobile';
  }

  var dropzoneElement = document.querySelector(`#${id}`);

  // Verifique se já existe uma instância do Dropzone para este elemento e destrua-a
  if (Dropzone.instances.length > 0) {
    Dropzone.instances.forEach(function (dz) {
      if (dz.element === dropzoneElement) {
        dz.destroy(); // Destrua a instância anterior
      }
    });
  }

  // Crie uma nova instância do Dropzone
  var myDropzone = new Dropzone(dropzoneElement, {
    url: "/api/bmm_template/", // Substitua pela URL apropriada
    paramName: id,
    maxFiles: 1,
    maxFilesize: 5, // Tamanho máximo do arquivo em MB
    acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
    autoProcessQueue: false, // Desativar o envio automático
    addRemoveLinks: true, // Mostrar link para remover arquivo
    init: function () {
      this.on("success", function (file, response) {
        // Lógica a ser executada após o upload bem-sucedido
        console.log(response);
      });
      // Outros event listeners conforme necessário
      imagesUploaded = true;
    }
  });
}



function removeImagemFooter(index){
  swal({
    title: "Aguarde...",
    text: "Excluindo Imagem",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
  })

  var div = document.getElementById('div_footer')
  fetch(`api/bmm_template/${index}/remove-image/`)
  .then(res => {
      if(res.ok){
          div.innerHTML=`
          <label>Imagem footer</label>
          <form class="dropzone" id="imagemfooter" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          registra_dropzone_modal_novo()
      }
      else{
        swal({
          text: "Ocorreu um erro!",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });
      }
      swal.close()

  })

}


function registra_dropzone_modal_novo(){
  var el = document.getElementById('imagemfooter');
    if (el) {
        var myDropzone = new Dropzone("#imagemfooter", {
            url: "/api/bmm_template/", // Substitua pela URL apropriada
            paramName: "imagemfooter",
            maxFiles: 1,
            maxFilesize: 5, // Tamanho máximo do arquivo em MB
            acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
            autoProcessQueue: false, // Desativar o envio automático
            addRemoveLinks: true, // Mostrar link para remover arquivo
            init: function() {
                this.on("success", function(file, response) {
                    // Lógica a ser executada após o upload bem-sucedido
                    console.log(response);
                });
                // Outros event listeners conforme necessário
            }
        });
    }
}


function deleteTemplate(index) {
  swal({
    title: "Tem certeza?",
    text: "Tem certeza que deseja excluir esse Template?",
    icon: "warning",
    buttons: true,
    dangerMode: true
  }).then((willDelete) => {
    if (willDelete) {
      fetch(`api/bmm_template/${index}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
      }).then(response => {
        if (response.status === 204) {
          swal({
            icon: 'success',
            title: 'Template Excluido!',
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

function formatarDataParaString(data) {
  // Mapeie nomes de meses em português
  var meses = [
      "Janeiro", "Fevereiro", "Março", "Abril",
      "Maio", "Junho", "Julho", "Agosto",
      "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  // Crie um objeto de data a partir da data fornecida
  var dataCadastro = new Date(data);

  // Formate a data no formato desejado
  var dataFormatada = dataCadastro.getDate() + " de " + meses[dataCadastro.getMonth()] + " de " + dataCadastro.getFullYear() + " às " + dataCadastro.getHours() + ":" + (dataCadastro.getMinutes() < 10 ? '0' : '') + dataCadastro.getMinutes();

  return dataFormatada;
}


function pausa_campanhas(index){
  swal({
    title: "Tem certeza?",
    text: "Tem certeza que deseja pausar as campanhas desse template?",
    icon: "warning",
    buttons: true,
    dangerMode: true
  }).then((willDelete) => {
      if (willDelete) {
      swal({
        title: "Aguarde...",
        text: "Verificando Campanhas do Template",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
      })
      fetch(`api/pausa_campanhas/${index}/`,{
        method: 'POST',
        headers: {
          'X-CSRFToken': csrftoken,
        },

      }).then(response => response.json())
      .then(data => {
        if(data.status){
          swal({
            title: "Sucesso!",
            text: data.message,
            icon: "success",
            button: "OK",
          });
        }
        else{
          swal({
            title: "Atenção!",
            text: data.message,
            icon: "warning",
            button: "OK",
          });
        }
        
      })
      .catch(error => {
        swal({
          title: "Erro",
          text: "Houve um erro ao tentar coletar informações do template!",
          icon: "error",
          button: "OK",
        });
      });
    }
  })
}


// function fetchTemplateMessages(index) {
//   let botao_salvar_msg_template = document.querySelector('#salvar_template_mensagem');
//   let form_create = document.querySelector('#create_form');
//   form_create.classList.remove('was-validated');
//   botao_salvar_msg_template.dataset.id = index;

//   swal({
//     title: "Aguarde...",
//     text: "Coletando informações do template.",
//     icon: "info",
//     showConfirmButton: false,
//     allowOutsideClick: false,
//   })
//   fetch(`api/bmm_template_msgs/mensagens_do_template/${index}/`, {
//     method: "GET",
//     headers: {
//       'Content-Type': 'application/json',
//       'X-CSRFToken': csrftoken,
//     },
//   })
//   .then(res => {
//     if (res.ok) {
//       swal.close();
//       return res.json()
//     }
//     else {
//       swal({
//         title: "Erro",
//         text: "Houve um erro ao tentar coletar informações do template!",
//         icon: "error",
//         button: "OK",
//       });
//       throw Error(res);
//     }
//   })
//   .then(data => {
//     let mensagens_do_template = "";
//     let wpp_template_nomes = [];

//     for (let msg of data) {
//       mensagens_do_template += `
//       <div class="activity-media">
//         <div class="media">
//           <div class="recent-circle bg-primary"></div>
//           <div class="media-body">
//             <h6 class="font-roboto">${msg.wpptemplate__template_name}</h6><br><span><i class="me-2"
//                 data-feather="clock"></i><span class="font-roboto">${msg.usotemplate} - ${formatarDataParaString(msg.cadastro_dt)}</span></span>
//           </div>
//         </div>
//       </div>
//       `
      
//       wpp_template_nomes.push(msg.wpptemplate__template_name);
//     }

//     let select_wpp_templates = document.querySelector("#select_wpp_templates");
//     select_wpp_templates.value = "";
//     for (let wpp_template of select_wpp_templates.options) {
//       if (wpp_template.value) {
//         if (wpp_template_nomes.includes(wpp_template.innerText)) {
//           wpp_template.hidden = true;
//         }
//         else {
//           wpp_template.hidden = false;
//         }  
//       }
//     }
//     let mensagens_card = document.querySelector("#mensagens_card");
//     mensagens_card.innerHTML = mensagens_do_template;
//   })
  
// }





// Carregar mais itens na tela de arquivos
let page = 2;  // Comece na segunda página, pois a primeira já foi carregada
let recarrega = true;
const table = document.getElementById('item-table');
let loading = false; // Flag para evitar solicitações simultâneas
let loader = document.getElementById("loader");
    function loadMoreItems() {
        if (loading){
            loader.style.display = 'block';
            return; // Evitar solicitações simultâneas
        }

        loader.style.display = 'none'
        // Marcar que estamos carregando itens
        loading = true;
        fetch(`load_more_templates/?page=${page}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                const items = data.items;
                if (items.length > 0) {
                    const tbody = table.querySelector('tbody');
                    items.forEach(itemData => {
                        const row = document.createElement('tr');
                        let s;
                        let n;
                        let badge
                        if(itemData.ativo == "S"){
                          badge = 'badge-success'
                          s = 'selected'
                        }
                        else{
                          badge = 'badge-danger'
                          n = 'selected'
                        }
                        row.innerHTML = ` <td scope="row">${itemData.pk}</td>
                        <td scope="row"><a href="/templates/${itemData.pk}">${itemData.nome}</a></td>
                        <td scope="row">${itemData.texto_principal}</td>
                        <td scope="row"> 
                          <select style="border: none;" class="badge ${badge}" onchange="atualiza_status(this, ${itemData.pk})">
                            <option value="S" ${s} >Sim</option>
                            <option value="N" ${n} >Não</option>
                          </select>  
                        </td>
                        <td scope="row">
                          <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                      aria-haspopup="true" aria-expanded="false">Opções</button>
                                    <div class="dropdown-menu">
                                      <a class="dropdown-item"
                                        href="#" onclick="deleteTemplate(${itemData.pk})">Excluir</a>
                                        <a class="dropdown-item"
                                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#add_template" onclick="edit_template(${itemData.pk})">Editar</a>
                                        <a class="dropdown-item"
                                        href="javascript:void(0)" onclick="pausa_campanhas(${itemData.pk})">Pausar Campanhas</a>
                                        <a class="dropdown-item"
                                          href="javascript:void(0)"  onclick="duplicar('${itemData.pk}')">Duplicar Template</a>
                                    </div>
                        </td>`
                      

                        tbody.appendChild(row);
                    });
                    page++;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar mais itens:', error);
            }).finally(() => {
                // Marcar que terminamos de carregar
                loading = false;
                loader.style.display = 'none';
            });
    }

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega) {
            loadMoreItems();
        }
    });


// Sistema de pesquisa


(function ($) {
  var bestPictures = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
      url: `api/retorna_nome_templates/?query=%QUERY`,
      wildcard: "%QUERY",
      filter: function (response) {
        console.log(response)
        return response; // Assumindo que a API retorna a lista diretamente
      }
    }
  });

  $("#remote .typeahead").on('typeahead:asyncrequest', function () {
    // Mostrar indicador de carregamento
    $(".loading-indicator").show();
  });

  $("#remote .typeahead").on('typeahead:asyncreceive', function () {
    // Esconder indicador de carregamento
    $(".loading-indicator").hide();
  });

  $("#remote .typeahead").typeahead(null, {
    name: "arquivos",
    display: 'nome_template',
    source: bestPictures
  }).on('typeahead:selected', function (e, datum) {
    loader.style.display='block';
    const tbody = table.querySelector('tbody');
    tbody.innerHTML=''
    
    // Aqui você pode acessar o ID do item selecionado como datum.id
    var selectedId = datum.id;
    console.log(datum)
    fetch(`api/bmm_template/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        if(data.id){
          let s;
          let n;
          let badge
          if(data.Ativo == "S"){
            badge = 'badge-success'
            s = 'selected'
          }
          else{
            badge = 'badge-danger'
            n = 'selected'
          }
          tbody.innerHTML = `
          <tr>
            <td scope="row">${data.id}</td>
            <td scope="row"><a href="/templates/${data.id}">${data.nome_template}</a></td>
            <td scope="row">${data.texto_header}</td>
            <td scope="row"> 
              <select style="border: none;" class="badge ${badge}" onchange="atualiza_status(this, ${data.id})">
                <option value="S" ${s} >Sim</option>
                <option value="N" ${n} >Não</option>
              </select>  
            </td>
            <td scope="row">
              <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                          aria-haspopup="true" aria-expanded="false">Opções</button>
                        <div class="dropdown-menu">
                          <a class="dropdown-item"
                            href="#" onclick="deleteTemplate(${data.id})">Excluir</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#add_template" onclick="edit_template('${data.id}')">Editar</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)" onclick="pausa_campanhas(${data.id})">Pausar Campanhas</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)"  onclick="duplicar('${data.id}')">Duplicar Template</a>
                        </div>
            </td>
          </tr>
          `
          loader.style.display='none';
          recarrega = false;
        }
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
  })

  $("#remote .typeahead").on('input', function() {
    if ($(this).val() === '') {
      $(".loading-indicator").hide();
      loader.style.display='block';
      var tbody = table.querySelector('tbody');
      tbody.innerHTML=''
      
      // O campo de pesquisa foi apagado
    // Faça uma requisição para buscar as opções que estavam antes aqui
    fetch(`api/retorna_nome_templates/`)
    .then(response => response.json())
    .then(data => {
      if(data){
        for(let i = 0; i<data.length; i++){
          const row = document.createElement('tr');
          let s;
          let n;
          let badge
          if(data[i].ativo == "S"){
            badge = 'badge-success'
            s = 'selected'
          }
          else{
            badge = 'badge-danger'
            n = 'selected'
          }
         row.innerHTML= `
            <td scope="row">${data[i].id}</td>
            <td scope="row"><a href="/templates/${data[i].id}">${data[i].nome_template}</a></td>
            <td scope="row">${data[i].texto_header}</td>
            <td scope="row"> 
              <select style="border: none;" class="badge ${badge}" onchange="atualiza_status(this, ${data[i].id})">
                <option value="S" ${s} >Sim</option>
                <option value="N" ${n} >Não</option>
              </select>  
            </td>
            <td scope="row">
              <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                          aria-haspopup="true" aria-expanded="false">Opções</button>
                        <div class="dropdown-menu">
                          <a class="dropdown-item"
                            href="#" onclick="deleteTemplate(${data[i].id})">Excluir</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#add_template" onclick="edit_template('${data[i].id}')">Editar</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)" onclick="pausa_campanhas(${data[i].id})">Pausar Campanhas</a>
                            <a class="dropdown-item"
                            href="javascript:void(0)"  onclick="duplicar(${data[i].id})">Duplicar Template</a>
                        </div>
            </td>
          `
          tbody.appendChild(row);
        }
        loader.style.display='none';
        recarrega = true
        page = 2;
      }
    })
    .catch(error => {
      swal({
        text: "Ocorreu um erro ao tentar buscar dados!" + error,
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

function duplicar(index){
  swal({
    title: "Tem certeza?",
    text: "Tem certeza que deseja duplicar esse template?",
    icon: "warning",
    buttons: true,
    dangerMode: true
  }).then((willDelete) => {
      if (willDelete) {
        swal({
          title: "Aguarde...",
          text: "Duplicando.....",
          icon: "info",
          showConfirmButton: false,
          allowOutsideClick: false,
        });

        fetch(`api/bmm_template/${index}/duplicate/`, {  // Supondo que 'duplicate' seja o endpoint para duplicação
          method: "POST",
          headers: {
            'X-CSRFToken': csrftoken,
          },
        })
        .then(res => res.json())
        .then(data => {
          console.log(data)
          if (data.new_template_id) {
            swal({
              icon: 'success',
              title: 'Template Duplicado!',
              showConfirmButton: false,
              timer: 1500
            }).then(() => {
              window.location.reload();
            });
          } else {
            swal({
              text: "Ocorreu um erro ao tentar duplicar",
              icon: "error",
              buttonsStyling: false,
              confirmButtonText: "Ok",
              customClass: {
                confirmButton: "btn btn-primary"
              }
            });
          }
        });
      }
  });
}


let dropzone = true
function opcao_padrao(){
  swal({
    title: "Aguarde...",
    text: "Buscando infos",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
  })
  var div = document.getElementById('div_imagem_footer')
  fetch(`api/save_opcao_padrao/ultima/`)
  .then(res =>{
    if(res.status == 404){
      div.innerHTML=`
          <label>Imagem footer padrão</label>
          <form class="dropzone" id="imagemfooterpadrao" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          registra_dropzone()
          swal.close()
        return
    }
    else{
      return res.json()
    }
    })
  .then(data => {
      if(data){
        console.log(data)
        $("#link_footer_padrao").val(data.link_footer_padrao)
        if(data.imagem_footer_padrao){
          dropzone=false
          div.innerHTML=`
          <label>Imagem footer padrão</label>
          <div class="card card-image">
            <img src="${data.imagem_footer_padrao}" class="card-img-top" alt="Imagem 1">
          </div>
          <button type="button" class="btn btn-danger btn-sm delete-image" onclick="removeImage(${data.id})">Remover Imagem</button>
          `
        }
        else{
          div.innerHTML=`
          <label>Imagem footer padrão</label>
          <form class="dropzone" id="imagemfooterpadrao" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          registra_dropzone()
        }
      }
      swal.close()

  })
}

function removeImage(index){
  swal({
    title: "Aguarde...",
    text: "Excluindo Imagem",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
  })

  var div = document.getElementById('div_imagem_footer')
  fetch(`api/save_opcao_padrao/${index}/remove-image/`)
  .then(res => {
      if(res.ok){
          dropzone=true
          div.innerHTML=`
          <label>Imagem footer padrão</label>
          <form class="dropzone" id="imagemfooterpadrao" action="/api/bmm_template/">
            <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
                <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6>
            </div>
          </form>
          `
          registra_dropzone()
      }
      else{
        swal({
          text: "Ocorreu um erro!",
          icon: "error",
          buttonsStyling: false,
          confirmButtonText: "Ok",
          customClass: {
            confirmButton: "btn btn-primary"
          }
        });
      }
      swal.close()

  })

}


$("#save_opcao_padrao").on('click', function(){
  swal({
    title: "Aguarde...",
    text: "Salvando.....",
    icon: "info",
    showConfirmButton: false,
    allowOutsideClick: false,
  })
  
  const data = new FormData();
  let aplicar_todos = document.getElementById('aplicar_todos').checked
  if(dropzone){
    const dropzone3 = Dropzone.forElement("#imagemfooterpadrao");
    if (dropzone3.getQueuedFiles().length > 0) {
      data.append("imagem_footer_padrao", dropzone3.getQueuedFiles()[0]);
    }
  }
  data.append("link_footer_padrao", $("#link_footer_padrao").val() || '');
  

  fetch(`api/save_opcao_padrao/?check=${aplicar_todos}`,{
    method:'POST',
    headers: {
      'X-CSRFToken': csrftoken,
    },
    body:data
  })
  .then(res => res.json())
  .then(data => {
    if(data.status == "sucesso"){
      swal({
        icon: 'success',
        title: 'Salvo com sucesso!',
        showConfirmButton: false,
        timer: 1500
      })
    }
    else{
      swal({
        text: "Ocorreu um erro!",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
          confirmButton: "btn btn-primary"
        }
      });
    }
  }).catch(Error=>{
    swal({
      text: "Ocorreu um erro!",
      icon: "error",
      buttonsStyling: false,
      confirmButtonText: "Ok",
      customClass: {
        confirmButton: "btn btn-primary"
      }
    });
  })
})

function registra_dropzone(){
  var el = document.getElementById('imagemfooterpadrao');
    if (el) {
        var myDropzone = new Dropzone("#imagemfooterpadrao", {
            url: "/api/bmm_template/", // Substitua pela URL apropriada
            paramName: "imagemfooterpadrao",
            maxFiles: 1,
            maxFilesize: 5, // Tamanho máximo do arquivo em MB
            acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
            autoProcessQueue: false, // Desativar o envio automático
            addRemoveLinks: true, // Mostrar link para remover arquivo
            init: function() {
                this.on("success", function(file, response) {
                    // Lógica a ser executada após o upload bem-sucedido
                    console.log(response);
                });
                // Outros event listeners conforme necessário
            }
        });
    }
}

// atualiza status
function atualiza_status(index, id){
  if(index.value == 'S'){
    index.classList.remove('badge-danger');
    index.classList.add('badge-success');
  }
  else{
    index.classList.remove('badge-success');
    index.classList.add('badge-danger');
  }
  const data = new FormData();
  data.append("Ativo", index.value);
  fetch(`api/bmm_template/${id}/`,{
    method:'PATCH',
    headers: {
      'X-CSRFToken': csrftoken,
    },
    body:data
  }).then((res)=>{
    if(!res.ok){
      swal({
      text: "Ocorreu um erro!",
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