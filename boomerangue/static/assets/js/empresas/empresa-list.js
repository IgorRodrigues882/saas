"use strict";
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
 // Extrai o valor do csrftoken do cookie
 const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
(function($) {
    "use strict";
$('#basic-1').DataTable({
	language: {
		url: '//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json'
	}
});
})(jQuery);


"use strict";
var ecommerce_product = {
	init: function() {
		var sync1 = $("#sync1");
		var sync2 = $("#sync2");
		var slidesPerPage = 4; 
		var syncedSecondary = true;
		sync1.owlCarousel({
			items : 1,
			slideSpeed : 2000,
			nav: false,
			autoplay: true,
			dots: false,
			loop: true,
			responsiveRefreshRate : 200
		}).on('changed.owl.carousel', syncPosition);
		sync2
		.on('initialized.owl.carousel', function () {
			sync2.find(".owl-item").eq(0).addClass("current");
		})
		.owlCarousel({
			items : slidesPerPage,
			dots: false,
			nav: false,
			smartSpeed: 200,
			slideSpeed : 500,
			slideBy: slidesPerPage,
			responsiveRefreshRate : 100,
			margin: 15
		}).on('changed.owl.carousel', syncPosition2);
		function syncPosition(el) {
			var count = el.item.count-1;
			var current = Math.round(el.item.index - (el.item.count/2) - .5);
			if(current < 0) {
				current = count;
			}
			if(current > count) {
				current = 0;
			}
			sync2
			.find(".owl-item")
			.removeClass("current")
			.eq(current)
			.addClass("current");
			var onscreen = sync2.find('.owl-item.active').length - 1;
			var start = sync2.find('.owl-item.active').first().index();
			var end = sync2.find('.owl-item.active').last().index();
			if (current > end) {
				sync2.data('owl.carousel').to(current, 100, true);
			}
			if (current < start) {
				sync2.data('owl.carousel').to(current - onscreen, 100, true);
			}
		}
		function syncPosition2(el) {
			if(syncedSecondary) {
				var number = el.item.index;
				sync1.data('owl.carousel').to(number, 100, true);
			}
		}
		sync2.on("click", ".owl-item", function(e){
			e.preventDefault();
			var number = $(this).index();
			sync1.data('owl.carousel').to(number, 300, true);
		});
	}
};
(function($) {
	"use strict";
	ecommerce_product.init();
})(jQuery);
var ecommerce_product2 = {
	init: function() {
		var sync1 = $("#sync1-rtl");
		var sync2 = $("#sync2-rtl");
		var slidesPerPage = 4;
		var syncedSecondary = true;
		sync1.owlCarousel({
			rtl:true,
			items : 1,
			slideSpeed : 2000,
			nav: false,
			autoplay: true,
			dots: false,
			loop: true,
			responsiveRefreshRate : 200
		}).on('changed.owl.carousel', syncPosition);
		sync2
			.on('initialized.owl.carousel', function () {
				sync2.find(".owl-item").eq(0).addClass("current");
			})
			.owlCarousel({
				rtl:true,
				items : slidesPerPage,
				dots: false,
				nav: false,
				smartSpeed: 200,
				slideSpeed : 500,
				slideBy: slidesPerPage,
				responsiveRefreshRate : 100,
				margin: 15
			}).on('changed.owl.carousel', syncPosition2);
		function syncPosition(el) {
			var count = el.item.count-1;
			var current = Math.round(el.item.index - (el.item.count/2) - .5);
			if(current < 0) {
				current = count;
			}
			if(current > count) {
				current = 0;
			}
			sync2
				.find(".owl-item")
				.removeClass("current")
				.eq(current)
				.addClass("current");
			var onscreen = sync2.find('.owl-item.active').length - 1;
			var start = sync2.find('.owl-item.active').first().index();
			var end = sync2.find('.owl-item.active').last().index();
			if (current > end) {
				sync2.data('owl.carousel').to(current, 100, true);
			}
			if (current < start) {
				sync2.data('owl.carousel').to(current - onscreen, 100, true);
			}
		}
		function syncPosition2(el) {
			if(syncedSecondary) {
				var number = el.item.index;
				sync1.data('owl.carousel').to(number, 100, true);
			}
		}
		sync2.on("click", ".owl-item", function(e){
			e.preventDefault();
			var number = $(this).index();
			sync1.data('owl.carousel').to(number, 300, true);
		});
	}
};
(function($) {
	"use strict";
	ecommerce_product2.init();
})(jQuery);


