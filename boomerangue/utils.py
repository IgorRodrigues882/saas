
from unidecode import unidecode

def custom_normalize(language, value):
    return unidecode(value)