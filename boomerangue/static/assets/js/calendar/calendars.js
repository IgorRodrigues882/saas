'use strict';

/* eslint-disable require-jsdoc, no-unused-vars */

var CalendarList = [];
var LeadList = [];
var carrega_tel = 0;

function CalendarInfo() {
    this.id = null;
    this.name = null;
    this.checked = true;
    this.color = null;
    this.bgColor = null;
    this.borderColor = null;
    this.dragBgColor = null;
}

function addCalendar(calendar) {
    CalendarList.push(calendar);
    console.log(CalendarList)
}

function findCalendar(id) {
    var found;

    CalendarList.forEach(function(calendar) {
        if (calendar.id === id) {
            found = calendar;
        }
    });

    return found || CalendarList[0];
}

function hexToRGBA(hex) {
    var radix = 16;
    var r = parseInt(hex.slice(1, 3), radix),
        g = parseInt(hex.slice(3, 5), radix),
        b = parseInt(hex.slice(5, 7), radix),
        a = parseInt(hex.slice(7, 9), radix) / 255 || 1;
    var rgba = 'rgba(' + r + ', ' + g + ', ' + b + ', ' + a + ')';

    return rgba;
}


function fetchAndLoadCalendars() {
    CalendarList = []
    fetch('api/grupoAgendamentos/busca_grupos/')
        .then(response => response.json())
        .then(data => {
            console.log(data)
            data.forEach(group => {
                let calendar = new CalendarInfo();
                calendar.id = String(group.id);
                calendar.name = group.nome;
                calendar.color = group.color;
                calendar.bgColor = group.bg_color;
                calendar.dragBgColor = group.bg_color;
                calendar.borderColor = group.bg_color;
                addCalendar(calendar);
            });
        })
        .catch(error => {
            console.error('Error fetching calendars:', error);
        })
        .finally(()=>{
            load_groups()
        })
    
}

fetchAndLoadCalendars();


let currentPage = 1; // Página inicial
let isFetching = false; // Controle para evitar múltiplas requisições simultâneas
let scrollListenerAdded = false; // Controle para evitar múltiplos listeners

function leadInfo() {
    this.id = null;
    this.name = null;
}

function addLead(lead) {
    LeadList.push(lead);
}

function findLead(id) {
    var found;

    LeadList.forEach(function(lead) {
        if (lead.id === id) {
            found = lead;
        }
    });

    return found || LeadList[0];
}

function fetchAndLoadLeads(page = 1) {
    if (isFetching) return;

    isFetching = true; // Evita chamadas concorrentes

    fetch(`api/create-entidade/carregaLeads/?page=${page}`)
        .then(response => response.json())
        .then(data => {
            data.results.forEach(group => {
                let lead = new leadInfo();
                lead.id = String(group.id);
                lead.name = group.Entidade;
                addLead(lead);
            });

            populateLeadSelect(); // Atualizará o select ao carregar mais leads
            currentPage++;
        })
        .catch(error => {
            console.error('Error fetching leads:', error);
        })
        .finally(() => {
            isFetching = false; // Permite novas chamadas após a atual finalizar
        });
}

function populateLeadSelect() {
    setTimeout(() => {
        const leadSelect = document.querySelector('.select_lead');
        var $select = $(leadSelect).data('select2');

        if (leadSelect) {
            // Adiciona as novas opções ao select sem limpar as antigas
            LeadList.forEach(lead => {
                // Verifica se a opção já está no select
                if (!leadSelect.querySelector(`option[value="${lead.id}"]`)) {
                    const option = document.createElement('option');
                    option.value = lead.id;
                    option.textContent = lead.name;
                    leadSelect.appendChild(option);
                }
            });
            if ($select) {
                if ($select.isOpen()) {
                    console.log('Dropdown iniciou aberta');
                    $select.trigger('change');
                }
            } else {
                $(leadSelect).select2({
                    ajax: {
                        url: 'api/create-entidade/carregaLeads/',
                        dataType: 'json',
                        delay: 250,
                        data: function(params) {
                            return {
                                search: params.term, // Termo de busca
                                page: params.page || 1
                            };
                        },
                        processResults: function(data) {
                            return {
                                results: data.results.map(group => ({
                                    id: group.id,
                                    text: group.Entidade
                                })),
                                pagination: {
                                    more: data.next !== null
                                }
                            };
                        },
                        cache: true
                    }
                });
            }

            scrollDropdown(leadSelect);
            Inputmask({ mask: '+99 (99) 99999-9999' }).mask($(".telefone_bm"));
        } else {
            console.error('Select element not found.');
        }
    }, 500); // Diminui o delay para tornar o carregamento mais rápido
}

// Detecta quando o usuário chega ao final do dropdown
function scrollDropdown(leadSelect) {
    $(leadSelect).on('select2:open', function() {
        const dropdown = document.querySelector('.select2-results__options');

        if (dropdown) {
            dropdown.addEventListener('scroll', function() {
                if (
                    dropdown.scrollTop + dropdown.clientHeight >= dropdown.scrollHeight &&
                    !isFetching
                ) {
                    console.log("Chegou ao final");
                    fetchAndLoadLeads(currentPage);
                }
            });
        }
    });
}

// Evento para buscar telefone ao selecionar o lead
$(document).on('change', '.select_lead', function() {
    const selectedLeadId = $(this).val();

    console.log("entrou change", selectedLeadId)
    if (selectedLeadId) {
        console.log("entrou if")
        if(carrega_tel==0){
        fetch(`api/create-entidade/${selectedLeadId}/`)
            .then(response => response.json())
            .then(data => {
                    const telefoneInput = document.querySelector(".telefone_bm");
                    telefoneInput.value = data.Telefone1; // Assumindo que o campo no JSON retornado seja 'telefone'
            })
            .catch(error => {
                console.error('Error fetching lead info:', error);
            })
        }
        else{
            carrega_tel=0
        }
    }
});

// Carrega a primeira página ao iniciar
fetchAndLoadLeads(currentPage);



// (function() {
//     var calendar;
//     var id = 0;

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'My Calendar';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#9e5fff';
//     calendar.dragBgColor = '#9e5fff';
//     calendar.borderColor = '#9e5fff';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'Company';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#00a9ff';
//     calendar.dragBgColor = '#00a9ff';
//     calendar.borderColor = '#00a9ff';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'Family';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#ff5583';
//     calendar.dragBgColor = '#ff5583';
//     calendar.borderColor = '#ff5583';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'Friend';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#03bd9e';
//     calendar.dragBgColor = '#03bd9e';
//     calendar.borderColor = '#03bd9e';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'Travel';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#bbdc00';
//     calendar.dragBgColor = '#bbdc00';
//     calendar.borderColor = '#bbdc00';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'etc';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#9d9d9d';
//     calendar.dragBgColor = '#9d9d9d';
//     calendar.borderColor = '#9d9d9d';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'Birthdays';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#ffbb3b';
//     calendar.dragBgColor = '#ffbb3b';
//     calendar.borderColor = '#ffbb3b';
//     addCalendar(calendar);

//     calendar = new CalendarInfo();
//     id += 1;
//     calendar.id = String(id);
//     calendar.name = 'National Holidays';
//     calendar.color = '#ffffff';
//     calendar.bgColor = '#ff4040';
//     calendar.dragBgColor = '#ff4040';
//     calendar.borderColor = '#ff4040';
//     addCalendar(calendar);
// })();
