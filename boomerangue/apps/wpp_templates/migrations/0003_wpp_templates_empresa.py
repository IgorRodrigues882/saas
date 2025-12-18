
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("ger_empresas", "0006_rename_empresa_id_ger_empresa_b2b_empresa_and_more"),
        ("wpp_templates", "0002_alter_wpp_templates_statusregistro_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="wpp_templates",
            name="empresa",
            field=models.ForeignKey(
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                to="ger_empresas.ger_empresas",
            ),
        ),
    ]