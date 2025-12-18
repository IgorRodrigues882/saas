"use strict";
var signup = function(){

    var modal_criar_grupo;
    var botao_salvar_grupo;
    var criar_grupo_validator;

    var botoes_excluir;

    var init = function(){

        
        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        criar_grupo_validator = FormValidation.formValidation(
			modal_criar_grupo,
			{
				fields: {
                    'nome': {
						validators: {
							notEmpty: {
								message: 'Digite o nome do grupo!'
							}
						}
					},
                    'descricao': {
						validators: {
							notEmpty: {
								message: 'Digite a descrição do grupo!'
							}
						}
					},
                },
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap({
						rowSelector: '.mb-3',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		);

        botao_salvar_grupo.addEventListener('click', e => {
            if (criar_grupo_validator) {
                criar_grupo_validator.validate().then(function (status) {
                    if (status == 'Valid') {
                        Swal.fire({
                            text: "Todas as informações foram validadas corretamente! Clique em salvar para prosseguir",
                            icon: "success",
                            buttonsStyling: false,
                            confirmButtonText: "Salvar",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        }).then(function (result) {
                            if (result.isConfirmed) {
                                fetch("auth/grupos/",{
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrftoken,
                                    },
                                    body:JSON.stringify({
                                        nome: document.querySelector('[name="nome"]').value,
                                        descricao: document.querySelector('[name="descricao"]').value,
                                        nivel_permissao: document.querySelector('[name="nivel_permissao"]').value,
                                    }),
                                    method:"POST",
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if(data["sucesso"]) {
                                        Swal.fire({
                                            title: 'Grupo criado com sucesso.',
                                            icon: 'success',
                                            showConfirmButton: false
                                        });
                                        window.location.reload();
                                    } else {
                                        Swal.fire({
                                            title: 'Ocorreu um erro na criação do grupo.',
                                            text: data["erro"],
                                            icon: 'error',
                                            confirmButtonText: 'Entendi',
                                            confirmButtonColor: '#f27474'
                                        });
                                        if (data["erros_serializer"]) {
                                            console.log(data["erros_serializer"]);
                                        }
                                    }
                                })
                            }
                        });
                    } else{
                        Swal.fire({
                            text: "Houve um erro, verifique os campos digitados",
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
        })

        botoes_excluir.forEach(botao => {
            botao.addEventListener('click', e=> {
                Swal.fire({
                    title: 'Tem certeza que deseja excluir esse grupo?',
                    icon: 'info',
                    showConfirmButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'Sim',
                    cancelButtonText: 'Não',
                    confirmButtonColor: '#f27474',
                    cancelButtonColor: '#6c757d'
                })
                .then(response => {
                    if (response.isConfirmed) {
                        fetch("auth/grupos/" + botao.dataset.id + '/',{
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken,
                            },
                            method:"DELETE",
                        })
                        .then(res => {
                            if (res.status == 204) {
                                Swal.fire({
                                    title: 'Grupo deletado com sucesso!',
                                    text: 'Atualizando a página',
                                    icon: 'success',
                                    showConfirmButton: false
                                });
                                window.location.reload();
                            }
                            else {
                                Swal.fire({
                                    title: 'Ocorreu um erro ao deletar o grupo.',
                                    icon: 'error',
                                    confirmButtonText: 'Entendi',
                                    confirmButtonColor: '#f27474'
                                });
                            }
                        })
                    }
                });
            })
        })
        
    }
    return {
        init: function() {
            modal_criar_grupo = document.querySelector('#criar_grupo_permissao');
            botao_salvar_grupo = modal_criar_grupo.querySelector('#salvar_grupo');

            botoes_excluir = document.querySelectorAll('#botao_excluir');

            init();
        }
    };
}()

signup.init()