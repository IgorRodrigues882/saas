'use strict';

/* eslint-disable */
/* eslint-env jquery */
/* global moment, tui, chance */
/* global findCalendar, CalendarList, ScheduleList, generateSchedule */

// Encontra o cookie que contém o csrftoken do Django
const csrftokenCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('csrftoken='));
// Extrai o valor do csrftoken do cookie
const csrftoken = csrftokenCookie ? csrftokenCookie.split('=')[1] : null;

(function(window, Calendar) {

    var cal, resizeThrottled;
    var useCreationPopup = true;
    var useDetailPopup = true;
    var datePicker, selectedCalendar;
    

    cal = new Calendar('#calendar', {
        defaultView: 'month',
        useCreationPopup: useCreationPopup,
        useDetailPopup: useDetailPopup,
        calendars: CalendarList,
        template: {
            milestone: function(model) {
                console.log("MILESTONE", model)
                return '<span class="calendar-font-icon ic-milestone-b"></span> <span style="background-color: ' + model.bgColor + '">' + model.title + '</span>';
            },
            allday: function(schedule) {
                return getTimeTemplate(schedule, true);
            },
            time: function(schedule) {
                return getTimeTemplate(schedule, false);
            },
            popupDetailDate: function(isAllDay, start, end) {
                if (isAllDay) {
                  return formatDatePtBR(start.toDate()) + (end ? ' - ' + formatDatePtBR(end.toDate()) : '');
                }
          
                return formatDatePtBR(start.toDate()) + ' - ' + formatDatePtBR(end.toDate());
              }
        }
    });

    // event handlers
    cal.on({
        'clickMore': function(e) {
            console.log('clickMore', e);
        },
        'clickSchedule': function(e) {
            console.log('clickSchedule', e);
        },
        'clickDayname': function(date) {
            console.log('clickDayname', date);
        },
        'beforeCreateSchedule': function(e) {
            console.log('beforeCreateSchedule', e);
            saveNewSchedule(e);
        },
        'beforeUpdateSchedule': function(e) {
            var schedule = e.schedule;
            var changes = e.changes;

            console.log('beforeUpdateSchedule', e);

            if (changes && !changes.isAllDay && schedule.category === 'allday') {
                changes.category = 'time';
            }
            updateSchedule(schedule.id, changes)
            cal.updateSchedule(schedule.id, schedule.calendarId, changes);
            refreshScheduleVisibility();
        },
        'beforeDeleteSchedule': function(e) {
            console.log('beforeDeleteSchedule', e.schedule.id);
            deleteAgendamento(e.schedule)

        },
        'afterRenderSchedule': function(e) {
            var schedule = e.schedule;
            console.log("clicou")
            // var element = cal.getElement(schedule.id, schedule.calendarId);
            // console.log('afterRenderSchedule', element);
        },
        'clickTimezonesCollapseBtn': function(timezonesCollapsed) {
            console.log('timezonesCollapsed', timezonesCollapsed);

            if (timezonesCollapsed) {
                cal.setTheme({
                    'week.daygridLeft.width': '77px',
                    'week.timegridLeft.width': '77px'
                });
            } else {
                cal.setTheme({
                    'week.daygridLeft.width': '60px',
                    'week.timegridLeft.width': '60px'
                });
            }

            return true;
        }
    });

    /**
     * Get time template for time and all-day
     * @param {Schedule} schedule - schedule
     * @param {boolean} isAllDay - isAllDay or hasMultiDates
     * @returns {string}
     */
    function getTimeTemplate(schedule, isAllDay) {
        var html = [];
        var start = moment(schedule.start.toUTCString());
        if (!isAllDay) {
            html.push('<strong>' + start.format('HH:mm') + '</strong> ');
        }
        if (schedule.isPrivate) {
            html.push('<span class="calendar-font-icon ic-lock-b"></span>');
            html.push(' Private');
        } else {
            if (schedule.isReadOnly) {
                html.push('<span class="calendar-font-icon ic-readonly-b"></span>');
            } else if (schedule.recurrenceRule) {
                html.push('<span class="calendar-font-icon ic-repeat-b"></span>');
            } else if (schedule.attendees.length) {
                html.push('<span class="calendar-font-icon ic-user-b"></span>');
            } else if (schedule.location) {
                html.push('<span class="calendar-font-icon ic-location-b"></span>');
            }
            html.push(' ' + schedule.title);
        }

        return html.join('');
    }

    /**
     * A listener for click the menu
     * @param {Event} e - click event
     */
    function onClickMenu(e) {
        var target = $(e.target).closest('a[role="menuitem"]')[0];
        var action = getDataAction(target);
        var options = cal.getOptions();
        console.log("opçoes", options)
        var viewName = '';

        console.log(target);
        console.log(action);
        switch (action) {
            case 'toggle-daily':
                viewName = 'day';
                break;
            case 'toggle-weekly':
                viewName = 'week';
                break;
            case 'toggle-monthly':
                options.month.visibleWeeksCount = 0;
                viewName = 'month';
                break;
            case 'toggle-weeks2':
                options.month.visibleWeeksCount = 2;
                viewName = 'weeks2';
                break;
            case 'toggle-weeks3':
                options.month.visibleWeeksCount = 3;
                viewName = 'weeks3';
                break;
            case 'toggle-narrow-weekend':
                options.month.narrowWeekend = !options.month.narrowWeekend;
                options.week.narrowWeekend = !options.week.narrowWeekend;
                viewName = cal.getViewName();

                target.querySelector('input').checked = options.month.narrowWeekend;
                break;
            case 'toggle-start-day-1':
                options.month.startDayOfWeek = options.month.startDayOfWeek ? 0 : 1;
                options.week.startDayOfWeek = options.week.startDayOfWeek ? 0 : 1;
                viewName = cal.getViewName();

                target.querySelector('input').checked = options.month.startDayOfWeek;
                break;
            case 'toggle-workweek':
                options.month.workweek = !options.month.workweek;
                options.week.workweek = !options.week.workweek;
                viewName = cal.getViewName();

                target.querySelector('input').checked = !options.month.workweek;
                break;
            default:
                break;
        }

        cal.setOptions(options, true);
        cal.changeView(viewName, true);

        setDropdownCalendarType();
        setRenderRangeText();
        setSchedules();
    }


    function formatDatePtBR(date) {
        return new Intl.DateTimeFormat('pt-BR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: 'numeric',
          minute: 'numeric'
        }).format(new Date(date));
      }

    function onClickNavi(e) {
        var action = getDataAction(e.target);
        var options = cal.getOptions();
        switch (action) {
            case 'move-prev':
                cal.prev();
                break;
            case 'move-next':
                cal.next();
                break;
            case 'move-today':
                cal.today();
                break;
            default:
                return;
        }

        options.calendars = CalendarList
        cal.setOptions(options, true);
        setRenderRangeText();
        setSchedules();
    }

    function onNewSchedule() {
        var title = $('#new-schedule-title').val();
        var location = $('#new-schedule-location').val();
        var isAllDay = document.getElementById('new-schedule-allday').checked;
        var start = datePicker.getStartDate();
        var end = datePicker.getEndDate();
        var calendar = selectedCalendar ? selectedCalendar : CalendarList[0];

        if (!title) {
            return;
        }

        cal.createSchedules([{
            id: String(chance.guid()),
            calendarId: calendar.id,
            title: title,
            isAllDay: isAllDay,
            start: start,
            end: end,
            category: isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            raw: {
                location: location
            },
            state: 'Busy'
        }]);

        $('#modal-new-schedule').modal('hide');
    }

    function onChangeNewScheduleCalendar(e) {
        var target = $(e.target).closest('a[role="menuitem"]')[0];
        var calendarId = getDataAction(target);
        changeNewScheduleCalendar(calendarId);
    }



    function changeNewScheduleCalendar(calendarId) {
        var calendarNameElement = document.getElementById('calendarName');
        var calendar = findCalendar(calendarId);
        var html = [];

        html.push('<span class="calendar-bar" style="background-color: ' + calendar.bgColor + '; border-color:' + calendar.borderColor + ';"></span>');
        html.push('<span class="calendar-name">' + calendar.name + '</span>');

        calendarNameElement.innerHTML = html.join('');

        selectedCalendar = calendar;
    }

    function createNewSchedule(event) {
        var start = event.start ? new Date(event.start.getTime()) : new Date();
        var end = event.end ? new Date(event.end.getTime()) : moment().add(1, 'hours').toDate();

        if (useCreationPopup) {
            cal.openCreationPopup({
                start: start,
                end: end
            });
        }
    }
    function saveNewSchedule(scheduleData) {
        var calendar = scheduleData.calendar || findCalendar(scheduleData.calendarId);
        var schedule = {
            id: String(chance.guid()),
            title: scheduleData.title,
            isAllDay: scheduleData.isAllDay,
            start: scheduleData.start,
            end: scheduleData.end,
            category: scheduleData.isAllDay ? 'allday' : 'time',
            dueDateClass: '',
            color: calendar.color,
            bgColor: calendar.bgColor,
            dragBgColor: calendar.bgColor,
            borderColor: calendar.borderColor,
            location: scheduleData.location,
            raw: {
                class: scheduleData.raw['class']
            },
            state: scheduleData.state
        };
        if (calendar) {
            schedule.calendarId = calendar.id;
            schedule.color = calendar.color;
            schedule.bgColor = calendar.bgColor;
            schedule.borderColor = calendar.borderColor;
        }

        salva_atividade(schedule)

    }

    function onChangeCalendars(e) {
        var calendarId = e.target.value;
        var checked = e.target.checked;
        var viewAll = document.querySelector('.lnb-calendars-item input');
        var calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));
        var allCheckedCalendars = true;

        if (calendarId === 'all') {
            allCheckedCalendars = checked;

            calendarElements.forEach(function(input) {
                var span = input.parentNode;
                input.checked = checked;
                span.style.backgroundColor = checked ? span.style.borderColor : 'transparent';
            });

            CalendarList.forEach(function(calendar) {
                calendar.checked = checked;
            });
        } else {
            findCalendar(calendarId).checked = checked;

            allCheckedCalendars = calendarElements.every(function(input) {
                return input.checked;
            });

            if (allCheckedCalendars) {
                viewAll.checked = true;
            } else {
                viewAll.checked = false;
            }
        }
        refreshScheduleVisibility();
    }
    function refreshScheduleVisibility() {
        var calendarElements = Array.prototype.slice.call(document.querySelectorAll('#calendarList input'));
        CalendarList.forEach(function(calendar) {
            cal.toggleSchedules(calendar.id, !calendar.checked, false);
        });
        cal.render(true);
        calendarElements.forEach(function(input) {
            var span = input.nextElementSibling;
            span.style.backgroundColor = input.checked ? span.style.borderColor : 'transparent';
        });
    }
    function setDropdownCalendarType() {
        var calendarTypeName = document.getElementById('calendarTypeName');
        var calendarTypeIcon = document.getElementById('calendarTypeIcon');
        var options = cal.getOptions();
        var type = cal.getViewName();
        var iconClassName;
        if (type === 'month') {
            type = 'Mês';
            iconClassName = 'calendar-icon fa fa-th';
        } else if (type === 'week') {
            type = 'Essa semana';
            iconClassName = 'calendar-icon fa fa-th-large';
        } else if (options.month.visibleWeeksCount === 2) {
            type = '2 semanas';
            iconClassName = 'calendar-icon fa fa-th-large';
        } else if (options.month.visibleWeeksCount === 3) {
            type = '3 Semanas';
            iconClassName = 'calendar-icon fa fa-th-large';
        } else{
            type = 'Hoje';
            iconClassName = 'calendar-icon fa fa-bars';
        }

        calendarTypeName.innerHTML = type;
        calendarTypeIcon.className = iconClassName;
    }

    function currentCalendarDate(format) {
      var currentDate = moment([cal.getDate().getFullYear(), cal.getDate().getMonth(), cal.getDate().getDate()]);

      return currentDate.format(format);
    }



    function setRenderRangeText() {
        var renderRange = document.getElementById('renderRange');
        var options = cal.getOptions();
        var viewName = cal.getViewName();

        var html = [];
        if (viewName === 'day') {
            html.push(currentCalendarDate('YYYY.MM.DD'));
        } else if (viewName === 'month' &&
            (!options.month.visibleWeeksCount || options.month.visibleWeeksCount > 4)) {
            html.push(currentCalendarDate('YYYY.MM'));
        } else {
            html.push(moment(cal.getDateRangeStart().getTime()).format('YYYY.MM.DD'));
            html.push(' ~ ');
            html.push(moment(cal.getDateRangeEnd().getTime()).format(' MM.DD'));
        }
        renderRange.innerHTML = html.join('');
    }


    function deleteAgendamento(schedule){
        fetch(`api/bmm_boomerangue/${schedule.id}`,{
            method:'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,  // Se estiver usando autenticação por Token
            }
        })
        .then(res=>{
            if (res.status === 204){
                cal.deleteSchedule(schedule.id, schedule.calendarId);
            }
            else{
                Swal.fire({
                    text: "Erro ao tentar excluir agendamento",
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

    function processData(data) {
        console.log(data)
        const formattedData = data.map(item => {
            var calendar = findCalendar(String(item.calendarId));
            const schedule = new ScheduleInfo();
            schedule.id = item.id; // Assuming your API response has an ID field
            schedule.calendarId = String(item.calendarId); // Set the calendar ID
            schedule.title = item.titulo_boomerangue + (item.nome_medico ? " Médico" + item.nome_medico : '' ); // Assuming a title field
            if (item.data_consulta && item.hora_consulta){
                const dateTimeString = `${item.data_consulta} ${item.hora_consulta}` ;
                const startMoment = moment(dateTimeString, 'DD/MM/YYYY HH:mm');
                schedule.start = startMoment.toDate();
                if(item.data_limite_consulta && item.hora_limite_consulta){
                    const datastring = `${item.data_limite_consulta} ${item.hora_limite_consulta}`
                    const endmoment =  moment(datastring, 'DD/MM/YYYY HH:mm');
                    schedule.end = endmoment.toDate()
                }
                else{
                    schedule.end = startMoment.clone().add(1, 'hours').toDate();
                }
            }
            schedule.isAllDay = false; // Assuming these are all-day events
            schedule.category = 'time';
            schedule.bgColor = calendar.bgColor;
            schedule.color = calendar.color;
            schedule.dragBgColor = calendar.bgColor;
            schedule.borderColor = calendar.borderColor;

            return schedule;
          });
          return formattedData
      }

    function setSchedules() {
        cal.clear();
        let data = currentCalendarDate('YYYY-MM-DD')
        // Fetch data from your API
        fetch(`api/bmm_boomerangue/agendamentos/?mes=${data}`)
                .then(response => response.json())
                .then(data => {
                // Process data from the API (optional)
                const formattedData = processData(data);
                console.log(formattedData);

                // Create schedules in the calendar
                cal.createSchedules(formattedData);
                })
                .catch(error => console.error(error));

        refreshScheduleVisibility();
    }

    function setEventListener() {
        $('#menu-navi').on('click', onClickNavi);
        $('.dropdown-menu a[role="menuitem"]').on('click', onClickMenu);
        $('#lnb-calendars').on('change', onChangeCalendars);

        $('#btn-save-schedule').on('click', onNewSchedule);
        $('#btn-new-schedule').on('click', createNewSchedule);

        $('#dropdownMenu-calendars-list').on('click', onChangeNewScheduleCalendar);

        $("#newGroup").on('click', function(){
            cadastra_grupos()
        });

        window.addEventListener('resize', resizeThrottled);
    }

    function getDataAction(target) {
        return target.dataset ? target.dataset.action : target.getAttribute('data-action');
    }

    resizeThrottled = tui.util.throttle(function() {
        cal.render();
    }, 50);

    window.cal = cal;


    function salva_atividade(schedule) {
        let lead = document.querySelector('.select_lead');
        let telefone_bm = document.querySelector(".telefone_bm");
        
        // Obter a data atual e formatá-la como dd/mm/yyyy hh:mm:ss
        let date = new Date();
        let day = String(date.getDate()).padStart(2, '0'); // Dia com dois dígitos
        let month = String(date.getMonth() + 1).padStart(2, '0'); // Mês com dois dígitos (mês começa em 0)
        let year = date.getFullYear();
        let hours = String(date.getHours()).padStart(2, '0'); // Hora com dois dígitos
        let minutes = String(date.getMinutes()).padStart(2, '0'); // Minutos com dois dígitos
        let seconds = String(date.getSeconds()).padStart(2, '0'); // Segundos com dois dígitos
    
        let formattedDate = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
        console.log("Data formatada:", formattedDate);
    
        let start = formatDate(schedule.start['_date'])
        let end = formatDate(schedule.end['_date'])

        console.log("START_SRTA", start)
        let nome_paciente = lead.options[lead.selectedIndex].text;

        let data = {
            edi_integracao: 'agendamento_' + lead.value + ' ' + formattedDate,
            telefone_bm: telefone_bm.value,
            entidade: lead.value,
            titulo_boomerangue: schedule.title,
            calendarId: schedule.calendarId,
            bm_tipo: "agendamento",
            start: start,
            end: end, 
            atributos: {
                nome_paciente: nome_paciente,
                nome_medico: 'teste'
            }
        };
    
        fetch("api/bmm_boomerangue/", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,  // Se estiver usando autenticação por Token
            },
            body: JSON.stringify(data)
        })
        .then(res => res.json())
        .then(data => {
            console.log(data);
            schedule.id = data.id
            cal.createSchedules([schedule]);
            refreshScheduleVisibility();
        });
    }

    setDropdownCalendarType();
    setRenderRangeText();
    setSchedules();
    setEventListener();
    window.resizeThrottled = resizeThrottled
})(window, tui.Calendar);

// set calendars

function formatDate(dateString) {
    // Cria um objeto Date a partir da string de data
    const date = new Date(dateString);

    // Extrai os componentes da data
    const day = String(date.getDate()).padStart(2, '0'); // Dia com zero à esquerda
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês com zero à esquerda
    const year = date.getFullYear(); // Ano
    const hours = String(date.getHours()).padStart(2, '0'); // Hora com zero à esquerda
    const minutes = String(date.getMinutes()).padStart(2, '0'); // Minutos com zero à esquerda

    // Formata a data e a hora
    const formattedDate = `${day}/${month}/${year}`;
    const formattedTime = `${hours}:${minutes}`;

    return { date: formattedDate, time: formattedTime }; // Retorna um objeto com data e hora formatadas
}

function load_groups(){
        var calendarList = document.getElementById('calendarList');
        var html = [];
        CalendarList.forEach(function(calendar) {
            html.push('<div class="lnb-calendars-item"><label>' +
                '<input type="checkbox" class="tui-full-calendar-checkbox-round" value="' + calendar.id + '" checked>' +
                '<span style="border-color: ' + calendar.borderColor + '; background-color: ' + calendar.borderColor + ';"></span>' +
                '<span>' + calendar.name + '</span>' +
                '</label></div>'
            );
        });
        calendarList.innerHTML = html.join('\n');
}

function updateSchedule(scheduleId, changes) {
    console.log(changes)
    // if(changes['start']){
    //     changes['start'] = formatDate(changes['start'])
    // }
    fetch(`api/bmm_boomerangue/${scheduleId}/`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrftoken,  // Se estiver usando autenticação por Token
        },
        body: JSON.stringify({
            changes:changes,
            telefone_bm: $(".telefone_bm").val().replace(/\D/g, ''),
            entidade: $(".select_lead").val()
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Schedule updated successfully:', data);
        // Atualizar o front-end ou dar algum feedback visual para o usuário, se necessário
    })
    .catch((error) => {
        console.error('Error updating schedule:', error);
    });
}

function retorna_dados(schedule){
    console.log(schedule)
    fetch(`api/bmm_boomerangue/${schedule.id}/`)
    .then(res=>res.json())
    .then(data=>{
        carrega_tel = 1
        console.log(data)
            const leadId = data.entidade;

            // Seleciona o elemento select
            const leadSelect = document.querySelector('.select_lead');
            var $select = $(leadSelect);

            // Verifica se o lead já está presente no dropdown
            if (!leadSelect.querySelector(`option[value="${leadId}"]`)) {
                // Se não estiver presente, busca o lead específico do banco
                $.ajax({
                    url: `api/create-entidade/carregaLeads/`,
                    dataType: 'json',
                    delay: 250,
                    data: {
                        id: leadId,
                        page: 1
                    },
                    success: function(response) {
                        const leadData = response.results.find(lead => lead.id == leadId);
                        console.log('lead_data', leadData)
                        if (leadData) {
                            // Adiciona a nova opção ao dropdown
                            const option = new Option(leadData.Entidade, leadData.id, true, true);
                            $select.append(option).trigger('change');
                        } else {
                            console.error("Lead não encontrado no banco de dados.");
                        }
                    },
                    error: function() {
                        console.error('Erro ao buscar o lead no banco de dados.');
                    }
                });
            } else {
                // Se já estiver presente, apenas dispara o evento change
                $select.val(leadId).trigger('change');
            }
        $(".telefone_bm").val(data.telefone_bm)
    })
}

    function cadastra_grupos(){
        let nome = $("#nome").val()
        let color = $("#color_text").val()
        let bg_color = $("#bg_color").val()

        console.log(nome, color, bg_color)
        if(nome == ''){
            Swal.fire({
                text: "Campo Nome é obrigatório",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                  confirmButton: "btn btn-primary"
                }
              });
            return;
        }

        fetch("api/grupoAgendamentos/",{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': csrftoken,
            },

            body: JSON.stringify({
                nome: nome,
                color: color,
                bg_color:bg_color
            })
        })
        .then(res=>res.json())
        .then(data=>{
            console.log(data)
            if(data.id){
                $("#crate-group").modal('hide');
                fetchAndLoadCalendars()
            }
            else{
                Swal.fire({
                    text: "Erro ao tentar salvar grupo",
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



