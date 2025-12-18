const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;
let map, markers = [], debounceTimeout;
let currentPage = 1, entidadeid;
let totalPages = 0;
let textareavalue = ''
let porte, potencialCliente, potencialRegiao, diasUltimaCompra, ticket_medio, total_compras, total_gasto, id_cliente, tendencia_crescimento, nome_cliente;
let historico_vendas = [], total_historico = [], total_produtos_historico = [], produtos_nome = [], data_historico = [];

async function initMap(estadoId = null, cidadeId = null, user = null, regiao=null, bairro=null) {
    // Inicializa o mapa
    map = new google.maps.Map(document.getElementById('map1'), {
        mapId: '8f06514484a7a529',
        center: { lat: -15.8267, lng: -47.9218 },
        zoom: 5
    });

    async function loadMarkers(bounds, estadoId, cidadeId, user, regiao, bairro) {
        try {
            let url = `api/create-entidade/list_coordinates/?`;
            if (estadoId) url += `&estado=${estadoId}`;
            if (cidadeId) url += `&cidade=${cidadeId}`;
            if (user) url +=`&query=${user}`;
            if (regiao) url+=`&regiao=${regiao}`;
            if(bairro) url+=`&bairro=${bairro}`;
            if(!estadoId && !cidadeId && bounds) url +=`&bounds=${bounds}`

            const response = await fetch(url);
            const data = await response.json();

            // Limpa os marcadores existentes
            markers.forEach(marker => marker.setMap(null));
            markers = [];
            document.getElementById('cont').innerText = data.clientes.length || '0';
            document.getElementById('leads-cont').innerText = data.clientes.length || '0';
            document.getElementById("15dias").innerText = formatarParaMoedaBrasileira(`${data.estatisticas.vendas_ultimos_periodos.quinze_dias}`);
            document.getElementById("30dias").innerText = formatarParaMoedaBrasileira(`${data.estatisticas.vendas_ultimos_periodos.trinta_dias}`);
            document.getElementById("60dias").innerText = formatarParaMoedaBrasileira(`${data.estatisticas.vendas_ultimos_periodos.sessenta_dias}`);
            document.getElementById("90dias").innerText = formatarParaMoedaBrasileira(`${data.estatisticas.vendas_ultimos_periodos.noventa_dias}`);
            document.getElementById("pt-vendas").innerHTML = formatarParaMoedaBrasileira(`${data.estatisticas.potencial_vendas_atual}`);
            document.getElementById("sugestao-vendas").innerHTML = formatarParaMoedaBrasileira(`${data.estatisticas.sugestao_vendas}`);

            console.log(data)
            data.clientes.forEach(entidade => {
                const lat = parseFloat(entidade.CliLatitude);
                const lng = parseFloat(entidade.CliLongitude);

                if (!isNaN(lat) && !isNaN(lng)) {
                    const position = { lat, lng };
                    const contentElement = document.createElement('div');
                    contentElement.innerHTML = `
                        <div style="position: relative; padding: 15px; max-width: 300px; background-color:#fff; border-radius: 10px;">
                        <!-- Botão "X" para fechar a janela -->
                        <button 
                            id="closeInfoWindow"
                            style="
                                position: absolute;
                                top: 5px;
                                right: 5px;
                                background: none;
                                border: none;
                                font-size: 16px;
                                cursor: pointer;
                                color: #999;
                            "
                            onclick="closeInfoWindow()"
                        >
                            &times;
                        </button>
                        <h3 style="margin: 0 0 10px 0; color: #333;">${entidade.Entidade}</h3>
                        <div style="margin-bottom: 15px;">
                            <p style="margin: 5px 0;"><strong>Bairro:</strong> ${entidade.Bairro || 'Não informado'}</p>
                            <p style="margin: 5px 0;"><strong>Endereço:</strong> ${entidade.Endereco || 'Não informado'}</p>
                            <p style="margin: 5px 0;"><strong>Cidade:</strong> ${entidade.cidade_nome || 'Não informada'}</p>
                            <p style="margin: 5px 0;"><strong>Estado:</strong> ${entidade.uf_sigla || 'Não informado'}</p>
                            <p style="margin: 5px 0;"><strong>Telefone:</strong> ${entidade.Telefone1 || 'Não informado'}</p>
                            <p style="margin: 5px 0;"><strong>CEP:</strong> ${entidade.CEP || 'Não informado'}</p>
                        </div>
                        <div style="display: flex; gap: 10px; justify-content: center;">
                            <button onclick="buscar_sugestao(${entidade.id})"  data-bs-toggle="modal" data-bs-target=".bd-example-modal-xl" style="padding: 8px 16px; background-color: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Sugestão de vendas</button>
                        </div>
                    </div>
                    `;
                    let pinColor;
                    // let glyphSvgUrl;
                    if (entidade.compra_acima_media) {
                        pinColor = "#228B22"; // Verde Escuro
                        // glyphSvgUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
                        //     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="#fff">
                        //         <path d="M160 0c-17.7 0-32 14.3-32 32s14.3 32 32 32l50.7 0L9.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L256 109.3l0 50.7c0 17.7 14.3 32 32 32s32-14.3 32-32l0-128c0-17.7-14.3-32-32-32L160 0zM576 80a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM448 208a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM400 384a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm48 80a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm128 0a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM272 384a48 48 0 1 0 0-96 48 48 0 1 0 0 96zm48 80a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zM144 512a48 48 0 1 0 0-96 48 48 0 1 0 0 96zM576 336a48 48 0 1 0 -96 0 48 48 0 1 0 96 0zm-48-80a48 48 0 1 0 0-96 48 48 0 1 0 0 96z"/>
                        //     </svg>
                        //     `)}`;
                    } else if (entidade.compra_na_media) {
                        pinColor = "#FFD700"; // Amarelo
                    } else if (entidade.compra_abaixo_media) {
                        pinColor = "#FFA500"; // Laranja
                    } else if (entidade.com_sugestao_pedidos) {
                        pinColor = "#87CEEB"; // Azul Claro
                    } else if (entidade.sem_sugestao_pedidos) {
                        pinColor = "#A9A9A9"; // Cinza
                    } else if (entidade.nao_comprou) {
                        pinColor = "#FF6347"; // Vermelho Claro
                    }

                        
                    const svg = `
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="384" height="512">
                            <!-- Pin shape -->
                            <path d="M384 192c0 87.4-117 243-168.3 307.2c-12.3 15.3-35.1 15.3-47.4 0C117 435 0 279.4 0 192C0 86 86 0 192 0S384 86 384 192z" fill="${pinColor}"/>
                        </svg>
                        `;
                        
                    const iconUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
                    const infoWindow = new google.maps.InfoWindow({
                        content: contentElement
                    });
                    
                    // const pinBackground = new  google.maps.Marker.PinElement({
                    //     background: pinColor,
                    // });
                    // The advanced marker, positioned at Uluru
                    const marker = new google.maps.Marker({
                        map,
                        position: position,
                        title: entidade.Entidade,
                        icon: {
                            url: iconUrl,
                            // size: new google.maps.Size(384, 512), // Tamanho original do SVG
                            scaledSize: new google.maps.Size(20, 30), // Tamanho final no mapa (proporcional ao original)
                        },
                        
                    });


                    marker.addListener('click', () => {
                        infoWindow.open({
                            anchor: marker,
                            map: map
                        });
                    });

                    markers.push(marker);
                }
            });
        } catch (error) {
            console.error('Erro ao carregar entidades:', error);
        }
    }
    if(estadoId || cidadeId || user || regiao || bairro){
        loadMarkers(bounds=null, estadoId, cidadeId, user, regiao, bairro)
    }
}


