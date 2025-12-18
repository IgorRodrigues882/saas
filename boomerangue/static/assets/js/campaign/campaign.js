"use strict";
var campaign = function(){

    var create_campaign;
    var init = function(){


        

        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        // Inicialize uma variável para rastrear o status do envio de imagens
            let imagesUploaded = false;
            let csv = false;
            // Configure os Dropzones
            Dropzone.options.ImageBannerPC = {
            paramName: "ImageBannerPC",
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
                imagesUploaded=true

            }
            };

            Dropzone.options.ImageBannerMobile = {
            paramName: "ImageBannerMobile",
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
                imagesUploaded=true
            }
            };

            Dropzone.options.csvArquivos = {
                paramName: "csvArquivos",
                maxFiles: 10,
                maxFilesize: 5,
                acceptedFiles: ".csv", // Aceitar apenas arquivos de imagem
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
                    csv = true
                }
                };

            // Função que é acionada quando o botão de criação da campanha é clicado
            create_campaign.addEventListener('click', function () {
                Swal.fire({
                    title: 'Aguarde',
                    text: 'Por favor, espere...',
                    icon: 'info',
                    allowOutsideClick: false,
                    showConfirmButton: false,
                    willOpen: () => {
                        Swal.showLoading()
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
                data.append("EdiCampanha", $("#EdiCampanha").val() || '');
                data.append("bot_id", $("#bot_id").val() || '')
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
                data.append("horario_inicio", horario_inicio !== "" ? horario_inicio : '00:00');
                data.append("horario_fim", horario_fim !== "" ? horario_fim : '00:00');
                data.append("gateway_pagamento",  $("#gateway_pagamento").val() || '');
                
                

                // Obtenha as imagens enviadas pelos Dropzones
                if (imagesUploaded) {
                    const dropzone1 = Dropzone.forElement("#ImageBannerPC");
                    const dropzone2 = Dropzone.forElement("#ImageBannerMobile");
                    if (dropzone1.getQueuedFiles().length > 0) {
                        data.append("ImageBannerPC", dropzone1.getQueuedFiles()[0]);
                    }

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

                if($("#template").val() == ""){
                    Swal.fire({
                        text: "Template não pode estar vazio!",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                        confirmButton: "btn btn-primary"
                        }
                    });
                    return;
                }

                if($("#EdiCampanha").val() == ""){
                    Swal.fire({
                        text: "EDI Campanha não pode estar vazio!",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                        confirmButton: "btn btn-primary"
                        }
                    });
                    return;
                }

                if($("#bot_id").val() == ''){
                    Swal.fire({
                        text: "Bot Envio não pode estar vazio!",
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
                fetch('api/campanhas/', {
                method: "POST",
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
                        
                                    fetch('api/importa_csv/', {
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
                                            Swal.fire({
                                                text: "Ocorreu um erro ao tentar salvar",
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
                    } 
                    else if(data.error){
                        Swal.fire({
                            text: "Ocorreu um erro ao tentar salvar, "+ data.error,
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok",
                            customClass: {
                            confirmButton: "btn btn-primary"
                            }
                        });
                    }
                    else {
                    Swal.fire({
                        text: "Ocorreu um erro ao tentar salvar",
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
        function formatDate(inputDate) {
                if(!inputDate){
                    return null;
                }
                // Divida a data em dia, mês e ano
                var parts = inputDate.split('/');
                var day = parts[0];
                var month = parts[1];
                var year = parts[2];
              
                // Crie uma nova data no formato desejado (horário definido como meio-dia)
                var formattedDate = year + '-' + month + '-' + day;
              
                return formattedDate;
              }

              $("#sugere_edi").on('click', function(e){
                $(this).html('');
                $(this).html('<i class="fa fa-spin fa-spinner"></i>');
                fetch('api/campanhas/ultima_campanha/', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    }
                })
                .then(response => {
                    if (!response.ok) {
                        $(this).html('<i class="fa fa-times-circle"></i>')
                        throw new Error('Erro ao buscar a última campanha');
                        
                    }
                    return response.json();
                })
                .then(data => {
                    if (data.id) {
                        console.log("ID da última campanha: ", data.id);
                        // Aqui você pode fazer algo com o ID, como sugerir um nome baseado nele
                        document.getElementById('EdiCampanha').value = data.prefixo + "_" + (data.id + 1);
                        $(this).html('<i class="icofont icofont-idea"></i>')
                    } else {
                        console.error(data.error); // Trate o erro como achar melhor
                        $(this).html('<i class="fa fa-times-circle"></i>')
                    }
                })
                .catch(error => {
                    console.error('Erro na fetch: ', error);
                    $(this).html('<i class="fa fa-times-circle"></i>')
                });
            });



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
                    fetch(`api/bmm_template/${value}/`)
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
            
            

    }
    return {
        init: function() {
            create_campaign = document.getElementById("create_campaign");
            init();
        }
    };
}()

campaign.init()

function setCookie(name, value, daysToExpire) {
    var expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + daysToExpire);
    var cookieValue = name + "=" + value + "; expires=" + expirationDate.toUTCString();
    document.cookie = cookieValue;
}

function checkCookie(cookieName) {
    var cookies = document.cookie.split("; ");
    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i].split("=");
        if (cookie[0] === cookieName) {
            return cookie[1];
        }
    }
    return null; // Retorna null se o cookie não for encontrado
}

function scrollToBottom() {
    window.scrollTo(0, document.body.scrollHeight);
}


    var nomeDoCookie = "campaign_create"; // Substitua pelo nome do seu cookie
    var cookieValor = checkCookie(nomeDoCookie);

    if (cookieValor !== null) {
        // O cookie existe, execute a função desejada aqui
        console.log("Cookie encontrado. Valor: " + cookieValor);
        // Chame sua função aqui
    } else {

        scrollToBottom()
        introJs().start();


        setCookie(nomeDoCookie, "200", 365);
    }



