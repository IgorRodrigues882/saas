"use strict";
var signup = function(){

    var modal_criar_usuario;
    var botao_salvar_usuario;
    var criar_usuario_validator;

    var modal_editar_usuario;
    var botoes_editar_usuario;
    var botao_salvar_editar_usuario;
    var editar_usuario_validator;

    
    var botoes_permissoes;
    var modal_permissoes;
    var nome_modal_permissoes;
    var botao_salvar_permissoes;
    var inputs_permissoes;

    var botoes_excluir;

    var init = function(){

        // Encontra o cookie que contém o csrftoken do Django
        const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
        // Extrai o valor do csrftoken do cookie
        const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

        criar_usuario_validator = FormValidation.formValidation(
			modal_criar_usuario,
			{
				fields: {
                    // 'avatar': {
					// 	validators: {
					// 		file: {
					// 			extension: 'jpg,jpeg,png',
					// 			type: 'image/jpeg,image/png',
					// 			message: 'O tipo de arquivo selecionado não é válido, é permitido: jpg,jpeg,png'
					// 		},
					// 	}
					// },
                    'nome': {
						validators: {
							notEmpty: {
								message: 'Digite seu nome!'
							}
						}
					},
                    'email': {
						validators: {
							notEmpty: {
								message: 'Digite seu endereço de e-mail!'
							},
							emailAddress: {
								message: 'Email Inválido!'
							}
						}
					},
					
					'senha': {
						validators: {
							notEmpty: {
								message: 'Digite sua senha!'
							}
						}
					},
					'repetir-senha': {
						validators: {
							identical: {
								compare: function () {
									return modal_criar_usuario.querySelector('#senha').value;
								},
								message: 'As senhas não são iguais'
							}
						}
					},
					'telefone': {
						validators: {
							notEmpty: {
								message: 'Digite seu telefone!'
							},
                            callback: {
                                message: 'Telefone inválido!',
                                callback: function(value, validator, $field) {
                                  // Verifica se o valor termina com "_" (não digitou completamente)
                                  return !value.value.endsWith('_');
                                }
                              }
                          
						}
					},
                },
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap({
						rowSelector: '.form-row .mb-3',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		);

        editar_usuario_validator = FormValidation.formValidation(
			modal_editar_usuario,
			{
				fields: {
                    // 'avatar': {
					// 	validators: {
					// 		file: {
					// 			extension: 'jpg,jpeg,png',
					// 			type: 'image/jpeg,image/png',
					// 			message: 'O tipo de arquivo selecionado não é válido, é permitido: jpg,jpeg,png'
					// 		},
					// 	}
					// },
                    'editar-nome': {
						validators: {
							notEmpty: {
								message: 'Digite seu nome!'
							}
						}
					},
                    'editar-email': {
						validators: {
							notEmpty: {
								message: 'Digite seu endereço de e-mail!'
							},
							emailAddress: {
								message: 'Email Inválido!'
							}
						}
					},
					
					'editar-repetir-senha': {
						validators: {
							identical: {
								compare: function () {
									return modal_editar_usuario.querySelector('#editar-senha').value;
								},
								message: 'As senhas não são iguais'
							}
						}
					},
					'editar-telefone': {
						validators: {
							notEmpty: {
								message: 'Digite seu telefone!'
							},
                            callback: {
                                message: 'Telefone inválido!',
                                callback: function(value, validator, $field) {
                                  // Verifica se o valor termina com "_" (não digitou completamente)
                                  return !value.value.endsWith('_');
                                }
                              }
                          
						}
					},
                },
				plugins: {
					trigger: new FormValidation.plugins.Trigger(),
					bootstrap: new FormValidation.plugins.Bootstrap({
						rowSelector: '.form-row .mb-3',
                        eleInvalidClass: '',
                        eleValidClass: ''
					})
				}
			}
		);

        botao_salvar_usuario.addEventListener('click', e => {
            if (criar_usuario_validator) {
                criar_usuario_validator.validate().then(function (status) {
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
                                fetch("auth/users/",{
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrftoken,
                                    },
                                    body:JSON.stringify({
                                        nome: document.querySelector('[name="nome"]').value,
                                        email: document.querySelector('[name="email"]').value,
                                        telefone: document.querySelector('[name="telefone"]').value,
                                        senha: document.querySelector('[name="senha"]').value,
                                        grupo: document.querySelector('[name="grupo"]').value
                                    }),
                                    method:"POST",
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if(data["sucesso"]) {
                                        Swal.fire({
                                            title: 'Usuário criado com sucesso.',
                                            icon: 'success',
                                            showConfirmButton: false
                                        });
                                        window.location.reload();
                                    } else {
                                        Swal.fire({
                                            title: 'Ocorreu um erro no cadastro.',
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

        botoes_editar_usuario.forEach(botao => {
            botao.addEventListener('click', e => {
                botao_salvar_editar_usuario.dataset.id = botao.dataset.id;
                fetch("auth/users/" + botao.dataset.id + "/",{
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRFToken': csrftoken,
                    },
                    method:"GET",
                })
                .then(res => res.json())
                .then(data => {
                    document.querySelector('[name="editar-nome"]').value = data.nome;
                    document.querySelector('[name="editar-email"]').value = data.email;
                    document.querySelector('[name="editar-telefone"]').value = data.telefone;
                    document.querySelector('[name="editar-grupo"]').value = data.grupo;
                })
            })
        })

        botao_salvar_editar_usuario.addEventListener('click', e => {
            if (editar_usuario_validator) {
                editar_usuario_validator.validate().then(function (status) {
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
                                let data = {
                                    nome: document.querySelector('[name="editar-nome"]').value,
                                    email: document.querySelector('[name="editar-email"]').value,
                                    telefone: document.querySelector('[name="editar-telefone"]').value,
                                    grupo: document.querySelector('[name="editar-grupo"]').value
                                }
                                let senha = document.querySelector('[name="editar-senha"]').value;
                                if (senha) {
                                    data.password = senha;
                                }
                                fetch("auth/users/" + botao_salvar_editar_usuario.dataset.id + "/",{
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'X-CSRFToken': csrftoken,
                                    },
                                    body:JSON.stringify(data),
                                    method:"PUT",
                                })
                                .then(response => response.json())
                                .then(data => {
                                    if(data["sucesso"]) {
                                        Swal.fire({
                                            title: 'Usuário editado com sucesso.',
                                            icon: 'success',
                                            showConfirmButton: false
                                        });
                                        window.location.reload();
                                    } else {
                                        Swal.fire({
                                            title: 'Ocorreu um erro no cadastro.',
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


        botoes_permissoes.forEach(botao => {
            botao.addEventListener('click', e => {
                nome_modal_permissoes.innerText = botao.dataset.nome;
                botao_salvar_permissoes.dataset.id = botao.dataset.id;
            })
        });

        botao_salvar_permissoes.addEventListener('click', e => {
            Swal.fire({
                title: 'Tem certeza que definir estar permissões para ' + nome_modal_permissoes.innerText + '?',
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
                    let permissoes = [];
                    inputs_permissoes.forEach(input => {
                        if (input.checked) {
                            permissoes.push(input.id);
                        }
                    })
                    fetch("auth/users/set_permissions/",{
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRFToken': csrftoken,
                        },
                        body:JSON.stringify({
                            id: botao_salvar_permissoes.dataset.id,
                            permissoes: permissoes
                        }),
                        method:"POST",
                    })
                    .then(response => response.json())
                    .then(data => {
                        if(data["sucesso"]) {
                            Swal.fire({
                                title: 'Permissões alteradas com sucesso!',
                                text: 'Atualizando a página',
                                icon: 'success',
                                showConfirmButton: false
                            });
                            window.location.reload();
                        } else {
                            Swal.fire({
                                title: 'Ocorreu um erro ao alterar as permissões.',
                                text: data["erro"],
                                icon: 'error',
                                confirmButtonText: 'Entendi',
                                confirmButtonColor: '#f27474'
                            });
                        }
                    })
                }
            })
        })

        botoes_excluir.forEach(botao => {
            botao.addEventListener('click', e=> {
                Swal.fire({
                    title: 'Tem certeza que deseja excluir esse usuário?',
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
                        fetch("auth/users/" + botao.dataset.id,{
                            headers: {
                                'Content-Type': 'application/json',
                                'X-CSRFToken': csrftoken,
                            },
                            method:"DELETE",
                        })
                        .then(res => {
                            if (res.status == 204) {
                                Swal.fire({
                                    title: 'Usuário deletado com sucesso!',
                                    text: 'Atualizando a página',
                                    icon: 'success',
                                    showConfirmButton: false
                                });
                                window.location.reload();
                            }
                            else {
                                Swal.fire({
                                    title: 'Ocorreu um erro ao deletar o usuário.',
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
            Inputmask({ mask: '(99) 99999-9999' }).mask($("#telefone"));

            botoes_permissoes = document.querySelectorAll('#botao_permissoes');

            modal_criar_usuario = document.querySelector('#modal_criar_usuario');
            botao_salvar_usuario = modal_criar_usuario.querySelector('#salvar_usuario');

            modal_editar_usuario = document.querySelector('#modal_editar_usuario');
            botao_salvar_editar_usuario = modal_editar_usuario.querySelector('#salvar_editar_usuario');
            botoes_editar_usuario = document.querySelectorAll('#editar_usuario')

            modal_permissoes = document.querySelector('#modal_permissoes');
            nome_modal_permissoes = modal_permissoes.querySelector('#nome_usuario_permissoes');
            inputs_permissoes = modal_permissoes.querySelectorAll('.checkbox_permissao');
            botao_salvar_permissoes = modal_permissoes.querySelector('#salvar_permissoes');

            botoes_excluir = document.querySelectorAll('#botao_excluir');
            init();
        }
    };
}()

signup.init()