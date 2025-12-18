
"use strict";
// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

let imagesUploadedPC = false;
let imageUploadmobile = false;
let imageFooter = false;

var verifica_pagina = ''
$('.nav-link').on('click', function(){
$('.nav-link').each(function () {
  if ($(this).hasClass('active')) {
      verifica_pagina = $(this).text();
  }
});
})
var template = function () {

  var submit_template;
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
          console.log(response);
        });
    
        this.on("removedfile", function (file) {
          imagesUploadedPC = false;
          console.log(imagesUploadedPC);
        });
    
        this.on("addedfile", function (file) {
          imagesUploadedPC = true;
        });
    
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

        this.on("removedfile", function (file) {
          // Lógica a ser executada após a remoção de um arquivo
          imageUploadmobile = false
          // Aqui você pode adicionar lógica adicional, se necessário
        });
        this.on("addedfile", function (file) {
          imageUploadmobile = true;
        });
      }

      
    }

    Dropzone.options.csvImportTemplate = {
      paramName: "csvImportTemplate",
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

      Dropzone.options.imagemfooter = {
        paramName: "imagemfooter",
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

          this.on("removedfile", function (file) {
            // Lógica a ser executada após a remoção de um arquivo
            imageFooter = false
            // Aqui você pode adicionar lógica adicional, se necessário
          });
          this.on("addedfile", function (file) {
            imageFooter = true;
          });
      }
        };



      submit_template.addEventListener('click', function () {
        // Mostra o swal de loading
        swal({
            title: 'Aguarde...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            allowEnterKey: false,
            showConfirmButton: false,
            onOpen: () => {
                swal.showLoading();
            }
        });
    
        var method;
        var url;
        var id = $("#form-edit-template").data('id')
        method = "PATCH";
        url = `/pt/api/bmm_template/${id}/`
    
        const data = new FormData();
        data.append("nome_template", $("#nome_template").val() || '');
        data.append("texto_header", $("#texto_header").val() || '');
        data.append("texto_footer", $("#texto_footer").val() || '');
        data.append("texto_promocional", $("#texto_promocional").val() || '');
        data.append("link_footer", $("#link_footer").val() || '');
        data.append("link_marketing", $("#link_marketing").val() || '');

        if (imagesUploadedPC) {
          const dropzone1 = Dropzone.forElement("#imagebannerpc");
          if (dropzone1.getQueuedFiles().length > 0) {
            data.append("image_banner_pc", dropzone1.getQueuedFiles()[0], dropzone1.getQueuedFiles()[0].name);
          }
        }
        if (imageUploadmobile) {
          const dropzone2 = Dropzone.forElement("#imagebannermobile");
          if (dropzone2.getQueuedFiles().length > 0) {
            data.append("image_banner_mobile", dropzone2.getQueuedFiles()[0], dropzone2.getQueuedFiles()[0].name);
          }
        }

        if (imageFooter) {
          const dropzone4 = Dropzone.forElement("#imagemfooter");
          if (dropzone4.getQueuedFiles().length > 0) {
            data.append("image_footer", dropzone4.getQueuedFiles()[0], dropzone4.getQueuedFiles()[0].name);
          }
        }

    
        fetch(url, {
            method: method,
            headers: {
                'X-CSRFToken': csrftoken,
            },
            body: data,
            enctype: 'multipart/form-data',
        }).then((response) => response.json())
            .then((data) => {
                console.log(data);
    
                // Fecha o swal de loading
                swal.close();
    
                if (data.id) {
                    swal({
                        icon: 'success',
                        title: 'Template salvo!',
                        showConfirmButton: false,
                        timer: 1500
                    }).then(
                        window.location.reload()
                    );
                } else {
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
    });
    


    // Função para fechar o dropdown ao clicar fora dele
    // $(document).on('click', function (event) {
    //     console.log(123)

    //     $('.dropdown').removeClass('show');
    //     console.log(123)
    // });

    // Impede o fechamento do dropdown ao clicar no próprio botão
    $('.dropdown').on('click', function (event) {
        event.stopPropagation();
        
        // Verifica se a classe 'show' está presente
        if ($(this).hasClass('show')) {
            // Se presente, remove a classe 'show' para fechar o dropdown
            $(this).removeClass('show');
        } else {
            // Se ausente, adiciona a classe 'show' para abrir o dropdown
            $(this).addClass('show');
        }
    });


    // Função importar csv
    import_csv.addEventListener("click", function (e) {
      swal({
        title: 'Aguarde...',
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false,
        showConfirmButton: false,
        onOpen: () => {
            swal.showLoading();
        }
    });

    const caminhoCompleto = window.location.pathname;
    const partesDoCaminho = caminhoCompleto.split('/');
    const language = partesDoCaminho[1];

    const data = new FormData();
    data.append("template", $("#form-edit-template").data('id'));

    const dropzone = Dropzone.forElement("#csvImportTemplate");
    const queuedFiles = dropzone.getQueuedFiles();

    if (queuedFiles.length > 0) {
        queuedFiles.forEach((arquivo, index) => {
            data.append(`Caminho_${index}`, arquivo);
            data.append(`NomeArquivo_${index}`, arquivo.name);
        });

        data.append("statusarquivo_id", 'S'); // Apenas um status para todos os arquivos

        fetch(`/${language}/api/importa_csv_template/importa_csv/`, {
            method: "POST",
            headers: {
                'X-CSRFToken': csrftoken,
            },
            body: data,
        })
        .then((response) => {
            swal.close();
            if (response.status === 201) {
                swal({
                    icon: 'success',
                    title: 'Templates Importados Com Sucesso!',
                    showConfirmButton: false,
                    timer: 1500
                });
                window.location.reload();
            } else {
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
            return response.json()
        })
        .then((data) => {
          console.log(data)
        })

    } else {
        swal({
            text: "Nenhum Arquivo Importado!",
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

  return {
    init: function () {
      submit_template = document.getElementById('submit-template');
      import_csv = document.getElementById('new_template_csv');
      init();
    }
  };
}()

template.init()

// Função que remove imagem

function removeImage(templateId, imageType) {
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
        }).then(
          reinicia_dropzone(imageType)
        )
      }
      // Remova o card ou faça outras atualizações no DOM
  })
  .catch(error => {
      console.error('Erro ao remover imagem:', error);
  });
}


function reinicia_dropzone(index) {

  var id = '';
  var id_div = '';
  var label = 'Imagem de banner PC';
  if (index == 'image_banner_pc') {
    id = 'imagebannerpc';
    id_div = 'div_banner_pc';
  } else if(index == 'image_banner_mobile') {
    id = 'imagebannermobile';
    id_div = 'div_banner_mobile'
    label = 'Imagem de banner Mobile'
  }
  else{
    id='imagemfooter'
    id_div = 'div_banner_footer'
    label = 'Imagem footer'
  }

  let div = document.getElementById(id_div)
  div.innerHTML=''
  div.innerHTML = `
      <div class="col m-b-20">
      <label>${label}</label>
      <form class="dropzone" id="${id}" action="/api/bmm_template/">
        <div class="dz-message needsclick"><i class="icon-cloud-up"></i>
          <h6>Arraste os arquivos aqui ou clique para fazer upload.</h6><span class="note needsclick"></span>
      </div>
      </form>
    </div>
    `

  var dropzoneElement = document.querySelector(`#${id}`);


  // Verifique se já existe uma instância do Dropzone para este elemento e destrua-a
  if (Dropzone.instances.length > 0) {
    Dropzone.instances.forEach(function (dz) {
      if (dz.element === dropzoneElement) {
        dz.destroy(); // Destrua a instância anterior
      }
    });
  }


    if (div) {
        var myDropzone = new Dropzone("#"+id, {
            url: "/api/bmm_template/", // Substitua pela URL apropriada
            paramName: id,
            maxFiles: 1,
            maxFilesize: 5, // Tamanho máximo do arquivo em MB
            acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
            autoProcessQueue: false, // Desativar o envio automático
            addRemoveLinks: true, // Mostrar link para remover arquivo
            init: function() {
              this.on("success", function (file, response) {
                console.log(response);
              });
          
              this.on("removedfile", function (file) {
                if(id == 'imagebannerpc'){
                  imagesUploadedPC = false;
                  console.log(imagesUploadedPC);
                }
                else if(id == 'imagebannermobile'){
                  imageUploadmobile = false
                }
                else{
                  imageFooter = false
                }
              });
          
              this.on("addedfile", function (file) {
                if(id == 'imagebannerpc'){
                  imagesUploadedPC = true;
                  console.log(imagesUploadedPC);
                }
                else if(id == 'imagebannermobile'){
                  imageUploadmobile = true
                }
                else{
                  imageFooter = true
                }
              });
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

function deleteArquivo(index){
  swal({
    title: "Tem certeza?",
    text: "Tem certeza que deseja excluir esse Template?",
    icon: "warning",
    buttons: true,
    dangerMode: true
  }).then((willDelete) => {
    if (willDelete) {
      fetch(`/pt/api/importa_csv_template/${index}/`, {
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
}


function formatDate(data) {
  const date = new Date(data);
  const day = date.getDate();
  const month = date.getMonth() + 1; // Os meses em JavaScript começam em 0
  const year = date.getFullYear();

  // Formate os valores para dois dígitos (ex: 01, 02, 03)
  const formattedDay = String(day).padStart(2, '0');
  const formattedMonth = String(month).padStart(2, '0');

  return `${formattedDay}/${formattedMonth}/${year}`;
}

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
        fetch(`/pt/load_more_items_tmplates_importados/?page=${page}&id=${$("#form-edit-template").data('id')}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                const items = data.items;
                if (items.length > 0) {
                    const tbody = table.querySelector('tbody');
                    items.forEach(itemData => {
                        const row = document.createElement('tr');
                        var data_cadastro = formatDate(itemData.data)
                        if(itemData.statusarquivo_id == 'O'){
                          var badge = 'success'
                          var importado = 'Processado'
                        }
                        else if(itemData.statusarquivo_id == 'E'){
                          var badge = 'danger'
                          var importado = 'Erro'
                        }
                        else{
                          var badge = 'info'
                          var importado = 'Aguardando'
                        }
                        row.innerHTML = `<td>
                        <div class="media">
                          <div class="square-box me-2"><i class="fa fa-file-excel-o txt-success"></i></div>
                          <div class="media-body ps-2">
                            <div class="avatar-details"><a href="/media/${itemData.Caminho}">
                                <h6>${itemData.NomeArquivo}</h6>
                              </a><span>${itemData.tipo_arquivo}</span></div>
                          </div>
                        </div>
                      </td>
                      <td class="img-content-box">
                        <h6>${data_cadastro}</h6>
                      </td>
                      <td>
                        <h6><span class="badge badge-${badge} text-white">${importado}</span></h6>
                      </td>
                      <td>
                          <h6>${itemData.retorno_arquivo}</h6>
                      </td>
                      <td>
                      <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false">Opções</button>
                    <div class="dropdown-menu">
                      <a class="dropdown-item"
                        href="#" onclick="deleteArquivo('{{csv.pk}}')">Excluir</a>
                        <a class="dropdown-item"
                        href="javascript:void(0)" onclick="Reprocessar_Arquivo('{{csv.pk}}')">Reprocessar Arquivo</a>
                        <!-- <a class="dropdown-item"
                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes('{{mensagem.wpptemplate.pk}}')">Ver Componentes</a> -->
                    </div>
                      </td>`
                      

                        tbody.appendChild(row);
                        feather.replace();
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
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega && verifica_pagina == 'Arquivos') {
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
      url: `/api/retorna_nome_arquivos/?query=%QUERY&id=${$("#form-edit-template").data('id')}`,
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
    display: 'NomeArquivo',
    source: bestPictures
  }).on('typeahead:selected', function (e, datum) {
    loader.style.display='block';
    const tbody = table.querySelector('tbody');
    tbody.innerHTML=''
    
    // Aqui você pode acessar o ID do item selecionado como datum.id
    var selectedId = datum.id;
    console.log(datum)
    fetch(`/pt/api/importa_csv_template/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        console.log('DADADADADADDADADADADADAD', data)
        if(data.id){
          if(data.statusarquivo_id == 'O'){
            var badge = 'success'
            var importado = 'Processado'
          }
          else if(data.statusarquivo_id == 'E'){
            var badge = 'danger'
            var importado = 'Erro'
          }
          else{
            var badge = 'info'
            var importado = 'Aguardando'
          }

          tbody.innerHTML = `
          <tr>
              <td>
                <div class="media">
                  <div class="square-box me-2"><i class="fa fa-file-excel-o txt-success"></i></div>
                  <div class="media-body ps-2">
                    <div class="avatar-details"><a href="${data.Caminho}">
                        <h6>${data.NomeArquivo}</h6>
                      </a><span>${data.tipo_arquivo}</span></div>
                  </div>
                </div>
              </td>
              <td class="img-content-box">
                <h6>${formatDate(data.DataHora)}</h6>
              </td>
              <td>
                <h6><span class="badge badge-${badge} text-white">${importado}</span></h6>
              </td>
              <td>
                <h6>${data.retorno_arquivo}</h6>
              </td>
              <td>
              <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
              aria-haspopup="true" aria-expanded="false">Opções</button>
            <div class="dropdown-menu">
              <a class="dropdown-item"
                href="#" onclick="deleteArquivo(${data.id})">Excluir</a>
                <a class="dropdown-item"
                href="javascript:void(0)" onclick="Reprocessar_Arquivo(${data.id})">Reprocessar Arquivo</a>
                <!-- <a class="dropdown-item"
                href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes('{{mensagem.wpptemplate.pk}}')">Ver Componentes</a> -->
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
    fetch(`/pt/api/retorna_originais_arquivos/?id=${$("#form-edit-template").data('id')}`)
    .then(response => response.json())
    .then(data => {
      console.log("SADADADAD", data)
      if(data){
        var pill = []
        for(let i = 0; i<data.length; i++){
          if(data[i].statusarquivo_id == 'O'){
            var badge = 'success'
            var importado = 'Processado'
          }
          else if(data[i].statusarquivo_id == 'E'){
            var badge = 'danger'
            var importado = 'Erro'
          }
          else{
            var badge = 'info'
            var importado = 'Aguardando'
          }
          pill += `
          <tr>
              <td>
                <div class="media">
                  <div class="square-box me-2"><i class="fa fa-file-excel-o txt-success"></i></div>
                  <div class="media-body ps-2">
                    <div class="avatar-details"><a href="${data[i].Caminho}">
                        <h6>${data[i].NomeArquivo}</h6>
                      </a><span>${data[i].tipo_arquivo}</span></div>
                  </div>
                </div>
              </td>
              <td class="img-content-box">
                <h6>${formatDate(data[i].DataHora)}</h6>
              </td>
              <td>
                <h6><span class="badge badge-${badge} text-white">${importado}</span></h6>
              </td>
              <td>
                <h6>${data[i].retorno_arquivo}</h6>
              </td>
              <td>
              <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
              aria-haspopup="true" aria-expanded="false">Opções</button>
            <div class="dropdown-menu">
              <a class="dropdown-item"
                href="#" onclick="deleteArquivo(${data[i].id})">Excluir</a>
                <a class="dropdown-item"
                href="javascript:void(0)" onclick="Reprocessar_Arquivo(${data[i].id})">Reprocessar Arquivo</a>
                <!-- <a class="dropdown-item"
                href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes('{{mensagem.wpptemplate.pk}}')">Ver Componentes</a> -->
            </div>
              </td>
            </tr>
          `
        }
        tbody.innerHTML = pill
        loader.style.display='none';
        recarrega = true
        page = 2;
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

function Reprocessar_Arquivo(index){
  swal({
    title: "Tem certeza?",
    text: "Tem certeza que deseja reprocessar esse arquivo?",
    icon: "warning",
    buttons: true,
    dangerMode: true
  }).then((willDelete) => {
    if (willDelete) {
      const data = new FormData();
      data.append("statusarquivo_id", 'S');
      fetch(`/pt/api/importa_csv_template/${index}/`, {
        method: "PATCH",
        headers: {
          'X-CSRFToken': csrftoken,
        },
        body:data
      }).then(response => {
        console.log(response)
        if (response.status === 200) {
          swal({
            icon: 'success',
            title: 'Status alterado!',
            buttons: false,
            timer: 1500
          })
        }
        else {
          swal({
            title: "Erro",
            text: "Houve um erro ao tentar alterar!",
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




// criar template mensagem
function criarTemplateMessages() {
  let botao_salvar_msg_template = document.querySelector('#salvar_template_mensagem');
  let form_create = document.querySelector('#create_form');
  form_create.classList.add('was-validated');
  var save = $("#salvar_template_mensagem").data('id')
  if(save == 'new'){
    var url = '/pt/api/bmm_template_msgs/'
    var method ='POST'
  }
  else{
    var url = `/pt/api/bmm_template_msgs/${save}/`
    var method ='PATCH'
  }
  if (!form_create.checkValidity()) {
    swal({
        title: "Houve um erro",
        text: "Verifique os campos digitados. Se não houver opções de Whatsapp Template, todas já estão vinculadas a esse template.",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
    });
  }
  else {    
    let data = {
      template: $("#form-edit-template").data('id'),
      wpptemplate: document.querySelector('[name="wpptemplate"]').value,
      usotemplate: document.querySelector('[name="usotemplate"]').value
    }
    console.log(data)
    fetch(url, {
      method: method,
      headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
      },
      body: JSON.stringify(data)
    })
    .then((res)=> res.json())
    .then(data => {
      console.log(data)
      if (data.id) {
        swal({
          icon: 'success',
          title: 'Template de mensagem salvo!',
          showConfirmButton: false,
          timer: 1500
        }).then(
          window.location.reload()
        )
      }
      else{
          swal({
            title: "Houve um erro",
            text: 'Houve um erro ao tentar salvar. Verifique se já não existe um template mensagem com essas configurações',
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

function criarTemplateItem() {

  let form_create = document.querySelector('#create_item_form');

  if (!form_create.checkValidity()) {
    swal({
        title: "Houve um erro",
        text: "Verifique os campos digitados.",
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
    });
    return;
  }


  let data = JSON.stringify(
    Object.fromEntries(
      new FormData(form_create)
    )
  );


  fetch("/pt/api/bmm_boomerangueitens/", {
    method: "POST",
    headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrftoken,
    },
    body: data
  })
  .then((res)=> {
    if (!res.ok){
      swal({
        title: "Houve um erro",
        text: 'Houve um erro ao tentar salvar. Verifique se já não existe um template mensagem com essas configurações',
        icon: "error",
        buttonsStyling: false,
        confirmButtonText: "Ok",
        customClass: {
            confirmButton: "btn btn-primary"
        }
      });
      return null;
    }

    return res.json();
  })
  .then(data => {
    if(data){
      console.log(data)
        swal({
          icon: 'success',
          title: 'Template de item salvo!',
          showConfirmButton: false,
          timer: 1500
        }).then(
          window.location.reload()
        )
    }
  });
}

var loader2 = document.getElementById('loader2');
var table2 = document.getElementById('item-table2');


// Carregar mais itens na tela de arquivos
let page2 = 2;  // Comece na segunda página, pois a primeira já foi carregada
let recarrega2 = true;
let loading2 = false; // Flag para evitar solicitações simultâneas
    function loadMoreItems2() {
        if (loading2){
            loader2.style.display = 'block';
            return; // Evitar solicitações simultâneas
        }

        loader2.style.display = 'none'
        // Marcar que estamos carregando itens
        loading2 = true;
        fetch(`/pt/load_more_mensagens_templates/?page=${page2}&id=${$("#form-edit-template").data('id')}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                const items = data.items;
                if (items.length > 0) {
                    const tbody = table2.querySelector('tbody');
                    items.forEach(itemData => {
                      console.log(itemData)
                        const row = document.createElement('tr');
                        if(itemData.usotemplate == 'ENVIO'){
                          var badge = 'success'
                        }
                        else{
                          var badge = 'secondary'
                        }
                        row.innerHTML = `<td>
                        <div class="media">
                          <div class="square-box me-2"><i class="fa fa-file-text-o txt-info"></i></i></div>
                          <div class="media-body ps-2">
                            <div class="avatar-details"><a href="/">
                                <h6>${itemData.template_name}</h6>
                              </a><span>${itemData.categoria}</span></div>
                          </div>
                        </div>
                      </td>
                      <td class="img-content-box">
                        <h6>${itemData.language}</h6>
                      </td>
                      <td>
                        <h6><span class="badge badge-${badge} text-white">${itemData.usotemplate}</span></h6>
                      </td>
                      <td>
                      <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
                      aria-haspopup="true" aria-expanded="false">Opções</button>
                    <div class="dropdown-menu">
                      <a class="dropdown-item"
                        href="#" onclick="deleteTemplateMensagem(${itemData.pk})">Excluir</a>
                        <a class="dropdown-item"
                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#criar_template_mensagem" onclick="edit_template_mensagem(${itemData.pk})">Editar</a>
                        <a class="dropdown-item"
                        href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes" onclick="ver_componentes(${itemData.wpp_id})">Ver Componentes</a>
                    </div>
                      </td>`
                      

                        tbody.appendChild(row);
                    });
                    page2++;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar mais itens:', error);
            }).finally(() => {
                // Marcar que terminamos de carregar
                loading2 = false;
                loader2.style.display = 'none';
            });
    }

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega2 && verifica_pagina == 'Mensagens') {
            loadMoreItems2();
        }
    });


(function ($) {
  var bestPictures = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
        url: `/pt/api/retorna_nome_mensagens_template/?query=%QUERY&id=${$("#form-edit-template").data('id')}`,
        wildcard: "%QUERY",
        filter: function (response) {
            console.log(response);

            // Agrupa os resultados com base no valor 'template_name'
            var groupedResults = response.reduce(function (groups, item) {
                var templateName = item.template_name;

                if (!groups[templateName]) {
                    groups[templateName] = [];
                }

                groups[templateName].push(item);

                return groups;
            }, {});

            // Converte os resultados agrupados em uma lista
            var groupedArray = Object.keys(groupedResults).map(function (key) {
                return {
                    'template_name': key,
                    'grouped_results': groupedResults[key]
                };
            });

            return groupedArray;
        }
    }
});

$("#remote-mensagens .typeahead").on('typeahead:asyncrequest', function () {
  // Mostrar indicador de carregamento
  $(".loading-indicator-2").show();
});

$("#remote-mensagens .typeahead").on('typeahead:asyncreceive', function () {
  // Esconder indicador de carregamento
  $(".loading-indicator-2").hide();
});

  $("#remote-mensagens .typeahead").typeahead(null, {
    name: "mensagens",
    display: 'template_name',
    source: bestPictures
  }).on('typeahead:selected', function (e, datum) {
    loader2.style.display='block';
    const tbody = table2.querySelector('tbody');
    tbody.innerHTML=''
    
    // Aqui você pode acessar o ID do item selecionado como datum.id
    var selectedId = datum.grouped_results[0].id;
    fetch(`/pt/api/bmm_template_msgs/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if(data.id){
          if(data.usotemplate == 'OPTIN'){
            var badge = 'secondary'
          }
          else{
            var badge = 'success'
          }
          tbody.innerHTML = `
          <tr>
          <td>
            <div class="media">
              <div class="square-box me-2"><i class="fa fa-file-text-o txt-info"></i></div>
              <div class="media-body ps-2">
                <div class="avatar-details"><a href="/">
                    <h6>${data.wpptemplate.template_name}</h6>
                  </a><span>${data.wpptemplate.category}</span></div>
              </div>
            </div>
          </td>
          <td class="img-content-box">
            <h6>${data.wpptemplate.language}</h6>
          </td>
          <td>
            <h6><span class="badge badge-${badge} text-white">${data.usotemplate}</span></h6>
          </td>
          <td>
          <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">Opções</button>
        <div class="dropdown-menu">
          <a class="dropdown-item"
            href="#" onclick="deleteTemplateMensagem(${data.id})">Excluir</a>
            <a class="dropdown-item"
            href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#criar_template_mensagem" onclick="edit_template_mensagem(${data.id})">Editar</a>
            <a class="dropdown-item"
            href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes(${data.wpptemplate.id})">Ver Componentes</a>
        </div>
          </td>
        </tr>
          `
          loader2.style.display='none';
          recarrega2 = false;
        }
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
  })

  $("#remote-mensagens .typeahead").on('input', function() {
    if ($(this).val() === '') {
      $(".loading-indicator-2").hide();
      loader2.style.display='block';
      var tbody = table2.querySelector('tbody');
      tbody.innerHTML=''
      
      // O campo de pesquisa foi apagado
    // Faça uma requisição para buscar as opções que estavam antes aqui
    fetch(`/pt/api/retorna_nome_mensagens_template/?id=${$("#form-edit-template").data('id')}`)
    .then(response => response.json())
    .then(data => {
      if(data){
        var pill = []
        for(let i = 0; i<data.length; i++){
          if(data[i].uso_template == 'OPTIN'){
            var badge = 'secondary'
          }
          else{
            var badge = 'success'
          }
          pill += `
          <tr>
          <td>
            <div class="media">
              <div class="square-box me-2"><i class="fa fa-file-text-o txt-info"></i></div>
              <div class="media-body ps-2">
                <div class="avatar-details"><a href="/">
                    <h6>${data[i].template_name}</h6>
                  </a><span>${data[i].categoria}</span></div>
              </div>
            </div>
          </td>
          <td class="img-content-box">
            <h6>${data[i].language}</h6>
          </td>
          <td>
            <h6><span class="badge badge-${badge} text-white">${data[i].uso_template}</span></h6>
          </td>
          <td>
          <button class="btn btn-primary dropdown-toggle" type="button" data-bs-toggle="dropdown"
          aria-haspopup="true" aria-expanded="false">Opções</button>
        <div class="dropdown-menu">
          <a class="dropdown-item"
            href="#" onclick="deleteTemplateMensagem(${data[i].id})">Excluir</a>
            <a class="dropdown-item"
            href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#criar_template_mensagem" onclick="edit_template_mensagem(${data[i].id})">Editar</a>
            <a class="dropdown-item"
            href="javascript:void(0)" data-bs-toggle="modal" data-bs-target="#ver_componentes"  onclick="ver_componentes(${data[i].wpp_id})">Ver Componentes</a>
        </div>
          </td>
        </tr>
          `
        }
        tbody.innerHTML = pill
        loader2.style.display='none';
        recarrega2 = true
        page2 = 2;
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

function deleteTemplateMensagem(index){
  swal({
    title: "Tem certeza?",
    text: "Tem certeza que deseja excluir esse Template mensagem?",
    icon: "warning",
    buttons: true,
    dangerMode: true
  }).then((willDelete) => {
    if (willDelete) {
      fetch(`/pt/api/bmm_template_msgs/${index}/`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken,
        },
      }).then(response => {
        if (response.status === 204) {
          swal({
            icon: 'success',
            title: 'Template Mensagem Excluido!',
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

function edit_template_mensagem(index){
  $("#salvar_template_mensagem").data('id',index)
  swal({
    title: 'Aguarde...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    onOpen: () => {
        swal.showLoading();
    }
});
  fetch(`/pt/api/bmm_template_msgs/${index}/`)
      .then(response => response.json())
      .then(data => {
        console.log(data)
        if(data.id){
          $("#select_wpp_templates").val(data.wpptemplate.id).trigger('change')
          $("#usotemplate").val(data.usotemplate).trigger('change')
          swal.close();
        }
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
}

$("#criar_template_mensagem_btn").on('click',function(){
  $("#salvar_template_mensagem").data('id','new')
  $("#select_wpp_templates").val('').trigger('change')
  $("#usotemplate").val('OPTIN').trigger('change')
})



// Area componentes
function ver_componentes(index){
  swal({
    title: 'Aguarde...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    allowEnterKey: false,
    showConfirmButton: false,
    onOpen: () => {
        swal.showLoading();
    }
  });
  fetch(`/pt/api/wpp_templatescomponents_retorno/${index}/`,{
  }).then(response => response.json())
  .then(data => {
    console.log(data)
    if(data){
      var body = document.getElementById('body_componentes')
      // body.innerHTML=''
      var div = []
      console.log(data)
        let contentClass = "";
        for(let i = 0; i< data.length; i++){
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
          div +=`
          <a href='#' data-bs-toggle="modal" data-bs-target="#modalAddcomponente" onclick='editar_component(${data[i].id})'>
            <div class="col-12">
              <div class="card">
                <div class="media p-20">
                  <div class="media-body">
                    <h6 class="mt-0 mega-title-badge">${data[i].format}
                      <span class="badge ${contentClass} pull-right digits" data-id="${data[i].template}" data-tipo="${data[i].component_type}" id="span_componente_tipo_${data[i].id}">${data[i].component_type}</span>
                    </h6>
                    <p style='color:black;' id="text_content_${data[i].id}">${data[i].text_content}</p>
                    <button class='btn btn-primary' onclick='habilitarEdicao(${data[i].id})'>Editar</button>
                    <button class='btn btn-info' onclick='salvarEdicao(${data[i].id})' style='display:none;'>Salvar</button>
                  </div>
                </div>
              </div>
            </div>
          </a>
        `;
        }
        body.innerHTML = div
        swal.close()
    }
  
  })
}
// Função para habilitar a edição
window.habilitarEdicao = function (id) {
  var textContentElement = document.getElementById(`text_content_${id}`);
  textContentElement.contentEditable = true;
  textContentElement.style.border = "1px solid #ccc";

  // Exibir o botão "Salvar"
  var salvarButton = document.querySelector(`button[onclick='salvarEdicao(${id})']`);
  salvarButton.style.display = 'inline';
};

// Função para salvar as edições
window.salvarEdicao = function (id) {
  var textContentElement = document.getElementById(`text_content_${id}`);
  var component_type = document.getElementById(`span_componente_tipo_${id}`)
  textContentElement.contentEditable = false;
  textContentElement.style.border = "none";
  fetch(`/pt/api/wpp_templatescomponents/${id}/`,{
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': csrftoken,
    },
    body:JSON.stringify({
      template: component_type.dataset.id,
      component_type: component_type.dataset.tipo,
      text_content: textContentElement.innerText
    })
  }).then(response => response.json())
  .then(data => {
    if(data){
      console.log(data)
    }
  })

  // Ocultar o botão "Salvar"
  var salvarButton = document.querySelector(`button[onclick='salvarEdicao(${id})']`);
  salvarButton.style.display = 'none';
};




// Tabela itens

function gera_tabela_itens(index){
  let rowsHTML = ''; // String para construir HTML
  let badge, badgeClass;

  // Verifica se index é um objeto único e não um array, e o converte para um array
  if (!Array.isArray(index)) {
    index = [index];
  }

  for(let i = 0; i < index.length; i++){
    badge = index[i].produto_bloqueado === 'N' ? 'success' : 'danger';
    badgeClass = `badge badge-${badge} text-white`;

    rowsHTML += `
    <tr>
      <td>
        <div class="media">
          <div class="square-box me-2"><img src="${index[i].imagem}"  style="width: 100%; height: 100%; object-fit: contain;"></div>
          <div class="media-body ps-2">
            <div class="avatar-details"><a href="/">
                <h6>${index[i].descricao}</h6>
              </a><span>${index[i].id}</span></div>
          </div>
        </div>
      </td>
      <td class="img-content-box"><h6>${formatarComDuasCasasDecimais(index[i].valor_atacado)}</h6></td>
      <td><h6>${formatarComDuasCasasDecimais(index[i].valor_unitario)}</h6></td>
      <td style="width: 100px;"><h6>${formatarComDuasCasasDecimais(index[i].valor_total_item)}</h6></td>
      <td><h6>${index[i].unidade_caixa}</h6></td>
      <td><h6>${index[i].unidade_venda}</h6></td>
      <td><h6><span class="${badgeClass}">${index[i].produto_bloqueado}</span></h6></td>
      <td><h6>${index[i].arquivo_import}</h6></td>
    </tr>`;
  }
  
  return rowsHTML; // Definir HTML de uma vez
}

function formatarComDuasCasasDecimais(valor) {
  // Garante que o valor seja um número
  const numero = Number(valor);

  // Formata o número com duas casas decimais
  return numero.toFixed(2);
}

var loader3 = document.getElementById('loader3');
const table3 = document.getElementById('item-table3');
var recarrega_itens = true;
var page_itens = 2;
(function ($) {
  var bestPictures = new Bloodhound({
    datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
    queryTokenizer: Bloodhound.tokenizers.whitespace,
    prefetch: "",
    remote: {
      url: `/pt/api/retorna_nome_itens/?query=%QUERY&id=${$("#form-edit-template").data('id')}`,
      wildcard: "%QUERY",
      filter: function (response) {
        console.log(response)
        return response; // Assumindo que a API retorna a lista diretamente
      }
    }
  });

  $("#scrollable-dropdown-menu .typeahead").on('typeahead:asyncrequest', function () {
    // Mostrar indicador de carregamento
    $(".loading-indicator-3").show();
  });

  $("#scrollable-dropdown-menu .typeahead").on('typeahead:asyncreceive', function () {
    // Esconder indicador de carregamento
    $(".loading-indicator-3").hide();
  });

  $("#scrollable-dropdown-menu .typeahead").typeahead(null, {
    name: "",
    limit: 10,
    display: 'descricao',
    source: bestPictures
  }).on('typeahead:selected', function (e, datum) {
    loader3.style.display='block';
    const tbody = table3.querySelector('tbody');
    tbody.innerHTML=''
    
    // Aqui você pode acessar o ID do item selecionado como datum.id
    var selectedId = datum.id;
    console.log(datum)
    fetch(`/pt/api/retorna_nome_itens/${selectedId}/`)
      .then(response => response.json())
      .then(data => {
        var rows = '<div>Não há resultados</div>'
        if(data.id){
          rows = gera_tabela_itens(data)
        }
        tbody.innerHTML = rows
        loader3.style.display = 'none';
        recarrega_itens = false;
        
      })
      .catch(error => {
        console.error('Erro ao buscar dados:', error);
      });
  })

  $("#scrollable-dropdown-menu .typeahead").on('input', function() {
    if ($(this).val() === '') {
      $(".loading-indicator-3").hide();
      loader3.style.display='block';
      var tbody = table3.querySelector('tbody');
      tbody.innerHTML=''
      
      // O campo de pesquisa foi apagado
    // Faça uma requisição para buscar as opções que estavam antes aqui
    fetch(`/pt/api/retorna_nome_itens/?id=${$("#form-edit-template").data('id')}`)
    .then(response => response.json())
    .then(data => {
        var rows = '<div class="text-center">Não há resultados</div>'
        if(data){
          rows = gera_tabela_itens(data)
        }
        tbody.innerHTML = rows
        loader3.style.display='none';
        recarrega_itens = true
        page_itens = 2;
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

let loading3 = false; // Flag para evitar solicitações simultâneas
    function loadMoreItems3() {
        if (loading3){
            loader3.style.display = 'block';
            return; // Evitar solicitações simultâneas
        }

        loader3.style.display = 'none'
        // Marcar que estamos carregando itens
        loading3 = true;
        fetch(`/pt/load_more_itens_templates/?page=${page_itens}&id=${$("#form-edit-template").data('id')}`)
            .then(response => response.json())
            .then(data => {
                console.log(data)
                const items = data.items;
                if (items.length > 0) {
                    const tbody = table3.querySelector('tbody');
                    let badge, badgeClass
                    items.forEach(itemData => {
                      console.log(itemData)
                        const row = document.createElement('tr');
                        badge = itemData.produto_bloqueado === 'N' ? 'success' : 'danger';
                        badgeClass = `badge badge-${badge} text-white`;
                        row.innerHTML = `
                        <td>
                          <div class="media">
                            <div class="square-box me-2"><img src="${itemData.imagem}"  style="width: 100%; height: 100%; object-fit: contain;"></div>
                            <div class="media-body ps-2">
                              <div class="avatar-details"><a href="/">
                                  <h6>${itemData.descricao}</h6>
                                </a><span>${itemData.id}</span></div>
                            </div>
                          </div>
                        </td>
                        <td class="img-content-box"><h6>${itemData.valor_atacado}</h6></td>
                        <td><h6>${itemData.valor_unitario}</h6></td>
                        <td style="width: 100px;"><h6>${itemData.valor_total_item}</h6></td>
                        <td><h6>${itemData.unidade_caixa}</h6></td>
                        <td><h6>${itemData.unidade_venda}</h6></td>
                        <td><h6><span class="${badgeClass}">${itemData.produto_bloqueado}</span></h6></td>
                        <td><h6>${itemData.arquivo_import}</h6></td>
                      `
                      

                        tbody.appendChild(row);
                    });
                    page_itens++;
                }
            })
            .catch(error => {
                console.error('Erro ao carregar mais itens:', error);
            }).finally(() => {
                // Marcar que terminamos de carregar
                loading3 = false;
                loader3.style.display = 'none';
            });
    }

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200 && recarrega_itens && verifica_pagina == 'Itens') {
            loadMoreItems3();
        }
    });


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
          fetch(`/pt/api/pausa_campanhas/${index}/`,{
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