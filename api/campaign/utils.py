from datetime import datetime
from django.utils.dateparse import parse_date, parse_time

def format_date_for_django(date_string):
    """
    Converte uma string de data em qualquer formato para o formato padrão do Django (YYYY-MM-DD).
    """
    try:
        # Tenta parsear a data usando o parse_date do Django
        parsed_date = parse_date(date_string)
        if parsed_date:
            return parsed_date.strftime('%Y-%m-%d')
        
        # Se o parse_date falhar, tenta com datetime
        parsed_date = datetime.strptime(date_string, '%d/%m/%Y')  # Ajuste o formato conforme necessário
        return parsed_date.strftime('%Y-%m-%d')
    except ValueError:
        # Se não conseguir parsear, retorna None ou lança uma exceção
        return None

def format_time_for_django(time_string):
    """
    Converte uma string de hora para o formato padrão do Django (HH:MM:SS),
    mantendo o horário original sem ajustes de fuso horário.
    """
    try:
        # Tenta parsear a hora usando o parse_time do Django
        parsed_time = parse_time(time_string)
        if parsed_time:
            return parsed_time.strftime('%H:%M:%S')
        
        # Se o parse_time falhar, tenta com formatos comuns
        formats = ['%H:%M:%S', '%H:%M', '%I:%M:%S %p', '%I:%M %p']
        for fmt in formats:
            try:
                parsed_time = datetime.strptime(time_string, fmt).time()
                return parsed_time.strftime('%H:%M:%S')
            except ValueError:
                continue
        
        # Se nenhum formato funcionar, lança uma exceção
        raise ValueError(f"Formato de hora não reconhecido: {time_string}")
    except ValueError as e:
        # Se não conseguir parsear, retorna None ou relança a exceção
        print(f"Erro ao parsear hora: {e}")
        return None