async function buscar_sugestao(clienteId, page) {

    $(".loader-box").css('display','block');
    $("#relatorio").css('display','none')
    $("#ia-response-container").css('display','none');
    try {
        // Chamar a API para obter os dados do relatório
        const response = await fetch(`api/historico_vendas/${clienteId}/busca_sugestao/`);
        const data = await response.json();
        console.log("DADOS", data)
        porte = data.cliente.porte || null;
        id_cliente = clienteId;
        potencialCliente = data.estatisticas.potencial_cliente || null;
        nome_cliente = data.cliente.nome || ''
        potencialRegiao = data.estatisticas.potencial_regiao || null;
        diasUltimaCompra = data.metricas_avancadas.dias_desde_ultima_compra || null;
        ticket_medio = data.metricas.ticket_medio || null;
        total_compras = data.metricas.total_compras || null;
        total_gasto = data.metricas.total_gasto || null;
        tendencia_crescimento = data.metricas_avancadas.tendencia_crescimento|| null;
        $("#nome_entidade").text(data.cliente.nome)
        $("#nome_cliente").text(data.cliente.nome)
        $("#porte").text(data.cliente.porte)
        $("#periodo_compras").text(data.cliente.periodo_compras)
        $("#cnpj").text(formatarCpfCnpj(data.cliente.cnpj))
        $("#pc").text(data.estatisticas.potencial_cliente)
        $("#pr").text(formatarParaMoedaBrasileira(data.estatisticas.potencial_regiao))
        $("#frequencia").text(data.metricas.frequencia)
        $("#tc").text(formatarParaMoedaBrasileira(data.metricas.ticket_medio))
        $("#total_compras").text(data.metricas.total_compras)
        $("#total_gasto").text(formatarParaMoedaBrasileira(data.metricas.total_gasto))
        $("#dduc").text(data.metricas_avancadas.dias_desde_ultima_compra)
        $("#tendencia_crescimento").text(data.metricas_avancadas.tendencia_crescimento)
        if (response.ok) {
            // Preencher o conteúdo do modal com os dados do relatório
            const content = `
                        ${data.produtos.map(produto => `
                            <tr>
                            <td>
                              <div class="media">
                                <div class="square-box me-2"><img class="img-fluid b-r-5"
                                    src="/static/assets/images/dashboard-2/hand-bag.png" alt=""></div>
                                <div class="media-body ps-2">
                                  <div class="avatar-details"><a href="/ecommerce_product_page">
                                      <h6>${produto.nome}</h6>
                                    </a><span></span></div>
                                </div>
                              </div>
                            </td>
                            <td class="img-content-box">
                              <h6>${produto.score}</h6>
                            </td>
                            <td>
                              <h6>${produto.quantidade}</h6>
                            </td>
                            <td>
                              <h6>${formatarParaMoedaBrasileira(produto.valor_unitario)}</h6>
                            </td>
                            <td>
                              <h6>${formatarParaMoedaBrasileira(produto.total)}</h6>
                            </td>
                            <td>
                              <h6>${produto.recorrente ? '<span class="badge badge-success text-white">Sim</span>' : '<span class="badge badge-danger text-white">Não</span>'}</h6>
                            </td>
                          </tr>
                        `).join('')}
            `;

            const sugeridos = `
                ${data.produtos_sugeridos.map(produto => `
                    <tr>
                    <td>
                    <div class="media">
                        <div class="square-box me-2"><img class="img-fluid b-r-5"
                            src="/static/assets/images/dashboard-2/hand-bag.png" alt=""></div>
                        <div class="media-body ps-2">
                        <div class="avatar-details"><a href="/ecommerce_product_page">
                            <h6>${produto.descricao}</h6>
                            </a><span>${produto.codigo}</span></div>
                        </div>
                    </div>
                    </td>
                    <td class="img-content-box">
                    <h6>${produto.codigo || '-'}</h6>
                    </td>
                    <td>
                    <h6>${produto.quantidade_por_caixa || '-'}</h6>
                    </td>
                    <td>
                    <h6>${produto.linha_produto || '-'}</h6>
                    </td>
                </tr>
                `).join('')}
            `


            document.getElementById('tbody').innerHTML = content;
            document.getElementById('tbody-sugestao').innerHTML = sugeridos;
            $(".loader-box").css('display','none');
            $("#relatorio").css('display','block')
            loadPage(clienteId, 1)
        } else {
            alert('Erro ao carregar o relatório.');
        }
    } catch (error) {
        console.error('Erro ao buscar sugestão de vendas:', error);
    }
}