"use strict";

var editEmpresa = {
	init: function(){
		Inputmask({ mask: '99.999.999/9999-99' }).mask($("#cnpj"));
        Inputmask({ mask: '(99) 99999-9999' }).mask($("#telefonesac"));
		var btn_edit = document.querySelectorAll("#btn_edit");
		btn_edit.forEach(d=>{
			d.addEventListener('click',function(e){
				swal({
					title: "Aguarde...",
					text: "Aguarde enquanto buscamos os dados da empresa.",
					icon: "warning",
					buttons: false,
				  });
				$("#btn_salvar").data("id", e.target.dataset.id);
				fetch(`api/create-empresa/${e.target.dataset.id}/`).then(response => response.json())
				.then(data => {
				  console.log(data)
					if(data){
						$("#empresa").val(data.empresa );
						$("#empresa_apelido").val(data.empresa_apelido);
						$("#cnpj").val(data.cnpj);
						$("#cod_empresa").val(data.cod_empresa);
						$("#tipoempresa_id").val(data.tipoempresa_id);
						$("#cod_puxada").val(data.cod_puxada);
						$("#chave_edi").val(data.chave_edi);
						$("#edi_integracao").val(data.edi_integracao);
						$("#tokenapi").val(data.tokenapi);
						$("#tokenbmempresa").val(data.tokenbmempresa);
						$("#telefonesac").val(data.telefonesac);
						$("#codtelefone").val(data.codtelefone);
						$("#emailpedidodireto").val(data.emailpedidodireto);
						$("#emailpedidoempresa").val(data.emailpedidoempresa);
						if (document.querySelector("#max_tokens_ia")) {
							
							$("#prompt_IA_especifico").val(data.prompt_IA_especifico);
							$("#prompt_IA_mapa").val(data.prompt_IA_mapa);
							$("#modelo_ia").val(data.modelo_ia).trigger('change')
							$('#max_tokens_ia').val(data.max_tokens_ia)
							// $("#template_envio_clinica").val(data.template_envio_clinica).trigger("change")
							// $("#template_optin_clinica").val(data.template_optin_clinica).trigger("change")
							// Outros campos e valores aqui...
							// Segunda requisição: busca os templates da empresa

							fetch(`api/wpp_templates/list_templates_by_empresa/?id=${e.target.dataset.id}`)
							.then(response => response.json())
							.then(templateData => {
								console.log("TEMPLATE", templateData)
								// Limpa os selects antes de adicionar os novos templates
								$("#template_optin_clinica").empty().append('<option value="">Escolha o template optin padrão</option>');
								$("#template_envio_clinica").empty().append('<option value="">Escolha o template envio padrão</option>');
								$("#template_envio_vendedores").empty().append('<option value="">Escolha o template envio padrão</option>');
								$("#template_optin_vendedores").empty().append('<option value="">Escolha o template optin padrão</option>');
								// Popula o select com os templates recebidos
								templateData.forEach(template => {
									$("#template_optin_clinica").append(new Option(template.template_name, template.id));
									$("#template_envio_clinica").append(new Option(template.template_name, template.id));
									$("#template_envio_vendedores").append(new Option(template.template_name, template.id));
									$("#template_optin_vendedores").append(new Option(template.template_name, template.id));
								});

								// Se houver valores nos campos da empresa, seleciona os templates correspondentes
								$("#template_envio_clinica").val(data.template_envio_clinica).trigger("change");
								$("#template_optin_clinica").val(data.template_optin_clinica).trigger("change");
								$("#template_envio_vendedores").val(data.template_envio_vendedores).trigger("change");
								$("#template_optin_vendedores").val(data.template_optin_vendedores).trigger("change");
							})
							.catch(error => {
								console.error("Erro ao carregar templates:", error);
								swal({
									title: "Erro ao carregar templates",
									icon: "error",
									dangerMode: true,
								});
							});
						}
						swal.close();
					}
					else{
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
			})
		});

		$("#btn_salvar").on('click', function(e){
			e.preventDefault();
			const data = {
                empresa: $("#empresa").val() || '',
                empresa_apelido: $("#empresa_apelido").val() || '',
                cnpj:$("#cnpj").val() || '',
                cod_empresa:$("#cod_empresa").val(),
                tipoempresa_id:$("#tipoempresa_id").val() || '',
                cod_puxada:$("#cod_puxada").val() || '',
                chave_edi:$("#chave_edi").val() || '',
                edi_integracao:$("#edi_integracao").val() || '',
                tokenapi:$("#tokenapi").val() || '',
                tokenbmempresa:$("#tokenbmempresa").val() || '',
                telefonesac:$("#telefonesac").val() || '',
                codtelefone:$("#codtelefone").val() || '',
                emailpedidodireto:$("#emailpedidodireto").val() || '',
                emailpedidoempresa:$("#emailpedidoempresa").val() || '',
				prompt_IA_especifico: $('#prompt_IA_especifico').val() || '',
				prompt_IA_mapa: $("#prompt_IA_mapa").val() || '',
				max_tokens_ia: $('#max_tokens_ia').val() || 800,
				template_optin_clinica: $("#template_optin_clinica").val() || null,
				modelo_ia: $("#modelo_ia").val() || null,
				template_envio_clinica: $("#template_envio_clinica").val() || null,
				template_optin_vendedores:$("#template_optin_vendedores").val()|| null,
				template_envio_vendedores:$("#template_envio_vendedores").val()|| null
                // Outros campos e valores aqui...
              };
			  var index = $("#btn_salvar").data('id')
			  fetch(`/api/create-empresa/${index}/`, {
				method: 'PATCH', // Use 'PATCH' para atualizações parciais
				headers: {
				  'Content-Type': 'application/json', // Indica o tipo de conteúdo
				  'X-CSRFToken': csrftoken,
				},
				body: JSON.stringify(data), // Novos dados em formato JSON
			  })
			  .then(response => response.json())
			  .then(data => {
				console.log(data)
				if(data.id){
					swal({
						icon: 'success',
						title: 'Salvo!',
						buttons: false,
						timer: 1500
					  })
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
		})
	}
};

(function($) {
	"use strict";
	editEmpresa.init();
})(jQuery);


function add_termo_text(termo) {
    const textarea = $("#prompt_IA_mapa")[0]; // Seleciona o textarea
    const cursorPos = textarea.selectionStart; // Posição atual do cursor
    const textBefore = textarea.value.substring(0, cursorPos); // Texto antes do cursor
    const textAfter = textarea.value.substring(cursorPos); // Texto após o cursor
    const termoFormatado = `{${termo}}`; // Termo formatado com {}

    // Atualiza o conteúdo do textarea com o novo texto inserido
    textarea.value = textBefore + termoFormatado + textAfter;

    // Move o cursor para depois do termo inserido
    textarea.selectionStart = textarea.selectionEnd = cursorPos + termoFormatado.length;

    // Garante o foco no textarea
    textarea.focus();
}

"use strict";

var deleteEmpresa = {
	init: function(){
		var btn_deletar = document.querySelectorAll("#btn_deletar");
		btn_deletar.forEach(d=>{
			d.addEventListener('click',function(e){
				swal({
					title: "Tem certeza?",
					text: "Tem certeza que deseja excluir essa empresa?",
					icon: "warning",
					buttons: true,
					dangerMode:true
				  }).then((willDelete)=>{
						if(willDelete){
						fetch(`/api/create-empresa/${e.target.dataset.id}`,{
							method:"DELETE",
							headers: {
								'Content-Type': 'application/json',
								'X-CSRFToken': csrftoken,
							  },
						}).then(response=>{
							if (response.status === 204) {
								swal({
									icon: 'success',
									title: 'Empresa Excluida!',
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
			})
		});

		
	}
};

(function($) {
	"use strict";
	deleteEmpresa.init();
})(jQuery);