# 🏗️ Core Module - Connect Valley API

Este diretório contém a **Camada de Infraestrutura** global da aplicação. 

## 📂 Organização Interna

### 1. `database/` (Multi-Database)
Gerencia a conexão com os dois bancos de dados do ecossistema:
* **`database.constants.ts`**: Define as constantes `DB_CONNECT` e `DB_CRM`. Isso evita erros de digitação ao injetar repositórios nos serviços.

### 2. `supabase/` (Auth Admin)
Centraliza a comunicação administrativa com o Supabase.
* **`supabase.service.ts`**: Cliente que utiliza a `SERVICE_ROLE_KEY`. É o único serviço com permissão para disparar Magic Links e gerenciar metadados de usuários sem intervenção do cliente.
* **`supabase.module.ts`**: Módulo marcado como `@Global()`, tornando o `SupabaseService` disponível em toda a API automaticamente.

---

## 🛠️ Dependências do Core
Para que o `core` funcione, o arquivo `.env` na raiz do backend deve conter:
- `CONNECT_DB_URL`: String de conexão (Banco de Eventos).
- `CRM_DB_URL`: String de conexão (Banco CRM).
- `SUPABASE_URL`: URL do projeto no Supabase.
- `SUPABASE_SERVICE_ROLE_KEY`: Chave secreta administrativa.

---

## 🚀 Fluxo de Uso
Os módulos de funcionalidade (`modules/`) consomem o `core` para:
1. Realizar queries em bancos específicos via TypeORM.
2. Autenticar usuários via Magic Link através do `SupabaseService`.

---
> **Atenção:** Alterações no `core` impactam a estabilidade de toda a API. Mantenha este diretório livre de regras de negócio.