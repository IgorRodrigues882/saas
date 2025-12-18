"use strict";
var campaign_atualizacao = function(){
    var create_campaign;
    var init = function(){


        

        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        // Inicialize uma variável para rastrear o status do envio de imagens
            let imagesUploadedPC = false;
            var imageUploadmobile = false;
            let csv = false;
            // Configure os Dropzones
            Dropzone.options.ImageBannerPC = {
            paramName: "ImageBannerPC",
            maxFiles: 1,
            maxFilesize: 5,
            acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
            autoProcessQueue: false, // Desativar o envio automático
            addRemoveLinks: true,
            init: function() {
                this.on("success", function(file, response) {
                // Lógica a ser executada após o upload bem-sucedido, se necessário
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

            Dropzone.options.ImageBannerMobile = {
            paramName: "ImageBannerMobile",
            maxFiles: 1,
            maxFilesize: 5,
            acceptedFiles: "image/*", // Aceitar apenas arquivos de imagem
            autoProcessQueue: false, // Desativar o envio automático
            addRemoveLinks: true,
            init: function() {
                this.on("success", function(file, response) {
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
            };

            Dropzone.options.csvArquivos = {
                paramName: "csvArquivos",
                maxFiles: 10,
                maxFilesize: 5,
                acceptedFiles: ".csv", // Aceitar apenas arquivos de imagem
                autoProcessQueue: false, // Desativar o envio automático
                addRemoveLinks: true,
                init: function() {
                    this.on("success", function(file, response) {
                    // Lógica a ser executada após o upload bem-sucedido, se necessário
                    console.log(response);
                    });
                    this.on("removedfile", function (file) {
                        csv = false;
                        console.log(imagesUploadedPC);
                      });
                  
                      this.on("addedfile", function (file) {
                        csv = true;
                      });
                }
                };

            // Função que é acionada quando o botão de criação da campanha é clicado
            create_campaign.addEventListener('click', function () {
                Swal.fire({
                    title: 'Aguarde...',
                    text: 'Realizando a operação...',
                    showConfirmButton: false,
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    onBeforeOpen: () => {
                        Swal.showLoading();
                    }
                });
            // Verifique se todas as imagens foram enviadas
                // Todas as imagens foram enviadas, agora envie os dados do formulário
                var horario_inicio = $("#horario-inicio").val();
                var horario_fim = $("#horario-fim").val();
                const data = new FormData();
                data.append("Campanha", $("#Campanha").val() || '');
                data.append("TextoHeader", $("#TextoHeader").val() || '');
                data.append("TextoFooter", $("#TextoFooter").val() || '');
                data.append("LinkFooter", $("#LinkFooter").val() || '');
                var textoPromocional = $("#TextoPromocional").val();
                data.append("TextoPromocional", textoPromocional !== "" ? textoPromocional : '');
                data.append("CampanhaAtiva", $("#CampanhaAtiva").val() || '');
                data.append("LinkMarketing", $("#LinkMarketing").val() || '');
                data.append("periodicidade", $("#periodicidade").val() || '');
                data.append("status_campanha", $("#status-campanha").val() || '');
                data.append("tipo_campanha", $("#tipo-campanha").val() || '');
                data.append("template", $("#template").val() || '');
                let data_inicio = $("#data-inicio").val();
                data.append("data_inicio", data_inicio !== "" ? formatDate($("#data-inicio").val()) : '');
                let data_fim = $("#data-fim").val();
                data.append("data_fim", data_fim !== '' ? formatDate($("#data-fim").val()) : '');
                data.append("horario_inicio", horario_inicio !== "" ? horario_inicio : '');
                data.append("horario_fim", horario_fim !== "" ? horario_fim : '');
                data.append("gateway_pagamento",  $("#gateway_pagamento").val() || '');
                

                // Obtenha as imagens enviadas pelos Dropzones
                if (imagesUploadedPC) {
                    const dropzone1 = Dropzone.forElement("#ImageBannerPC");
                    if (dropzone1.getQueuedFiles().length > 0) {
                        data.append("ImageBannerPC", dropzone1.getQueuedFiles()[0]);
                    }


                }

                if(imageUploadmobile){
                    const dropzone2 = Dropzone.forElement("#ImageBannerMobile");
                    if (dropzone2.getQueuedFiles().length > 0) {
                        data.append("ImageBannerMobile", dropzone2.getQueuedFiles()[0]);
                    }

                }

                if($("#Campanha").val() == ""){
                    Swal.fire({
                        text: "Nome da campanha não pode estar vazio!",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                        confirmButton: "btn btn-primary"
                        }
                    });
                    return;
                }

                // Envie os dados do formulário com as imagens
                fetch(`/pt/api/campanhas/${$("#id_campanha").data('id')}/`, {
                method: "PATCH",
                headers: {
                    'X-CSRFToken': csrftoken,
                },
                body: data,
                })
                .then((response) => response.json())
                .then((data) => {
                    console.log(data);

                    if (data.id) {
                        if (csv) {
                            const dropzone3 = Dropzone.forElement("#csvArquivos");
                        
                            if (dropzone3.getQueuedFiles().length > 0) {
                                dropzone3.getQueuedFiles().forEach((arquivo, index) => {
                                    const dados = new FormData();
                                    dados.append("Caminho", arquivo);
                                    dados.append("NomeArquivo", arquivo.name);
                                    dados.append("statusarquivo_id", 'S');
                                    dados.append("campanha", data.id);
                        
                                    fetch('/pt/api/importa_csv/', {
                                        method: "POST",
                                        headers: {
                                            'X-CSRFToken': csrftoken,
                                        },
                                        body: dados,
                                    })
                                    .then((response) => response.json())
                                    .then((res) => {
                                        console.log(res);
                                        if (res.id) {
                                            console.log(res)
                                            
                                            // Swal.fire({
                                            //     icon: 'success',
                                            //     title: 'Campanha salva!',
                                            //     showConfirmButton: false,
                                            //     timer: 1500
                                            // }).then(
                                            //     // window.location.reload()
                                            // );
                                        } else {
                                            let erro = "Ocorreu um erro ao tentar salvar"
                                            if(data.error){
                                                erro = data.error
                                            }
                                            Swal.fire({
                                                text: erro,
                                                icon: "error",
                                                buttonsStyling: false,
                                                confirmButtonText: "Ok",
                                                customClass: {
                                                confirmButton: "btn btn-primary"
                                                }
                                            });
                                        }
                                    });
                                });
                            }
                        }
                    
                        Swal.fire({
                                icon: 'success',
                                title: 'Campanha salva!',
                                showConfirmButton: false,
                                timer: 1500
                            }).then(
                                 window.location.reload()
                            );
                    } else {
                        console.log(data)
                    let erro = "Ocorreu um erro ao tentar salvar"
                    if(data.error){
                        erro = data.error
                    }
                    Swal.fire({
                        text: erro,
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
                    Swal.fire({
                        text: "Ocorreu um erro",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                        confirmButton: "btn btn-primary"
                        }
                    });
                })
            });
        function formatDate(inputDate) {
                console.log('data: ',inputDate)
                // Divida a data em dia, mês e ano
                var parts = inputDate.split('/');
                var day = parts[0];
                var month = parts[1];
                var year = parts[2];
              
                // Crie uma nova data no formato desejado (horário definido como meio-dia)
                var formattedDate = year + '-' + month + '-' + day;
              
                return formattedDate;
              }
        

       

    }
    return {
        init: function() {
            create_campaign = document.getElementById("salvar_alteracoes");
            init();
        }
    };
}()

campaign_atualizacao.init()

function removeImage(templateId, imageType) {
    // Faça uma requisição fetch para a viewset do Django Rest Framework
    fetch(`/pt/api/remove_imagem_campanha/${templateId}/remove_image/?image_type=${imageType}`, {
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
            Swal.fire({
            icon: 'success',
            title: 'Imagem Removida!',
            buttons: false,
            timer: 1500
          }).then(
            window.location.reload()
          )
        }
        // Remova o card ou faça outras atualizações no DOM
    })
    .catch(error => {
        console.error('Erro ao remover imagem:', error);
    });
  }
  

  $("#template").on('change', function(){
    let value = this.value;
        Swal.fire({
            icon: 'info', // Altere para "info" ou qualquer outro ícone conforme sua preferência
            title: '<b>Carregando...</b><br/>', // Adicione um GIF de carregamento aqui
            showConfirmButton: false,
            willOpen: () => {
              Swal.showLoading(); // Mostra o loader antes do conteúdo ser renderizado
            },
            allowOutsideClick: false, // Impede cliques no fundo durante o carregamento
          })
        if(value){
            fetch(`/api/bmm_template/${value}/`)
            .then((res)=>res.json())
            .then(data=>{
                if(data){
                    console.log(data)
                    $('#TextoHeader').val(data.texto_header)
                    $('#TextoFooter').val(data.texto_footer)
                    $('#LinkFooter').val(data.link_footer)
                    $('#TextoPromocional').val(data.texto_promocional)
                    $('#LinkMarketing').val(data.link_marketing)
                    if(data.image_banner_pc){
                        const dropzone1 = Dropzone.forElement("#ImageBannerPC");
                        var url = new URL(data.image_banner_pc);
                        url.protocol = 'https:'; // Altera o protocolo para HTTPS
                        var pathname = url.pathname; // Retorna "/media/media/banner_mobile/provider.png"
                        var filename = pathname.split("/").pop(); // Retorna "provider.png"
                        fetch(url.href)
                        .then(res => res.blob())
                        .then(blob => {
                            const file = new File([blob], filename, {type: "image/*"});
                            dropzone1.removeAllFiles()
                            dropzone1.addFile(file);
                        });
                    }
                    if(data.image_banner_mobile){
                        const dropzone2 = Dropzone.forElement("#ImageBannerMobile");
                        var url = new URL(data.image_banner_mobile);
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
                }
    
            })
            .catch(error=>{
                Swal.fire({
                    text: "Ocorreu um erro ao tentar buscar dados",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                    confirmButton: "btn btn-primary"
                    }
                });
            })
            .finally(()=>{
                Swal.close()
            })
        }
})
