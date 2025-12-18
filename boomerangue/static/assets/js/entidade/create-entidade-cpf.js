"use strict";
let cidadeAPI_cpf = "";
let cepAntes_cpf = document.getElementById("CEP_cpf").value;
var entidade_cpf = function () {

var forms;
var init = function () {

  
    // Encontra o cookie que contém o csrftoken do Django
    const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
    // Extrai o valor do csrftoken do cookie
    const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

    var validation = Array.prototype.filter.call(forms, function (form) {
        form.addEventListener('submit', function (event) {
            if (form.checkValidity() === false) {
                event.preventDefault();
                event.stopPropagation();
            }
            else {
                event.preventDefault();
                event.stopPropagation();
                fetchApi();

            }
            form.classList.add('was-validated');
        }, false);
    });


    function validarCPF(cpf) {
        // Remover caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');
    
        // Verificar se o CPF tem 11 dígitos
        if (cpf.length !== 11) {
          return false;
        }
    
        // Verificar dígitos verificadores
        const digitos = cpf.split('').map(Number);
        const pesosPrimeiroDigito = [10, 9, 8, 7, 6, 5, 4, 3, 2];
        const pesosSegundoDigito = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2];
    
        function calcularDigitoVerificador(pesos) {
          const soma = digitos.slice(0, pesos.length).reduce((acc, val, idx) => acc + val * pesos[idx], 0);
          const resto = soma % 11;
          return resto < 2 ? 0 : 11 - resto;
        }
    
        const primeiroDigitoVerificador = calcularDigitoVerificador(pesosPrimeiroDigito);
        const segundoDigitoVerificador = calcularDigitoVerificador(pesosSegundoDigito);
    
        return (
          digitos[9] === primeiroDigitoVerificador && digitos[10] === segundoDigitoVerificador
        );
    }
    


    function fetchApi() {

        // Ajusta formato moedas
        function removeCurrencyFormatting(value) {
            // Remove o prefixo, separador de milhares e qualquer caractere não numérico
            return value.replace(/[^0-9,-]/g, '').replace(',', '');
        }

      function changeDateFormat(value) {
        if (value[2] !== '/' ) { // not in correct form
          return 
        } else {
          const year = value[6]+value[7]+value[8]+value[9];
          const month = value[3] + value[4];
          const day = value[0] + value[1];
          return year + '-' + month + '-' + day;
        }
      }


      if (validarCPF($("#CPF").val())) {
            const data = {
                Entidade: $("#Entidade_cpf").val() || null,
                CNPJ: $("#CPF").val() || null,
                Cliente: $("#Cliente_cpf").val() || null,
                Endereco: $("#Endereco_cpf").val() || null,
                Numero: $("#Numero_cpf").val(),
                Bairro: $("#Bairro_cpf").val() || null,
                Complemento: $("#Complemento_cpf").val() || null,
                cidade: $("#Cidade_cpf").data("pk") || null,
                uf: $("#uf_cpf").data('pk') || null,
                pais: $("#pais_cpf").data('pk') || null,
                CEP: $("#CEP_cpf").val() || null,
                Telefone1: $("#Telefone1_cpf").val() || null,
                Telefone2: $("#Telefone2_cpf").val() || null,
                WhatsAPPComercial: $("#WhatsAPPComercial_cpf").val() || null,
                Entidade_Ativa: $("#Entidade_Ativa_cpf").val() || null,
                NomeContato: $("#NomeContato_cpf").val() || null,
                SobrenomeContato: $("#SobrenomeContato_cpf").val() || null,
                EDI_Integracao: null,
                TokenCliente: null,
                
                // Outros campos e valores aqui...
            };
        
        
            fetch('api/create-entidade/', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    'X-CSRFToken': csrftoken,
                },
                body: JSON.stringify(data),
            }).then((response) => response.json())
                .then((data) => {
                    console.log(data)
                    if (data.id) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Entidade criada com sucesso!',
                            showConfirmButton: false,
                            timer: 1500
                        })
                    }
                    else {
                        Swal.fire({
                            text: "Ocorreu um erro ao tentar salvar "+ data.error,
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
        else{
            Swal.fire({
                text: "CPF Inválido",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            });
        }
        
        
    }

    function criaOptionsCidades(uf, cidade) {
        var Cidade = document.getElementById("Cidade_cpf")
        fetch(`api/pegacidade/${uf}/`)
            .then(response => response.json())
            .then(data => {
         
                if (data.cidades) {
            
                    Cidade.innerHTML = ""
            
                    var lista = []
                    for (var i = 0; i < data.cidades.length; i++) {
                

                        lista += `<option value="${data.cidades[i].Cidade}" data-pk="${data.cidades[i].pk}">${data.cidades[i].Cidade}</option>`

                    }

                    Cidade.innerHTML = lista
                    if (cidade != "") {
                        console.log("entrou")
                      Cidade.value = cidade;
                      
                      Cidade.dispatchEvent(new Event('change'));
                    }

                }
            })
    }

    $("#uf_cpf").on("change", function (e) {
      console.log('mudou uf', cidadeAPI_cpf)
      criaOptionsCidades(e.target.value, cidadeAPI_cpf)
      var selectedOption = $(this).find("option:selected");
      var selectedPk = selectedOption.data("pk");

      // Defina o valor do atributo data-pk do select
      $(this).data("pk", selectedPk);

      // Exemplo de como acessar o data-pk do select
      var selectPk = $(this).data("pk");
      console.log("Data-pk do select:", selectPk);
  })
  $("#Cidade_cpf").on("change",function(){
    var selectedOption = $(this).find("option:selected");
    var selectedPk = selectedOption.data("pk");

    // Defina o valor do atributo data-pk do select
    $(this).data("pk", selectedPk);

    // Exemplo de como acessar o data-pk do select
    var selectPk = $(this).data("pk");
    console.log("Data-pk do select:", selectPk);
  });
  $("#pais_cpf").on("change",function(){
    var selectedOption = $(this).find("option:selected");
    var selectedPk = selectedOption.data("pk");

    // Defina o valor do atributo data-pk do select
    $(this).data("pk", selectedPk);

    // Exemplo de como acessar o data-pk do select
    var selectPk = $(this).data("pk");
    console.log("Data-pk do select:", selectPk);
});

$("#limpa_campos").on('click',function(){
    Swal.fire({
        text: "Tem certeza de limpar todos os campos?",
        icon: "error",
        showCancelButton: true,  // Adiciona o botão de cancelar
        confirmButtonText: "Confirmar",
        cancelButtonText: "Cancelar",
        buttonsStyling: false,
        customClass: {
            confirmButton: "btn btn-primary me-2",
            cancelButton: "btn btn-secondary"  // Estiliza o botão de cancelar
        }
    }).then((result)=>{
        if(result){
            for (let form of forms) {
                let inputs = form.querySelectorAll('input');
                inputs.forEach(input => {
                    input.value = '';  // Aqui você pode acessar o valor de cada input
                });
            }
        }
    })
})

}
return {
    init: function () {
        forms = document.getElementsByClassName('needs-validation-cpf');
        Inputmask({ mask: '999.999.999-99' }).mask($("#CPF"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#Telefone1_cpf"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#Telefone2"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#WhatsAPPComercial_cpf"));
        Inputmask({ mask: '99999-999'}).mask($("#CEP_cpf"))
        init();
    }
};
}();

entidade_cpf.init();

// Busca endereço pelo cep
(function () {
    const cepInput = document.getElementById("CEP_cpf");
    const enderecoInput = document.getElementById("Endereco_cpf");
    const bairroInput = document.getElementById("Bairro_cpf");
    const paisSelect = document.getElementById("pais_cpf");
    const ufSelect = document.getElementById("uf_cpf");
    const cidadeSelect = document.getElementById("Cidade_cpf");
    cepInput.addEventListener('blur', e => {
        if (cepAntes_cpf === e.target.value) {
            console.log('CEP IGUAL')
            return;
        }
        cepAntes_cpf = e.target.value;
      const value = cepInput.value.replace(/[^0-9]+/, '');
      const url = `https://viacep.com.br/ws/${value}/json/`;
      cidadeAPI_cpf = ""
      fetch(url)
        .then(response => response.json())
          .then(json => {
            console.log(json)
          if (json.logradouro) {
            enderecoInput.value = json.logradouro;
            bairroInput.value = json.bairro;
            paisSelect.value = "Brazil";
              paisSelect.dispatchEvent(new Event('change'));
              cidadeAPI_cpf = json.localidade; // verificado no console.log
            ufSelect.value = json.uf;
            ufSelect.dispatchEvent(new Event('change'));

          } else {
            Swal.fire({
              text: "Este CEP não existe!",
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
  })();

// Busca dados pelo cnpj
// (function () {
//     const cnpjInput = document.getElementById("CNPJ");
//     const cep = document.getElementById("CEP")
//     cnpjInput.addEventListener('blur', e => {
//       const value = cnpjInput.value.replace(/\D/g, '');
//       const url = `https://publica.cnpj.ws/cnpj/${value}`;

//     const options = {
//     method: "GET",
//     headers: {
//         Accept: "application/json",
//     }
//     };
  
//   fetch(url,options)
//     .then(response => response.json())
//     .then(data => {
//       console.log(data);
//       if (data) {
//         $("#Entidade").val(data.razao_social)
//         $("#Fantasia").val(data.estabelecimento.nome_fantasia)
//         $("#InscricaoEstadual").val(data.estabelecimento.inscricoes_estaduais[0].inscricao_estadual)
//         cep.value = data.estabelecimento.cep
//         cep.dispatchEvent(new Event('blur'))
//         $("#Numero").val(data.estabelecimento.numero)
//         $("#ReceitaDataSituacao").val(data.estabelecimento.data_situacao_cadastral)
//         $("#Telefone1").val(data.estabelecimento.ddd1 + data.estabelecimento.telefone1)
//         $("#Telefone2").val(data.estabelecimento.ddd2 + data.estabelecimento.telefone2)
//         $("#Email_Comercial").val(data.estabelecimento.email)
//         $("#Complemento").val(data.estabelecimento.complemento)
//         $("#DtAberturaEmpresa").val(data.estabelecimento.data_inicio_atividade)
//         $("#Capital_Social").val(data.capital_social)
//         if(data.estabelecimento.situacao_cadastral == 'Ativa'){
//             $("#ReceitaAtivo").val('S').trigger('change')
//         }
//         else{
//             $("#ReceitaAtivo").val('N').trigger('change')
//         }

  
//       } else {
//         Swal.fire({
//           text: "Este CNPJ não existe!",
//           icon: "error",
//           buttonsStyling: false,
//           confirmButtonText: "Ok",
//           customClass: {
//             confirmButton: "btn btn-primary"
//           }
//         });
//       }
//     })
//     .catch(error => {
//       console.error('Erro ao buscar informações do CNPJ', error);
//     });
// });
//   })();