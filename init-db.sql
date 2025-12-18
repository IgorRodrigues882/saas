-- Script de inicialização dos bancos de dados MySQL
-- Este script cria os bancos de dados necessários para o projeto Boomerangue

-- ==================================================
-- BANCO DE DADOS PRINCIPAL
-- ==================================================

-- Criar banco de dados principal se não existir
CREATE DATABASE IF NOT EXISTS boomeranguev4
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Garantir permissões para o usuário
GRANT ALL PRIVILEGES ON boomeranguev4.* TO 'bmm_normal'@'%';

-- ==================================================
-- BANCO DE DADOS PIX (Transações de Pagamento)
-- ==================================================

-- Criar banco de dados PIX se não existir
CREATE DATABASE IF NOT EXISTS boomeranguepixv4
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- Garantir permissões para o usuário
GRANT ALL PRIVILEGES ON boomeranguepixv4.* TO 'bmm_normal'@'%';

-- ==================================================
-- FLUSH PRIVILEGES
-- ==================================================

FLUSH PRIVILEGES;

-- ==================================================
-- INFORMAÇÕES ADICIONAIS
-- ==================================================

-- Selecionar banco principal para uso
USE boomeranguev4;

-- Exibir informações
SELECT 'Bancos de dados criados com sucesso!' AS Status;
SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME
FROM information_schema.SCHEMATA
WHERE SCHEMA_NAME IN ('boomeranguev4', 'boomeranguepixv4');