function visualizarDetalhes(clienteId, page) {
    // Mostrar o loader
    $("#loader-detalhes").css('display', 'block');
    // Requisição à API
    const tbody = document.getElementById('tbody-detalhes');
    tbody.innerHTML = ''; // Limpar a tabela antes de preencher
    fetch(`api/historico_vendas/${clienteId}/detalhes/?page=${page}`)
        .then(response => response.json())
        .then(data => {
            console.log("pedidos", data
            )
            updatePagination(data.count)
            historico_vendas = []
            if (data.count > 0) {
                const primeirosItens = data.results.slice(0, 5);
                historico_vendas.push(...primeirosItens);
                console.log("historico", historico_vendas);
            }
            data.results.forEach((historico, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td><h6>${historico.entidade || '-'}</h6></td>
                    <td><h6>${historico.nfe || '-'}</h6></td>
                    <td><h6>${formatarParaMoedaBrasileira(historico.total_nota)}</h6></td>
                    <td><h6>${formatDateToDDMMYYYY(historico.dt_emissao) || '-'}</h6></td>
                    <td><h6>${historico.regiao || '-'}</h6></td>
                    <td><h6>${parseInt(historico.total_produtos) || '-'}</h6></td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="mostrarProdutos(${index})">
                            Ver Produtos
                        </button>
                    </td>
                `;
                tbody.appendChild(row);


                // Adicionar espaço para os produtos comprados (inicialmente oculto)
                const productRow = document.createElement('tr');
                productRow.style.display = 'none';
                productRow.id = `produtos-${index}`;
                productRow.innerHTML = `
                    <td colspan="7">
                        <table class="table table-sm">
                            <thead>
                                <tr>
                                    <th class='text-start'>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Valor Unitário Calculado</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${historico.produtos.map(produto => `
                                    <tr>
                                        <td class='text-start'><div class="media">
                                            <div class="square-box me-2"><img class="img-fluid b-r-5"
                                                src="/static/assets/images/dashboard-2/hand-bag.png" alt=""></div>
                                            <div class="media-body ps-2">
                                            <div class="avatar-details"><a href="/ecommerce_product_page">
                                                <h6>${produto.descricao}</h6>
                                                </a><span>${produto.SKU || '-'}</span></div>
                                            </div>
                                        </div></td>
                                        <td>${produto.quantidade || '-'}</td>
                                        <td>${formatarParaMoedaBrasileira(produto.unitario_calculado) || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </td>
                `;
                tbody.appendChild(productRow);
            });
            // Esconder o loader
            $("#loader-detalhes").css('display', 'none');
        })
        .catch(error => {
            console.error('Erro ao buscar detalhes:', error);
            $("#loader-detalhes").css('display', 'none');
        });
}

// Função para exibir ou ocultar a lista de produtos comprados
function mostrarProdutos(index) {
    const productRow = document.getElementById(`produtos-${index}`);
    if (productRow.style.display === 'none') {
        productRow.style.display = 'table-row';
    } else {
        productRow.style.display = 'none';
    }
}

document.getElementById("updateCoordinates").addEventListener("click", async () => {
    try {
        const response = await fetch('api/create-entidade/update_missing_coordinates/', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken
            }
        });
        const data = await response.json();
        alert(`Coordenadas atualizadas para ${data.count} entidades.`);
        initMap();
    } catch (error) {
        console.error('Erro ao atualizar coordenadas:', error);
    }
});

