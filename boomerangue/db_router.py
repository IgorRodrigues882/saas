class PixDBRouter:
    """
    Um roteador para controlar operações de banco de dados em modelos
    associados ao banco de dados `pix_db`.
    """
    def db_for_read(self, model, **hints):
        if model._meta.app_label == 'pix_database':
            return 'pix_db'
        return None

    def db_for_write(self, model, **hints):
        if model._meta.app_label == 'pix_database':
            return 'pix_db'
        return None

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        if app_label == 'pix_database':
            return db == 'pix_db'
        return None