function loadCidades(estadoId) {
    const cidadeFilter = document.getElementById('cidade');
    cidadeFilter.innerHTML = '<option value="">Selecione uma cidade</option>';
    fetch(`api/pegacidade/busca_cidades_estado/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ id: estadoId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.cidades && data.cidades.length > 0){
                data.cidades.forEach(cidade => {
                    const option = document.createElement('option');
                    option.value = cidade.pk;
                    option.textContent = cidade.Cidade;
                    cidadeFilter.appendChild(option);
                });
            }
        });
}




function loadEstados(regiaId) {
    const EstadoFilter = document.getElementById('estado');
    EstadoFilter.innerHTML = '<option value="">Selecione um Estado</option>';
    fetch(`api/pegacidade/busca_estados/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ id: regiaId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.estados && data.estados.length > 0){
                data.estados.forEach(estado => {
                    const option = document.createElement('option');
                    option.value = estado.pk;
                    option.textContent = estado.uf;
                    EstadoFilter.appendChild(option);
                });
            }
        });
}

function loadBairro(cidadeId) {
    const EstadoFilter = document.getElementById('bairro');
    EstadoFilter.innerHTML = '<option value="">Selecione um Bairro</option>';
    fetch(`api/pegacidade/busca_bairro/`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,
        },
        body: JSON.stringify({ id: cidadeId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.bairro && data.bairro.length > 0){
                data.bairro.forEach(bairro => {
                    const option = document.createElement('option');
                    option.value = bairro.pk;
                    option.textContent = bairro.Bairro;
                    EstadoFilter.appendChild(option);
                });
            }
        });
}

$("#regiao").on('change',(e)=>{
    loadEstados(e.target.value)
})

$("#estado").on("change", (e) => {
    loadCidades(e.target.value);
});

$("#cidade").on("change", (e) => {
    loadBairro(e.target.value);
});

document.getElementById("filtrar").addEventListener("click", () => {
    const estado = document.getElementById("estado").value || null;
    const cidade = document.getElementById("cidade").value || null;
    const user = document.getElementById("lead").value || null;
    const regiao = document.getElementById("regiao").value || null;
    const bairro = document.getElementById("bairro").value || null;
    console.log(user)
    initMap(estado, cidade, user, regiao, bairro);
});

window.onload = () => initMap();


// Sistema de pesquisa
(function ($) {
    var bestPictures = new Bloodhound({
      datumTokenizer: Bloodhound.tokenizers.obj.whitespace("value"),
      queryTokenizer: Bloodhound.tokenizers.whitespace,
      prefetch: "",
      remote: {
        url: `api/create-entidade/busca/?query=%QUERY`,
        wildcard: "%QUERY",
        filter: function (response) {
          return response; // Assumindo que a API retorna a lista diretamente
        }
      }
    });
  
    $(".faq-form .typeahead").on('typeahead:asyncrequest', function () {
      // Mostrar indicador de carregamento
      $(".loading-indicator-itens").show();
    });
  
    $(".faq-form .typeahead").on('typeahead:asyncreceive', function () {
      // Esconder indicador de carregamento
      $(".loading-indicator-itens").hide();
    });
  
    $(".faq-form .typeahead").typeahead(null, {
      name: "Entidade",
      display: 'Entidade',
      limit: 15,
      source: bestPictures
    })
  
    $(".faq-form .typeahead").on('input', function() {
      if ($(this).val() === '') {
        $(".loading-indicator-itens").hide();
      }
    })
  })(jQuery);

  function formatarParaMoedaBrasileira(valor) {
    // Converte o valor para um número, se possível
    let numero = parseFloat(valor.toString().replace(/[^0-9.-]+/g, ''));
    
    if (isNaN(numero)) {
        return 'Valor inválido';
    }

    // Formata o número como moeda brasileira
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    });
}


function loadPage(entidade,page){
    console.log("PAGE", currentPage)
    console.log("ENTIDADE", entidade)
    currentPage = page;
    entidadeid = entidade
    visualizarDetalhes(entidadeid, currentPage)
}

function updatePagination(count) {
    totalPages = Math.ceil(count / 10); // Calcula o total de páginas
    const pagination = document.getElementById('pagination-detalhes');

    // Limpa itens de paginação, exceto botões "Anterior" e "Próximo"
    while (pagination.children.length > 2) {
        pagination.removeChild(pagination.children[1]);
    }

    const pageNumbers = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
        if (currentPage <= 3) {
            pageNumbers.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pageNumbers.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
            pageNumbers.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
    }
    console.log("PAGINATIONS", pagination)
    console.log("Page Number", pageNumbers)
    // Adiciona os números de páginas dinamicamente
    pageNumbers.forEach((page) => {
        const li = document.createElement('li');
        li.className = 'page-item';
        if (page === currentPage) {
            li.classList.add('active');
        }
        if (page === '...') {
            li.classList.add('disabled');
            li.innerHTML = `<span class="page-link">...</span>`;
        } else {
            const a = document.createElement('a');
            a.className = 'page-link';
            a.href = 'javascript:void(0)';
            a.textContent = page;
            a.addEventListener('click', () => loadPage(entidadeid,page));
            li.appendChild(a);
        }
        pagination.insertBefore(li, document.getElementById('next-page-detalhes'));
    });

    // Atualiza os botões "Anterior" e "Próximo"
    document.getElementById('previous-page-detalhes').classList.toggle('disabled', currentPage === 1);
    document.getElementById('next-page-detalhes').classList.toggle('disabled', currentPage === totalPages);
}

// Eventos para os botões "Anterior" e "Próximo"
document.getElementById('previous-page-detalhes').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage -= 1;
        loadPage(entidadeid,currentPage);
    }
});

document.getElementById('next-page-detalhes').addEventListener('click', () => {
    if (currentPage < totalPages) {
        currentPage += 1;
        loadPage(entidadeid,currentPage);
    }
});

function formatarCpfCnpj(valor) {
    // Remove qualquer caractere que não seja número
    const numeros = valor.replace(/\D/g, "");

    if (numeros.length === 11) {
        // CPF: Verifica e formata
        return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    } else if (numeros.length === 14) {
        // CNPJ: Verifica e formata
        return numeros.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
    } else {
        // Retorna erro se não for CPF nem CNPJ
        return "Formato inválido. Informe um CPF (11 dígitos) ou CNPJ (14 dígitos).";
    }
}

function formatDateToDDMMYYYY(date) {
    // Certifique-se de que 'date' é uma instância válida de Date
    const d = new Date(date);

    // Extrair dia, mês e ano
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0'); // getMonth retorna o índice (0-11)
    const year = d.getFullYear();

    // Formatar no padrão desejado
    return `${day}/${month}/${year}`;
}

// Exemplo de uso
const formattedDate = formatDateToDDMMYYYY('2024-12-15');
console.log(formattedDate); // Saída: "15/12/2024"

$(document).ready(function () {
    let generatedText = "";
    $("#ia-response-textarea").val('')
    $("#analise_ia").on("click", function (e) {
        e.preventDefault();
        $("#ia-response-textarea").val('')
        fetch("api/historico_vendas/ia_analise/",{
            method:"POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },
            body: JSON.stringify({
                'porte': porte,
                'nome_cliente': nome_cliente, 
                'id_cliente': id_cliente,
                "potencialCliente": potencialCliente,
                "potencialRegiao": potencialRegiao,
                "diasUltimaCompra": diasUltimaCompra,
                "ticket_medio": ticket_medio,
                "total_compras": total_compras,
                "total_gasto": total_gasto,
                "tendencia_crescimento": tendencia_crescimento,
                'historico_vendas': historico_vendas,
            }),
        })
        .then(res=>res.json())
        .then(data=>{
            console.log('resultado api', data)
            if(data.result){
                generatedText=data.result
                textareavalue = generatedText
                $("#ia-loading").fadeOut(200, function () {
                    typeText(generatedText, "#ia-response-textarea");
                });
            }
            else if(data.error){
                Swal.fire({
                    text: data.error,
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                      confirmButton: "btn btn-primary"
                    }
                  });
                  $("#ia-loading").fadeOut(200)
            }
            else{
                Swal.fire({
                    text: "Ocorreu um erro ao tentar gerar texto",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                      confirmButton: "btn btn-primary"
                    }
                  });
                  $("#ia-loading").fadeOut(200)
            }
        })
        // Mostrar a textarea com animação
        $("#ia-response-container").hide().fadeIn(500, function () {
            $("#ia-loading").fadeIn(200); // Mostrar o loader
        });
    })

    function typeText(text, target) {
        $(target).val(""); // Limpar textarea
        let i = 0;

        const typingInterval = setInterval(function () {
            if (i < text.length) {
                $(target).val($(target).val() + text[i]);
                i++;
            } else {
                clearInterval(typingInterval); // Parar animação quando o texto terminar
            }
        }, 10); // Tempo entre cada caractere (50ms)
    }
});

$("#enviar_vendedores").on("click", function (event) {
    event.preventDefault(); // Evita o comportamento padrão do link

    // Captura os valores selecionados do select
    const selectedValues = $("#select_tags").val(); // Pega o array de valores

    Swal.fire({
        title: 'Aguarde',
        text: 'Enviando',
        icon: 'info',
        allowOutsideClick: false,
        showConfirmButton: false,
        willOpen: () => {
            Swal.showLoading()
        }
    });
    // Validação: impede envio se nenhum vendedor for selecionado
    if (!selectedValues || selectedValues.length === 0) {
        Swal.fire({
            text: "Selecione ao menos um vendedor!",
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
              confirmButton: "btn btn-primary"
            }
          });
        return;
    }

    if (textareavalue == ''){
        Swal.fire({
            text: "Aguarde a IA Gerar o relatório",
            icon: "info",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
              confirmButton: "btn btn-primary"
            }
          });
        return;
    }
    // Dados a serem enviados
    const requestData = {
        vendedores: selectedValues, // Array com os valores selecionados
        textareavalue:textareavalue
    };

    // Envio usando fetch
    fetch("api/historico_vendas/envia_resumo/", { // Substitua pelo endpoint correto
        method: "POST",
        headers: {
            "Content-Type": "application/json", // Define o tipo de conteúdo
            "X-CSRFToken": csrftoken // Garante o CSRF Token para Django
        },
        body: JSON.stringify(requestData) // Converte o objeto em JSON
    })
    .then(response => {
        if (!response.ok) {
            Swal.fire({
                text: "Ocorreu um erro!",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                  confirmButton: "btn btn-primary"
                }
              });
        }
        return response.json();
    })
    .then(data => {
        console.log("Dados enviados com sucesso:", data);
        Swal.fire({
            icon: 'success',
            title: 'Envio das mensagens iniciado!',
            confirmButtonText: "Ok",
            customClass: {
                confirmButton: "btn btn-primary"
            }
        })
    })
    .catch(error => {
        Swal.fire({
            text: "Ocorreu um erro!",
            icon: "error",
            buttonsStyling: false,
            confirmButtonText: "Ok",
            customClass: {
              confirmButton: "btn btn-primary"
            }
          });
    });
});